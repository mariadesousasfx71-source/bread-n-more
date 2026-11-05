import express from 'express'
import { listUsers, updateUserStatus } from '../controllers/userController.js'
import { protect, requireRole } from '../middleware/auth.js'

const router = express.Router()

// every route in this file: logged in AND admin
router.use(protect, requireRole('admin'))

router.get('/', listUsers)
router.patch('/:id/status', updateUserStatus)

export default router
