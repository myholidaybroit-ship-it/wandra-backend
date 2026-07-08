import { asyncHandler } from '../../utils/asyncHandler.js'
import { ApiError } from '../../utils/ApiError.js'
import { signToken } from '../../utils/jwt.js'
import User from '../../models/User.js'
import Agency from '../../models/Agency.js'
import Role from '../../models/Role.js'

/** Shape the /me payload the CRM store bootstraps from. */
async function sessionPayload(user, agency) {
  const role = await Role.findOne({ agency: agency._id, name: user.role })
  const perms = role ? Object.fromEntries(role.perms) : {}
  const canSeePricing = role?.system || perms.viewPricing !== false
  return {
    user: user.toJSON(),
    agency: agency.toJSON(),
    role: role ? role.toJSON() : null,
    isAdmin: !!role?.system,
    canSeePricing,
  }
}

/** POST /api/auth/login  { email, password } */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) throw ApiError.badRequest('Email and password are required')
  const user = await User.findOne({ email: String(email).toLowerCase() }).select('+passwordHash')
  if (!user) throw ApiError.unauthorized('Invalid credentials')

  const agency = await Agency.findById(user.agency)
  if (!agency) throw ApiError.unauthorized('Agency not found')
  if (agency.status === 'suspended') throw ApiError.forbidden('Your agency account is suspended. Contact Wandra support.')
  if (user.status !== 'Active') throw ApiError.forbidden('Your account is inactive.')
  if (!(await user.checkPassword(password))) throw ApiError.unauthorized('Invalid credentials')

  const token = signToken({ realm: 'agency', sub: user.id, agency: agency.id, role: user.role })
  res.json({ token, ...(await sessionPayload(user, agency)) })
})

/** GET /api/auth/me */
export const me = asyncHandler(async (req, res) => {
  res.json(await sessionPayload(req.user, req.agency))
})

/** POST /api/auth/password  { current, next } */
export const changePassword = asyncHandler(async (req, res) => {
  const { current, next } = req.body
  const user = await User.findById(req.user.id).select('+passwordHash')
  if (!(await user.checkPassword(current || ''))) throw ApiError.badRequest('Current password is incorrect')
  await user.setPassword(next)
  await user.save()
  res.json({ ok: true })
})
