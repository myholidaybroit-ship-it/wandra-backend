import { ApiError } from '../utils/ApiError.js'

/** 404 for unmatched routes. */
export function notFound(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`))
}

/** Central error handler → uniform JSON envelope. */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let status = err.status || 500
  let message = err.message || 'Internal server error'
  let details = err.details

  // Mongoose / Mongo specific mapping
  if (err.name === 'ValidationError') {
    status = 400
    details = Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v.message]))
    message = 'Validation failed'
  } else if (err.name === 'CastError') {
    status = 400
    message = `Invalid ${err.path}: ${err.value}`
  } else if (err.code === 11000) {
    status = 409
    message = 'Duplicate value'
    details = err.keyValue
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    status = 401
    message = 'Invalid or expired token'
  }

  if (status >= 500) console.error('x', err)

  res.status(status).json({ error: message, ...(details ? { details } : {}) })
}
