import Category from '../models/Category.js'
import Product from '../models/Product.js'
import AppError from '../utils/AppError.js'
import asyncHandler from '../utils/asyncHandler.js'

// GET /api/categories   (logged in) - every category with the number of active products in it
export const listCategories = asyncHandler(async (req, res) => {
  const [categories, counts] = await Promise.all([
    Category.find({}).sort({ name: 1 }),
    // group the products by category and count them (one aggregation, not one query per category)
    Product.aggregate([{ $match: { isActive: true } }, { $group: { _id: '$category', count: { $sum: 1 } } }]),
  ])
  const countById = new Map(counts.map((row) => [String(row._id), row.count]))

  const data = categories.map((category) => ({
    ...category.toJSON(),
    productCount: countById.get(String(category._id)) || 0,
  }))
  res.json({ success: true, data })
})

// POST /api/categories   body: { name, description }   (admin)
export const createCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body
  const category = await Category.create({ name, description })
  res.status(201).json({ success: true, message: 'Category added', data: category })
})

// PUT /api/categories/:id   (admin)
export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id)
  if (!category) throw new AppError('Category not found', 404)

  if (req.body.name !== undefined) category.name = req.body.name
  if (req.body.description !== undefined) category.description = req.body.description
  await category.save()

  res.json({ success: true, message: 'Category updated', data: category })
})

// DELETE /api/categories/:id   (admin)
// A category that still has products cannot be deleted, or those products would point to nothing.
export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id)
  if (!category) throw new AppError('Category not found', 404)

  const inUse = await Product.countDocuments({ category: category._id })
  if (inUse > 0) {
    throw new AppError(`This category still has ${inUse} product(s). Move or remove them first.`, 409)
  }

  await category.deleteOne()
  res.json({ success: true, message: 'Category deleted' })
})
