import { asyncHandler } from '../../utils/asyncHandler.js'
import { ApiError } from '../../utils/ApiError.js'
import Agency from '../../models/Agency.js'
import Role from '../../models/Role.js'
import User from '../../models/User.js'

/**
 * Per-agency CRM feature roles, managed by the Wandra team. Agencies only see
 * a read-only view of these in the CRM — when they need a new role or a
 * permission change they send a request, and it's configured from here.
 */

const assertAgency = async (id) => {
  const agency = await Agency.findById(id)
  if (!agency) throw ApiError.notFound('Agency not found')
  return agency
}

/** Attach how many of the agency's users currently hold each role. */
const withMembers = async (agencyId, roles) => {
  const users = await User.find({ agency: agencyId }).select('role')
  const counts = users.reduce((m, u) => { m[u.role] = (m[u.role] || 0) + 1; return m }, {})
  return roles.map((r) => ({ ...r.toJSON(), members: counts[r.name] || 0 }))
}

/** GET /api/admin/agencies/:id/roles */
export const list = asyncHandler(async (req, res) => {
  await assertAgency(req.params.id)
  const roles = await Role.find({ agency: req.params.id }).sort('createdAt')
  const items = await withMembers(req.params.id, roles)
  res.json({ items, total: items.length })
})

/** POST /api/admin/agencies/:id/roles  { name, perms? } */
export const create = asyncHandler(async (req, res) => {
  await assertAgency(req.params.id)
  const name = String(req.body.name || '').trim()
  if (!name) throw ApiError.badRequest('Role name is required')
  const exists = await Role.findOne({ agency: req.params.id, name })
  if (exists) throw ApiError.conflict('A role with this name already exists')
  const role = await Role.create({
    agency: req.params.id,
    name,
    perms: { dashboard: true, clients: true, viewPricing: true, ...(req.body.perms || {}) },
  })
  res.status(201).json({ ...role.toJSON(), members: 0 })
})

/** PATCH /api/admin/agencies/:id/roles/:roleId  { key, value } or { perms } — Admin stays locked. */
export const update = asyncHandler(async (req, res) => {
  const role = await Role.findOne({ _id: req.params.roleId, agency: req.params.id })
  if (!role) throw ApiError.notFound('Role not found')
  if (role.system) throw ApiError.badRequest('The Admin role always has full access')
  if (req.body.key != null) role.perms.set(String(req.body.key), !!req.body.value)
  if (req.body.perms && typeof req.body.perms === 'object') {
    Object.entries(req.body.perms).forEach(([k, v]) => role.perms.set(k, !!v))
  }
  await role.save()
  const [item] = await withMembers(req.params.id, [role])
  res.json(item)
})

/** DELETE /api/admin/agencies/:id/roles/:roleId */
export const remove = asyncHandler(async (req, res) => {
  const role = await Role.findOne({ _id: req.params.roleId, agency: req.params.id })
  if (!role) throw ApiError.notFound('Role not found')
  if (role.system) throw ApiError.badRequest('System roles cannot be deleted')
  const members = await User.countDocuments({ agency: req.params.id, role: role.name })
  if (members > 0) throw ApiError.badRequest(`${members} teammate${members === 1 ? ' still holds' : 's still hold'} this role — move them to another role first`)
  await role.deleteOne()
  res.json({ ok: true, id: req.params.roleId })
})
