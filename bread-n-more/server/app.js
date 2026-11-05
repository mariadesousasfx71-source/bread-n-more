import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import AppError from './utils/AppError.js'
import { notFound, errorHandler } from './middleware/errorHandler.js'
import authRoutes from './routes/authRoutes.js'
import userRoutes from './routes/userRoutes.js'
import categoryRoutes from './routes/categoryRoutes.js'
import productRoutes from './routes/productRoutes.js'
import orderRoutes from './routes/orderRoutes.js'
import cakeOrderRoutes from './routes/cakeOrderRoutes.js'
import reportRoutes from './routes/reportRoutes.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadsDir = path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

const app = express()

// Hosting services (Render, Railway...) put a proxy in front of the app.
// This lets the rate limiter see the visitor's real address.
app.set('trust proxy', 1)

// ---- security middlewares ----
// "cross-origin" lets the website (another address) show product photos from /uploads
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))

// CORS: only the websites listed in CLIENT_URL may call the API from a browser (NOT "*")
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((url) => url.trim())
app.use(
  cors({
    origin: (origin, callback) => {
      // no "origin" means Postman or curl, not a browser
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
      callback(new AppError('This website is not allowed to use the API', 403))
    },
  })
)

app.use(express.json({ limit: '100kb' }))

// Product photos live in server/uploads and are served at  /uploads/<file name>
app.use('/uploads', express.static(uploadsDir))

// ---- api endpoints ----
app.get('/api/health', (req, res) => res.json({ success: true, message: 'Bread & More API is working' }))
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/cake-orders', cakeOrderRoutes)
app.use('/api/reports', reportRoutes)

// ---- last two: unknown address (404) and the one central error handler ----
app.use(notFound)
app.use(errorHandler)

export default app
