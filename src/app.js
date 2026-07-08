import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'

import adminRoutes from './routes/admin.js'
import crmRoutes from './routes/crm.js'
import publicRoutes from './routes/public.js'
import { notFound, errorHandler } from './middleware/error.js'

export function createApp() {
  const app = express()

  app.set('trust proxy', 1)
  app.use(helmet())

  const origins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:5281')
    .split(',').map((s) => s.trim()).filter(Boolean)
  app.use(cors({
    origin(origin, cb) {
      // allow same-origin / curl (no origin) and any whitelisted frontend
      if (!origin || origins.includes(origin)) return cb(null, true)
      return cb(new Error(`Origin ${origin} not allowed by CORS`))
    },
    credentials: true,
  }))

  app.use(express.json({ limit: '15mb' }))       // large limit for base64 image uploads
  app.use(express.urlencoded({ extended: true }))
  app.use(cookieParser())
  if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'))

  // Throttle the auth endpoints against brute force
  const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false })
  app.use('/api/admin/auth', authLimiter)
  app.use('/api/auth', authLimiter)

  app.get('/api/health', (req, res) => res.json({ ok: true, service: 'wandra-backend', time: new Date().toISOString() }))

  app.use('/api/admin', adminRoutes)
  app.use('/api/public', publicRoutes)
  app.use('/api', crmRoutes)

  app.use(notFound)
  app.use(errorHandler)
  return app
}

export default createApp
