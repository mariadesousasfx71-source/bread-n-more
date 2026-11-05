import validator from 'validator'
import User from '../models/User.js'
import AppError from '../utils/AppError.js'
import asyncHandler from '../utils/asyncHandler.js'
import { signToken } from '../middleware/auth.js'

// The only user fields we ever send back (never the password hash)
const safeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
})

// POST /api/auth/register   body: { name, email, password }
// Creates a staff account. It is "pending" until an admin approves it.
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body

  // typeof check: stops tricks like { "email": { "$ne": null } } (NoSQL injection)
  if ([name, email, password].some((value) => typeof value !== 'string' || !value.trim())) {
    throw new AppError('Please fill in name, email and password', 400)
  }
  if (!validator.isEmail(email)) throw new AppError('Please enter a valid email', 400)
  if (password.length < 8) throw new AppError('Password must be at least 8 characters', 400)

  const exists = await User.findOne({ email: email.toLowerCase() })
  if (exists) throw new AppError('An account with this email already exists', 409)

  // role and status are NOT taken from the request: nobody can sign up as admin
  await User.create({ name, email, password })

  res.status(201).json({
    success: true,
    message: 'Account created. An admin must approve it before you can log in.',
  })
})

// POST /api/auth/login   body: { email, password }
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body
  if (typeof email !== 'string' || typeof password !== 'string') {
    throw new AppError('Please enter your email and password', 400)
  }

  // the password field is hidden by default, so we ask for it with +password
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password')

  // Same message for "no such email" and "wrong password", so nobody can find out which emails exist
  if (!user || !(await user.matchPassword(password))) {
    throw new AppError('Invalid email or password', 401)
  }
  if (user.status === 'blocked') throw new AppError('Your account is blocked. Please contact the admin.', 403)
  if (user.status === 'pending') throw new AppError('Your account is waiting for admin approval.', 403)

  res.json({ success: true, token: signToken(user), user: safeUser(user) })
})

// GET /api/auth/me   (logged in) - who am I?
export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: safeUser(req.user) })
})
