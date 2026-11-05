import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import AppError from '../utils/AppError.js'
import asyncHandler from '../utils/asyncHandler.js'

// Makes the login token (JWT). It carries the user's id and role and expires by itself.
export const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  })

// GUARD 1: "are you logged in?"  ->  401 if not, 403 if the account is not approved.
// The website sends the token in a header:   Authorization: Bearer <token>
export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) throw new AppError('Please log in to continue', 401)

  // Throws if the token is fake or expired. The error handler turns that into a 401.
  const decoded = jwt.verify(token, process.env.JWT_SECRET)

  // Always check the database: an admin may have blocked this person AFTER the token was made
  const user = await User.findById(decoded.id)
  if (!user) throw new AppError('This account no longer exists', 401)
  if (user.status === 'blocked') throw new AppError('Your account is blocked. Please contact the admin.', 403)
  if (user.status === 'pending') throw new AppError('Your account is waiting for admin approval.', 403)

  req.user = user
  next()
})

// GUARD 2: "are you allowed to do this?"  ->  403 if your role is not in the list.
//   router.get('/', protect, requireRole('admin'), listUsers)
export const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to do this', 403))
    }
    next()
  }
