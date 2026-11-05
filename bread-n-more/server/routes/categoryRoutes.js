import express from 'express'
import { listCategories, createCategory, updateCategory, deleteCategory } from '../controllers/categoryController.js'
import { protect, requireRole } from '../middleware/auth.js'

const router = express.Router()

router.use(protect)

router.get('/', listCategories) // anyone logged in
router.post('/', requireRole('admin'), createCategory)
router.put('/:id', requireRole('admin'), updateCategory)
router.delete('/:id', requireRole('admin'), deleteCategory)

export default router
