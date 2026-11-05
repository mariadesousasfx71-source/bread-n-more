import express from 'express'
import {
  listProducts,
  lowStockProducts,
  getProduct,
  stockHistory,
  createProduct,
  updateProduct,
  adjustStock,
  deleteProduct,
} from '../controllers/productController.js'
import { protect, requireRole } from '../middleware/auth.js'
import upload from '../middleware/upload.js'

const router = express.Router()

// every route in this file needs a logged-in, approved account
router.use(protect)

// Anyone logged in can look
router.get('/', listProducts)
// ("/low-stock" must come BEFORE "/:id", or Express would treat it as an id)
router.get('/low-stock', requireRole('admin'), lowStockProducts)
router.get('/:id', getProduct)
router.get('/:id/movements', requireRole('admin'), stockHistory)

// Only an admin can change things
router.post('/', requireRole('admin'), upload.single('image'), createProduct)
router.put('/:id', requireRole('admin'), upload.single('image'), updateProduct)
router.patch('/:id/stock', requireRole('admin'), adjustStock)
router.delete('/:id', requireRole('admin'), deleteProduct)

export default router
