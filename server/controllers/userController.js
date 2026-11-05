import User, { USER_STATUSES } from '../models/User.js'
import AppError from '../utils/AppError.js'
import asyncHandler from '../utils/asyncHandler.js'
import { getPaging, pageInfo, escapeRegex } from '../utils/paginate.js'

// GET /api/users?status=pending&search=maria&page=1&limit=10   (admin)
// The staff list. Admin accounts are not listed, so they cannot be changed by mistake.
export const listUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaging(req.query)
  const filter = { role: 'user' }

  if (req.query.status) {
    if (!USER_STATUSES.includes(req.query.status)) throw new AppError('Unknown status', 400)
    filter.status = req.query.status
  }
  if (req.query.search) {
    const pattern = new RegExp(escapeRegex(String(req.query.search).trim()), 'i') // i = ignore capital letters
    filter.$or = [{ name: pattern }, { email: pattern }]
  }

  const [data, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ])

  res.json({ success: true, data, pagination: pageInfo(page, limit, total) })
})

// PATCH /api/users/:id/status   body: { status: 'approved' | 'blocked' | 'pending' }   (admin)
export const updateUserStatus = asyncHandler(async (req, res) => {
  const { status } = req.body
  if (!USER_STATUSES.includes(status)) {
    throw new AppError(`Status must be one of: ${USER_STATUSES.join(', ')}`, 400)
  }

  const user = await User.findById(req.params.id)
  if (!user) throw new AppError('User not found', 404)
  if (user.role === 'admin') throw new AppError('Admin accounts cannot be changed here', 403)

  user.status = status
  await user.save()

  res.json({ success: true, message: `${user.name} is now ${status}`, data: user })
})
