import mongoose from 'mongoose'
import Order, { ORDER_STATUSES } from '../models/Order.js'
import Product from '../models/Product.js'
import User from '../models/User.js'
import AppError from '../utils/AppError.js'
import asyncHandler from '../utils/asyncHandler.js'
import { getPaging, pageInfo, escapeRegex } from '../utils/paginate.js'
import { dateRangeFilter } from '../utils/dates.js'
import { logMovements } from '../utils/stock.js'

const MAX_LINES = 30 // different products in one order
const MAX_QUANTITY = 100 // of one product

// Which statuses an order may come FROM, for each status an admin can set
const ALLOWED_CHANGES = {
  confirmed: ['pending'],
  completed: ['confirmed'],
  cancelled: ['pending', 'confirmed'],
}

// Puts the items of a cancelled order back on the shelf, and writes each one in the stock ledger
const restock = async (order, userId) => {
  const entries = []
  for (const item of order.items) {
    const product = await Product.findOneAndUpdate({ _id: item.product }, { $inc: { stock: item.quantity } }, { new: true })
    if (product) {
      entries.push({
        product: product._id,
        user: userId,
        order: order._id,
        type: 'order_cancelled',
        change: item.quantity,
        balanceAfter: product.stock,
        reason: 'Order cancelled',
      })
    }
  }
  await logMovements(entries)
}

// ---------------------------------------------------------------------------
// POST /api/orders    body: { items: [{ product: "<id>", quantity: 2 }], note: "..." }
// THE STOCK MATH. Rules: stock never goes below 0, and two orders arriving at the
// same moment can never sell the same last item twice.
// ---------------------------------------------------------------------------
export const createOrder = asyncHandler(async (req, res) => {
  const { items, note, customerName } = req.body

  if (!Array.isArray(items) || items.length === 0) throw new AppError('Add at least one item to the order', 400)
  if (items.length > MAX_LINES) throw new AppError(`An order can have at most ${MAX_LINES} different products`, 400)

  // 1. Check the input and merge repeated products: [{A,1},{A,2}] becomes A -> 3
  const wanted = new Map()
  for (const line of items) {
    const id = String(line?.product ?? '')
    const quantity = Number(line?.quantity)
    if (!mongoose.isValidObjectId(id)) throw new AppError('Invalid product id', 400)
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
      throw new AppError(`Quantity must be a whole number from 1 to ${MAX_QUANTITY}`, 400)
    }
    wanted.set(id, (wanted.get(id) || 0) + quantity)
  }

  // 2. Take the stock, one product at a time, with an ATOMIC "check and subtract".
  //    The filter { stock: { $gte: quantity } } and the $inc happen together inside MongoDB.
  //    If someone else took the last item a moment ago, the filter no longer matches
  //    and we get null: this order is refused instead of overselling.
  const reserved = [] // products we already took stock from
  const giveBack = async () => {
    for (const { product, quantity } of reserved) {
      await Product.updateOne({ _id: product._id }, { $inc: { stock: quantity } })
    }
  }

  let order
  try {
    for (const [id, quantity] of wanted) {
      const product = await Product.findOneAndUpdate(
        { _id: id, isActive: true, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } },
        { new: true }
      )

      if (!product) {
        // find out WHY it failed, so the message is helpful
        const current = await Product.findById(id).select('name stock isActive')
        if (!current || !current.isActive) throw new AppError('One of the products is no longer available', 404)
        throw new AppError(`Not enough stock for ${current.name}. Only ${current.stock} left.`, 400)
      }
      reserved.push({ product, quantity })
    }

    // 3. All stock taken. Build the order from the DATABASE values (never trust prices from the browser).
    const orderItems = reserved.map(({ product, quantity }) => ({
      product: product._id,
      name: product.name,
      price: product.price,
      quantity,
    }))
    const total = Math.round(orderItems.reduce((sum, line) => sum + line.price * line.quantity, 0) * 100) / 100

    order = await Order.create({
      user: req.user._id,
      items: orderItems,
      total,
      customerName: typeof customerName === 'string' ? customerName : '',
      note: typeof note === 'string' ? note : '',
    })
  } catch (error) {
    // 4. Anything went wrong: put back every item we already took, then report the error
    await giveBack()
    throw error
  }

  // 5. Write the sales in the stock ledger (after the order exists, so each line can point to it)
  await logMovements(
    reserved.map(({ product, quantity }) => ({
      product: product._id,
      user: req.user._id,
      order: order._id,
      type: 'sale',
      change: -quantity,
      balanceAfter: product.stock, // the stock right after OUR subtraction
      reason: 'Order placed',
    }))
  )

  res.status(201).json({ success: true, message: 'Order placed', data: order })
})

// Builds the filter shared by "my orders" and "all orders": ?status=pending&from=2026-11-01&to=2026-11-30
const baseFilter = (query) => {
  const filter = {}
  if (query.status) {
    if (!ORDER_STATUSES.includes(query.status)) throw new AppError('Unknown order status', 400)
    filter.status = query.status
  }
  const range = dateRangeFilter(query.from, query.to)
  if (range) filter.createdAt = range
  return filter
}

// GET /api/orders/mine   - the logged-in person's own order history
export const myOrders = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaging(req.query)
  const filter = { ...baseFilter(req.query), user: req.user._id }

  const [data, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(filter),
  ])
  res.json({ success: true, data, pagination: pageInfo(page, limit, total) })
})

// GET /api/orders?status=&from=&to=&search=   (admin) - every order, with the person's name
export const allOrders = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaging(req.query)
  const filter = baseFilter(req.query)

  // search by the staff member's name or email, or by the customer's name
  if (req.query.search) {
    const pattern = new RegExp(escapeRegex(String(req.query.search).trim()), 'i')
    const people = await User.find({ $or: [{ name: pattern }, { email: pattern }] }).select('_id')
    // match the staff member OR the customer's name written on the order
    filter.$or = [{ user: { $in: people.map((person) => person._id) } }, { customerName: pattern }]
  }

  const [data, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('user', 'name email'), // populate = replace the id with the real user
    Order.countDocuments(filter),
  ])
  res.json({ success: true, data, pagination: pageInfo(page, limit, total) })
})

// GET /api/orders/:id   - one order. Its owner or an admin only (otherwise 403).
export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email')
  if (!order) throw new AppError('Order not found', 404)

  const isOwner = String(order.user._id) === String(req.user._id)
  if (!isOwner && req.user.role !== 'admin') throw new AppError('You can only view your own orders', 403)

  res.json({ success: true, data: order })
})

// PATCH /api/orders/:id/status   body: { status: 'confirmed' | 'completed' | 'cancelled' }   (admin)
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body
  // Object.hasOwn: so that a word like "constructor" is not mistaken for a status
  const from = typeof status === 'string' && Object.hasOwn(ALLOWED_CHANGES, status) ? ALLOWED_CHANGES[status] : null
  if (!from) throw new AppError('Status must be confirmed, completed or cancelled', 400)

  // The status is only changed if the order is currently in an allowed status.
  // Because this is ONE atomic step, two admins cannot cancel (and restock) the same order twice.
  const order = await Order.findOneAndUpdate({ _id: req.params.id, status: { $in: from } }, { status }, { new: true })

  if (!order) {
    const exists = await Order.exists({ _id: req.params.id })
    throw exists
      ? new AppError(`This order cannot be changed to "${status}" from its current status`, 400)
      : new AppError('Order not found', 404)
  }

  if (status === 'cancelled') await restock(order, req.user._id)
  res.json({ success: true, message: `Order is now ${status}`, data: order })
})

// PATCH /api/orders/:id/cancel   - staff cancel their OWN order, only while it is still "pending"
export const cancelMyOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id, status: 'pending' },
    { status: 'cancelled' },
    { new: true }
  )

  if (!order) {
    const existing = await Order.findById(req.params.id)
    if (!existing) throw new AppError('Order not found', 404)
    if (String(existing.user) !== String(req.user._id)) throw new AppError('You can only cancel your own orders', 403)
    throw new AppError('Only pending orders can be cancelled', 400)
  }

  await restock(order, req.user._id)
  res.json({ success: true, message: 'Order cancelled', data: order })
})
