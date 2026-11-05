import express from 'express'
import {
  createCakeOrder,
  myCakeOrders,
  allCakeOrders,
  getCakeOrder,
  quoteCakeOrder,
  acceptQuote,
  updateCakeStatus,
  recordAdvance,
  cancelMyCakeOrder,
} from '../controllers/cakeOrderController.js'
import { protect, requireRole } from '../middleware/auth.js'

const router = express.Router()

router.use(protect)

router.post('/', createCakeOrder)
router.get('/mine', myCakeOrders) // ("/mine" before "/:id")
router.get('/', requireRole('admin'), allCakeOrders)
router.get('/:id', getCakeOrder)
router.patch('/:id/accept', acceptQuote)
router.patch('/:id/cancel', cancelMyCakeOrder)
router.patch('/:id/quote', requireRole('admin'), quoteCakeOrder)
router.patch('/:id/status', requireRole('admin'), updateCakeStatus)
router.patch('/:id/advance', requireRole('admin'), recordAdvance)

export default router
