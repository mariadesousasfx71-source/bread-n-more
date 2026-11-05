import express from 'express'
import { summary, dailyRevenue, topProducts, salesByCategory } from '../controllers/reportController.js'
import { protect, requireRole } from '../middleware/auth.js'

const router = express.Router()

router.use(protect, requireRole('admin'))

router.get('/summary', summary)
router.get('/daily-revenue', dailyRevenue)
router.get('/top-products', topProducts)
router.get('/sales-by-category', salesByCategory)

export default router
