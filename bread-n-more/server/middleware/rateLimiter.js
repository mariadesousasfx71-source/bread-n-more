import rateLimit from 'express-rate-limit'

// Used on /api/auth/*: stops someone trying thousands of passwords.
// After the limit, the server answers 429 (Too Many Requests).
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: Number(process.env.AUTH_RATE_LIMIT) || 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again in 15 minutes.' },
})
