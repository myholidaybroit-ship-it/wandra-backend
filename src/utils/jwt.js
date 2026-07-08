import jwt from 'jsonwebtoken'

const secret = () => process.env.JWT_SECRET || 'dev-insecure-secret'

export function signToken(payload) {
  return jwt.sign(payload, secret(), { expiresIn: process.env.JWT_EXPIRES_IN || '7d' })
}

export function verifyToken(token) {
  return jwt.verify(token, secret())
}

/** Pull a bearer token from the Authorization header or an auth cookie. */
export function extractToken(req) {
  const h = req.headers.authorization || ''
  if (h.startsWith('Bearer ')) return h.slice(7).trim()
  if (req.cookies?.token) return req.cookies.token
  return null
}
