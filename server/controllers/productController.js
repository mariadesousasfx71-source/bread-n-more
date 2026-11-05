import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import Product from '../models/Product.js'
import Category from '../models/Category.js'
import StockMovement from '../models/StockMovement.js'
import AppError from '../utils/AppError.js'
import asyncHandler from '../utils/asyncHandler.js'
import { getPaging, pageInfo, escapeRegex } from '../utils/paginate.js'
import { logMovements } from '../utils/stock.js'
import { uploadsDir } from '../config/uploadsPaths.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// "low stock" = stock is at or below the product's own lowStockThreshold
const LOW_STOCK = { $expr: { $lte: ['$stock', '$lowStockThreshold'] } }

// Turns text from a form into a number, or throws a 400 error
const toNumber = (value, label) => {
  const number = Number(value)
  if (value === '' || value === null || !Number.isFinite(number)) {
    throw new AppError(`${label} must be a number`, 400)
  }
  return number
}

// Makes sure the category id really points to a category (400 if not)
const checkCategory = async (id) => {
  const exists = await Category.exists({ _id: id })
  if (!exists) throw new AppError('That category does not exist', 400)
}

// Deletes a photo that was uploaded through the app (never the starter pictures)
const deleteUploadedPhoto = (imagePath) => {
  if (typeof imagePath !== 'string' || !imagePath.startsWith('/uploads/')) return
  const file = path.basename(imagePath)
  if (!/^\d{10,}-/.test(file)) return
  fs.unlink(path.join(uploadsDir, file), () => {})
}

// GET /api/products?page=1&limit=12&search=bread&category=<id>&stock=low&sort=price_asc
// Search, filter, sort and paging all happen HERE, in the database, not in the browser.
export const listProducts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaging(req.query, 12)
  const isAdmin = req.user.role === 'admin'
  const filter = {}

  // Staff only see active products. An admin can ask for everything with ?includeInactive=true
  if (!(isAdmin && req.query.includeInactive === 'true')) filter.isActive = true

  if (req.query.search) {
    const pattern = new RegExp(escapeRegex(String(req.query.search).trim()), 'i')
    filter.$or = [{ name: pattern }, { sku: pattern }]
  }
  // String(): blocks tricks like ?category[$ne]=x. A wrong id gives a 400 (CastError).
  if (req.query.category) filter.category = String(req.query.category)

  if (req.query.stock === 'out') filter.stock = 0
  else if (req.query.stock === 'in') filter.stock = { $gt: 0 }
  else if (req.query.stock === 'low') Object.assign(filter, LOW_STOCK)

  const sorts = {
    newest: { createdAt: -1 },
    name: { name: 1 },
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    stock_asc: { stock: 1 },
  }
  const sort = Object.hasOwn(sorts, req.query.sort) ? sorts[req.query.sort] : sorts.newest

  const [data, total] = await Promise.all([
    // populate: replace the category id by { _id, name } so the website can show "Breads"
    Product.find(filter).sort(sort).skip(skip).limit(limit).populate('category', 'name'),
    Product.countDocuments(filter),
  ])

  res.json({ success: true, data, pagination: pageInfo(page, limit, total) })
})

// GET /api/products/low-stock   (admin) - products that need baking or re-ordering, emptiest first
export const lowStockProducts = asyncHandler(async (req, res) => {
  const data = await Product.find({ isActive: true, ...LOW_STOCK }).sort({ stock: 1 }).limit(50).populate('category', 'name')
  res.json({ success: true, data })
})

// GET /api/products/:id
export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('category', 'name')
  if (!product || (!product.isActive && req.user.role !== 'admin')) {
    throw new AppError('Product not found', 404)
  }
  res.json({ success: true, data: product })
})

// GET /api/products/:id/movements   (admin) - the stock ledger of one product, newest first
export const stockHistory = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaging(req.query, 15)
  const product = await Product.findById(req.params.id).populate('category', 'name')
  if (!product) throw new AppError('Product not found', 404)

  const filter = { product: product._id }
  const [data, total] = await Promise.all([
    StockMovement.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name') // who did it
      .populate('order', 'customerName status'), // which order (for sales)
    StockMovement.countDocuments(filter),
  ])

  res.json({ success: true, product, data, pagination: pageInfo(page, limit, total) })
})

// POST /api/products   (admin, form with an optional "image" file)
export const createProduct = asyncHandler(async (req, res) => {
  const { name, sku, description, category, unit, price, stock, lowStockThreshold } = req.body

  try {
    await checkCategory(category)
    const product = await Product.create({
      name,
      description,
      category,
      unit: unit || undefined, // empty -> the schema default
      price: toNumber(price, 'Price'),
      stock: stock === undefined || stock === '' ? 0 : toNumber(stock, 'Stock'),
      lowStockThreshold: lowStockThreshold === undefined || lowStockThreshold === '' ? 5 : toNumber(lowStockThreshold, 'Low-stock level'),
      sku: sku || undefined, // an empty box must not be saved as ""
      image: req.file ? `/uploads/${req.file.filename}` : '',
    })

    if (product.stock > 0) {
      await logMovements([
        { product: product._id, user: req.user._id, type: 'initial', change: product.stock, balanceAfter: product.stock, reason: 'Product added' },
      ])
    }
    res.status(201).json({ success: true, message: 'Product added', data: product })
  } catch (error) {
    // the product was not saved, so do not keep its photo
    if (req.file) deleteUploadedPhoto(`/uploads/${req.file.filename}`)
    throw error
  }
})

// PUT /api/products/:id   (admin) - edit any field. Send only what changed.
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
  if (!product) {
    if (req.file) deleteUploadedPhoto(`/uploads/${req.file.filename}`)
    throw new AppError('Product not found', 404)
  }

  const { name, sku, description, category, unit, price, stock, lowStockThreshold, isActive } = req.body
  const oldImage = product.image
  const oldStock = product.stock

  try {
    if (category !== undefined) {
      await checkCategory(category)
      product.category = category
    }
    if (name !== undefined) product.name = name
    if (description !== undefined) product.description = description
    if (unit !== undefined && unit !== '') product.unit = unit
    if (sku !== undefined) product.sku = sku || undefined
    if (price !== undefined) product.price = toNumber(price, 'Price')
    if (stock !== undefined) product.stock = toNumber(stock, 'Stock')
    if (lowStockThreshold !== undefined) product.lowStockThreshold = toNumber(lowStockThreshold, 'Low-stock level')
    if (isActive !== undefined) product.isActive = isActive === true || isActive === 'true'
    if (req.file) product.image = `/uploads/${req.file.filename}`

    await product.save() // runs all the schema rules again
  } catch (error) {
    if (req.file) deleteUploadedPhoto(`/uploads/${req.file.filename}`)
    throw error
  }

  // if the stock number was changed in the form, the ledger records it
  if (product.stock !== oldStock) {
    await logMovements([
      {
        product: product._id,
        user: req.user._id,
        type: 'adjustment',
        change: product.stock - oldStock,
        balanceAfter: product.stock,
        reason: 'Changed in the product form',
      },
    ])
  }

  if (req.file) deleteUploadedPhoto(oldImage)
  await product.populate('category', 'name')
  res.json({ success: true, message: 'Product updated', data: product })
})

// PATCH /api/products/:id/stock   body: { change: 20, reason: "Morning bake" }  or  { change: -3, type: "waste" }   (admin)
// Adds stock (a bake or a delivery) or removes it (unsold, damaged...).
export const adjustStock = asyncHandler(async (req, res) => {
  const change = Number(req.body.change)
  if (!Number.isInteger(change) || change === 0) {
    throw new AppError('"change" must be a whole number that is not 0, for example 20 or -3', 400)
  }

  // Removing stock: the condition stock >= amount makes sure it can never go below 0
  const filter = { _id: req.params.id }
  if (change < 0) filter.stock = { $gte: -change }

  // $inc changes the number INSIDE the database in one step (safe even if two people click at once)
  const product = await Product.findOneAndUpdate(filter, { $inc: { stock: change } }, { new: true })

  if (!product) {
    const exists = await Product.exists({ _id: req.params.id })
    throw exists ? new AppError('There is not enough stock to remove that many', 400) : new AppError('Product not found', 404)
  }

  const type = change > 0 ? 'restock' : req.body.type === 'waste' ? 'waste' : 'adjustment'
  await logMovements([
    {
      product: product._id,
      user: req.user._id,
      type,
      change,
      balanceAfter: product.stock,
      reason: typeof req.body.reason === 'string' ? req.body.reason.slice(0, 120) : '',
    },
  ])

  res.json({ success: true, message: 'Stock updated', data: product })
})

// DELETE /api/products/:id   (admin) - "soft delete": hide the product, keep the record
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true })
  if (!product) throw new AppError('Product not found', 404)
  res.json({ success: true, message: 'Product removed from the shop' })
})

