import Order from '../models/Order.js'
import Product from '../models/Product.js'
import User from '../models/User.js'
import CakeOrder from '../models/CakeOrder.js'
import AppError from '../utils/AppError.js'
import asyncHandler from '../utils/asyncHandler.js'
import { addDays, dayEnd, dayStart, isDay, timezoneForMongo, todayString } from '../utils/dates.js'

const round = (number) => Math.round(number * 100) / 100

// Reads ?from=&to= (default: the last N days) and checks them
const readRange = (query, defaultDays) => {
  const to = query.to || todayString()
  const from = query.from || addDays(to, -(defaultDays - 1))
  if (!isDay(from) || !isDay(to)) throw new AppError('Dates must look like 2026-11-30 (year-month-day)', 400)
  if (from > to) throw new AppError('"from" must not be after "to"', 400)
  if (addDays(from, 365) < to) throw new AppError('Please choose a range of at most one year', 400)
  return { from, to, createdAt: { $gte: dayStart(from), $lte: dayEnd(to) } }
}

// GET /api/reports/summary   (admin) - the numbers on the dashboard
export const summary = asyncHandler(async (req, res) => {
  const today = todayString()
  const todayRange = { $gte: dayStart(today), $lte: dayEnd(today) }
  const soon = { $gte: dayStart(today), $lte: dayEnd(addDays(today, 3)) } // cakes needed in the next 3 days

  const [totalProducts, lowStock, outOfStock, pendingStaff, ordersToday, revenue, newCakeRequests, cakesDueSoon] = await Promise.all([
    Product.countDocuments({ isActive: true }),
    Product.countDocuments({ isActive: true, $expr: { $lte: ['$stock', '$lowStockThreshold'] } }),
    Product.countDocuments({ isActive: true, stock: 0 }),
    User.countDocuments({ role: 'user', status: 'pending' }),
    Order.countDocuments({ createdAt: todayRange }),
    // revenue = the total of today's orders that are not cancelled
    Order.aggregate([
      { $match: { createdAt: todayRange, status: { $ne: 'cancelled' } } },
      { $group: { _id: null, revenue: { $sum: '$total' } } },
    ]),
    CakeOrder.countDocuments({ status: 'requested' }), // waiting for the admin to set a price
    CakeOrder.countDocuments({ status: { $in: ['confirmed', 'ready'] }, requiredDate: soon }), // to bake or hand over soon
  ])

  res.json({
    success: true,
    data: {
      totalProducts,
      lowStock,
      outOfStock,
      pendingStaff,
      ordersToday,
      revenueToday: round(revenue[0]?.revenue || 0),
      newCakeRequests,
      cakesDueSoon,
    },
  })
})

// GET /api/reports/daily-revenue?from=2026-11-01&to=2026-11-07   (admin)
// One row per day: how many orders and how much money. Cancelled orders are not counted.
// Without dates it shows the last 7 days.
export const dailyRevenue = asyncHandler(async (req, res) => {
  const { from, to, createdAt } = readRange(req.query, 7)

  const rows = await Order.aggregate([
    { $match: { createdAt, status: { $ne: 'cancelled' } } },
    {
      $group: {
        // turn each order's time into a "YYYY-MM-DD" day in the shop's time zone, then group by that day
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: timezoneForMongo() } },
        orders: { $sum: 1 },
        revenue: { $sum: '$total' },
      },
    },
    { $sort: { _id: 1 } },
  ])

  // days with no orders do not appear in the database result, so fill them in with zeros
  const byDay = new Map(rows.map((row) => [row._id, row]))
  const data = []
  for (let day = from; day <= to; day = addDays(day, 1)) {
    const row = byDay.get(day)
    data.push({ date: day, orders: row ? row.orders : 0, revenue: row ? round(row.revenue) : 0 })
  }

  const totals = data.reduce((sum, row) => ({ orders: sum.orders + row.orders, revenue: sum.revenue + row.revenue }), { orders: 0, revenue: 0 })
  res.json({ success: true, data, totals: { orders: totals.orders, revenue: round(totals.revenue) } })
})

// GET /api/reports/top-products?from=&to=&limit=5   (admin) - the best sellers (default: last 30 days)
// $unwind turns an order with 3 lines into 3 rows, so each product line can be added up.
export const topProducts = asyncHandler(async (req, res) => {
  const { createdAt } = readRange(req.query, 30)
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 5, 1), 20)

  const data = await Order.aggregate([
    { $match: { createdAt, status: { $ne: 'cancelled' } } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        name: { $first: '$items.name' },
        quantity: { $sum: '$items.quantity' },
        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
      },
    },
    { $sort: { quantity: -1 } },
    { $limit: limit },
  ])

  res.json({ success: true, data: data.map((row) => ({ product: row._id, name: row.name, quantity: row.quantity, revenue: round(row.revenue) })) })
})

// GET /api/reports/sales-by-category?from=&to=   (admin) (default: last 30 days)
// THE RELATIONS REPORT. An order line only knows its product, and a product only knows its category.
// $lookup works like a SQL JOIN: orders -> products -> categories, then we add up per category.
export const salesByCategory = asyncHandler(async (req, res) => {
  const { createdAt } = readRange(req.query, 30)

  const data = await Order.aggregate([
    { $match: { createdAt, status: { $ne: 'cancelled' } } },
    { $unwind: '$items' },
    { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'product' } },
    { $unwind: '$product' },
    { $lookup: { from: 'categories', localField: 'product.category', foreignField: '_id', as: 'category' } },
    { $unwind: '$category' },
    {
      $group: {
        _id: '$category.name',
        quantity: { $sum: '$items.quantity' },
        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
      },
    },
    { $sort: { revenue: -1 } },
  ])

  res.json({ success: true, data: data.map((row) => ({ category: row._id, quantity: row.quantity, revenue: round(row.revenue) })) })
})
