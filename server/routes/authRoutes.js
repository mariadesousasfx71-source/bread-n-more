import express from 'express'
import { register, login, me } from '../controllers/authController.js'
import { protect } from '../middleware/auth.js'
import { authLimiter } from '../middleware/rateLimiter.js'

const router = express.Router()

// the rate limiter only guards the two routes where passwords are tried
router.post('/register', authLimiter, register)
router.post('/login', authLimiter, login)
router.get('/me', protect, me)

export default router
