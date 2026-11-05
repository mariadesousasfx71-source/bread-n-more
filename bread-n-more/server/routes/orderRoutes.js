import express from 'express'
import {
  createOrder,
  myOrders,
  allOrders,
  getOrder,
  updateOrderStatus,
  cancelMyOrder,
} from '../controllers/orderController.js'
import { protect, requireRole } from '../middleware/auth.js'

const router = express.Router()

router.use(protect)

router.post('/', createOrder)
router.get('/mine', myOrders) // ("/mine" before "/:id")
router.get('/', requireRole('admin'), allOrders)
router.get('/:id', getOrder)
router.patch('/:id/cancel', cancelMyOrder)
router.patch('/:id/status', requireRole('admin'), updateOrderStatus)

export default router
