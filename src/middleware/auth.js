import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { extractToken, verifyToken } from '../utils/jwt.js'
import { trialState } from '../services/trial.js'
import AdminUser from '../models/AdminUser.js'
import User from '../models/User.js'
import Agency from '../models/Agency.js'

/** Super-admin realm — protects /api/admin/* (except auth). */
export const adminAuth = asyncHandler(async (req, res, next) => {
  const token = extractToken(req)
  if (!token) throw ApiError.unauthorized('Missing token')
  const payload = verifyToken(token)
  if (payload.realm !== 'admin') throw ApiError.forbidden('Admin access required')
  const admin = await AdminUser.findById(payload.sub)
  if (!admin) throw ApiError.unauthorized('Admin account not found')
  req.admin = admin
  next()
})

/** Agency realm — protects /api/* CRM routes. Attaches user + agency + tenant id. */
export const agencyAuth = asyncHandler(async (req, res, next) => {
  const token = extractToken(req)
  if (!token) throw ApiError.unauthorized('Missing token')
  const payload = verifyToken(token)
  if (payload.realm !== 'agency') throw ApiError.forbidden('Agency access required')

  const [user, agency] = await Promise.all([
    User.findById(payload.sub),
    Agency.findById(payload.agency),
  ])
  if (!user || !agency) throw ApiError.unauthorized('Account not found')
  if (agency.status === 'suspended') throw ApiError.forbidden('Agency account suspended')
  if (trialState(agency).expired) throw ApiError.forbidden('Your free trial has ended. Please upgrade to the Pro plan or contact Wandra to extend it.')

  req.user = user
  req.agency = agency
  req.agencyId = agency._id
  next()
})

/**
 * Require a role permission (from the user's Role.perms map). Admin/system roles
 * always pass. Used to protect sensitive CRM actions (e.g. invoices, settings).
 */
export function requirePerm(permKey) {
  return asyncHandler(async (req, res, next) => {
    const role = await import('../models/Role.js').then((m) => m.default.findOne({ agency: req.agencyId, name: req.user.role }))
    if (role?.system) return next()
    if (role && role.perms?.get?.(permKey) === false) throw ApiError.forbidden(`Missing permission: ${permKey}`)
    next()
  })
}
