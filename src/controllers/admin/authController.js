import { asyncHandler } from '../../utils/asyncHandler.js'
import { ApiError } from '../../utils/ApiError.js'
import { signToken } from '../../utils/jwt.js'
import AdminUser from '../../models/AdminUser.js'

/** Read the super-admin credentials from the environment (single source of truth). */
function envCreds() {
  return {
    email: (process.env.SUPER_ADMIN_EMAIL || '').toLowerCase().trim(),
    password: process.env.SUPER_ADMIN_PASSWORD || '',
  }
}

/** Ensure a profile doc exists for the env admin (carries name / notify prefs). */
async function ensureAdmin(email) {
  let admin = await AdminUser.findOne({ email })
  if (!admin) admin = await AdminUser.create({ email, name: 'Wandra Admin', role: 'Super Admin', notifyNewAgency: true })
  return admin
}

/**
 * POST /api/admin/auth/login
 * Authenticates the admin panel against the .env credentials — change them in
 * .env (and restart the backend) to change the admin login.
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body
  const env = envCreds()
  if (!env.email || !env.password) {
    throw new ApiError(500, 'Admin credentials are not configured. Set SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD in the backend .env file.')
  }
  if (!email || !password) throw ApiError.badRequest('Email and password are required')
  const matches = String(email).toLowerCase().trim() === env.email && password === env.password
  if (!matches) throw ApiError.unauthorized('Invalid credentials')

  const admin = await ensureAdmin(env.email)
  const token = signToken({ realm: 'admin', sub: admin.id })
  res.json({ token, admin: admin.toJSON() })
})

/** GET /api/admin/auth/me */
export const me = asyncHandler(async (req, res) => {
  res.json({ admin: req.admin.toJSON() })
})

/**
 * PATCH /api/admin/auth/profile — edit display name & notification prefs only.
 * The login email is fixed by .env, so it can't be changed here.
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, notifyNewAgency } = req.body
  if (name != null) req.admin.name = name
  if (notifyNewAgency != null) req.admin.notifyNewAgency = notifyNewAgency
  await req.admin.save()
  res.json({ admin: req.admin.toJSON() })
})

const PASSWORD_MANAGED_MSG =
  'The admin password is managed in the server\'s .env file (SUPER_ADMIN_PASSWORD). ' +
  'Update it there and restart the backend.'

/** POST /api/admin/auth/password — env-managed; informs the operator. */
export const changePassword = asyncHandler(async () => { throw ApiError.badRequest(PASSWORD_MANAGED_MSG) })

/** POST /api/admin/auth/reset-password — env-managed; informs the operator. */
export const resetPassword = asyncHandler(async () => { throw ApiError.badRequest(PASSWORD_MANAGED_MSG) })
