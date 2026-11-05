import mongoose from 'mongoose'
import CakeOrder, { CAKE_STATUSES } from '../models/CakeOrder.js'
import Product from '../models/Product.js'
import User from '../models/User.js'
import AppError from '../utils/AppError.js'
import asyncHandler from '../utils/asyncHandler.js'
import { getPaging, pageInfo, escapeRegex } from '../utils/paginate.js'
import { addDays, dateRangeFilter, dayStart, isDay, todayString } from '../utils/dates.js'

const MIN_DAYS_NOTICE = 2 // a special cake needs at least 2 days' notice
const MAX_DAYS_AHEAD = 90

// Which statuses an order may come FROM, for each status the admin can set
const ADMIN_CHANGES = {
  paid: ['confirmed'], // the customer paid the whole price
  ready: ['confirmed', 'paid'],
  delivered: ['ready'],
  cancelled: ['requested', 'quoted', 'confirmed'],
}

const toMoney = (value, label) => {
  const number = Number(value)
  if (value === '' || value === null || value === undefined || !Number.isFinite(number) || number < 0) {
    throw new AppError(`${label} must be a number, 0 or more`, 400)
  }
  return Math.round(number * 100) / 100
}

// Reads one cake order, or throws 404
const findOr404 = async (id) => {
  const order = await CakeOrder.findById(id)
  if (!order) throw new AppError('Cake order not found', 404)
  return order
}

// POST /api/cake-orders   (logged in) - a staff member takes a special-cake request from a customer
export const createCakeOrder = asyncHandler(async (req, res) => {
  const { baseCake, customerName, customerPhone, flavour, weightKg, messageOnCake, designNotes, requiredDate } = req.body

  // the date: a text like 2026-12-24, at least 2 days from today, at most 90 days
  const day = String(requiredDate || '')
  if (!isDay(day)) throw new AppError('Please choose the date the cake is needed', 400)
  const earliest = addDays(todayString(), MIN_DAYS_NOTICE)
  if (day < earliest) throw new AppError(`Special cakes need at least ${MIN_DAYS_NOTICE} days' notice. Choose ${earliest} or later.`, 400)
  if (day > addDays(todayString(), MAX_DAYS_AHEAD)) throw new AppError(`We take cake orders up to ${MAX_DAYS_AHEAD} days ahead`, 400)

  // the optional link to a cake on the menu
  if (baseCake) {
    if (!mongoose.isValidObjectId(baseCake)) throw new AppError('Invalid cake id', 400)
    const cake = await Product.findOne({ _id: baseCake, isActive: true })
    if (!cake) throw new AppError('That cake is not on the menu', 400)
  }

  const order = await CakeOrder.create({
    user: req.user._id, // taken from the token, never from the request
    baseCake: baseCake || undefined,
    customerName,
    customerPhone,
    flavour,
    weightKg: Number(weightKg),
    messageOnCake,
    designNotes,
    requiredDate: dayStart(day),
  })

  res.status(201).json({ success: true, message: 'Cake request saved. The admin will set the price.', data: order })
})

// Builds the filter shared by both lists: ?status=quoted&from=2026-12-01&to=2026-12-31 (dates of the day the cake is NEEDED)
const baseFilter = (query) => {
  const filter = {}
  if (query.status) {
    if (!CAKE_STATUSES.includes(query.status)) throw new AppError('Unknown cake order status', 400)
    filter.status = query.status
  }
  const range = dateRangeFilter(query.from, query.to)
  if (range) filter.requiredDate = range
  return filter
}

// GET /api/cake-orders/mine
export const myCakeOrders = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaging(req.query)
  const filter = { ...baseFilter(req.query), user: req.user._id }

  const [data, total] = await Promise.all([
    CakeOrder.find(filter).sort({ requiredDate: 1 }).skip(skip).limit(limit).populate('baseCake', 'name'),
    CakeOrder.countDocuments(filter),
  ])
  res.json({ success: true, data, pagination: pageInfo(page, limit, total) })
})

// GET /api/cake-orders?status=&from=&to=&search=   (admin) - the baking list, earliest date first
export const allCakeOrders = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaging(req.query)
  const filter = baseFilter(req.query)

  if (req.query.search) {
    const pattern = new RegExp(escapeRegex(String(req.query.search).trim()), 'i')
    const people = await User.find({ $or: [{ name: pattern }, { email: pattern }] }).select('_id')
    filter.$or = [{ customerName: pattern }, { customerPhone: pattern }, { user: { $in: people.map((p) => p._id) } }]
  }

  const [data, total] = await Promise.all([
    CakeOrder.find(filter)
      .sort({ requiredDate: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name') // the staff member
      .populate('baseCake', 'name'), // the cake on the menu
    CakeOrder.countDocuments(filter),
  ])
  res.json({ success: true, data, pagination: pageInfo(page, limit, total) })
})

// GET /api/cake-orders/:id   - its owner or an admin only
export const getCakeOrder = asyncHandler(async (req, res) => {
  const order = await CakeOrder.findById(req.params.id).populate('user', 'name').populate('baseCake', 'name')
  if (!order) throw new AppError('Cake order not found', 404)
  if (String(order.user._id) !== String(req.user._id) && req.user.role !== 'admin') {
    throw new AppError('You can only view your own cake orders', 403)
  }
  res.json({ success: true, data: order })
})

// PATCH /api/cake-orders/:id/quote   body: { quotedPrice, adminNote }   (admin)
export const quoteCakeOrder = asyncHandler(async (req, res) => {
  const quotedPrice = toMoney(req.body.quotedPrice, 'The price')
  if (quotedPrice <= 0) throw new AppError('The price must be more than 0', 400)

  const update = { status: 'quoted', quotedPrice }
  if (typeof req.body.adminNote === 'string') update.adminNote = req.body.adminNote.slice(0, 200)

  // only works while the request is "requested" or "quoted" (you may change a quote)
  const order = await CakeOrder.findOneAndUpdate({ _id: req.params.id, status: { $in: ['requested', 'quoted'] } }, update, {
    new: true,
    runValidators: true,
  })
  if (!order) {
    await findOr404(req.params.id)
    throw new AppError('A price can only be set while the request is "requested" or "quoted"', 400)
  }
  res.json({ success: true, message: 'Price set', data: order })
})

// PATCH /api/cake-orders/:id/accept   body: { advancePaid }   (the staff member who took it)
// The customer agreed to the price. The order is now confirmed, and the advance (if any) is written down.
export const acceptQuote = asyncHandler(async (req, res) => {
  const current = await findOr404(req.params.id)
  if (String(current.user) !== String(req.user._id)) throw new AppError('You can only change your own cake orders', 403)
  if (current.status !== 'quoted') throw new AppError('There is no price to accept yet', 400)

  const advancePaid = req.body.advancePaid === undefined || req.body.advancePaid === '' ? 0 : toMoney(req.body.advancePaid, 'The advance')
  if (advancePaid > current.quotedPrice) throw new AppError('The advance cannot be more than the price', 400)

  const order = await CakeOrder.findOneAndUpdate(
    { _id: current._id, user: req.user._id, status: 'quoted' },
    { status: 'confirmed', advancePaid },
    { new: true }
  )
  if (!order) throw new AppError('This cake order has just changed. Please refresh.', 400)
  res.json({ success: true, message: 'Cake order confirmed', data: order })
})

// PATCH /api/cake-orders/:id/status   body: { status: 'paid' | 'ready' | 'delivered' | 'cancelled' }   (admin)
export const updateCakeStatus = asyncHandler(async (req, res) => {
  const { status } = req.body
  const from = typeof status === 'string' && Object.hasOwn(ADMIN_CHANGES, status) ? ADMIN_CHANGES[status] : null
  if (!from) throw new AppError('Status must be paid, ready, delivered or cancelled', 400)

  const update = { status }
  if (status === 'paid') {
    // paying in full: the advance becomes the whole price (so the balance is 0)
    const current = await findOr404(req.params.id)
    if (current.quotedPrice == null) throw new AppError('Set a price before marking the order as paid', 400)
    update.advancePaid = current.quotedPrice
  }

  const order = await CakeOrder.findOneAndUpdate({ _id: req.params.id, status: { $in: from } }, update, { new: true })
  if (!order) {
    await findOr404(req.params.id)
    throw new AppError(`This cake order cannot be changed to "${status}" from its current status`, 400)
  }
  res.json({ success: true, message: `Cake order is now ${status}`, data: order })
})

// PATCH /api/cake-orders/:id/advance   body: { advancePaid }   (admin) - record more advance money
export const recordAdvance = asyncHandler(async (req, res) => {
  const advancePaid = toMoney(req.body.advancePaid, 'The advance')
  const current = await findOr404(req.params.id)
  if (!['confirmed', 'ready'].includes(current.status)) throw new AppError('An advance can only be recorded on a confirmed order', 400)
  if (advancePaid > current.quotedPrice) throw new AppError('The advance cannot be more than the price', 400)

  current.advancePaid = advancePaid
  await current.save()
  res.json({ success: true, message: 'Advance recorded', data: current })
})

// PATCH /api/cake-orders/:id/cancel   (the staff member who took it) - only before the customer agreed
export const cancelMyCakeOrder = asyncHandler(async (req, res) => {
  const order = await CakeOrder.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id, status: { $in: ['requested', 'quoted'] } },
    { status: 'cancelled' },
    { new: true }
  )
  if (!order) {
    const existing = await findOr404(req.params.id)
    if (String(existing.user) !== String(req.user._id)) throw new AppError('You can only cancel your own cake orders', 403)
    throw new AppError('Only requests that are not confirmed yet can be cancelled here. Ask the admin.', 400)
  }
  res.json({ success: true, message: 'Cake order cancelled', data: order })
})
