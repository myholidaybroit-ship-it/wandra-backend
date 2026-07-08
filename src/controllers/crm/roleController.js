import { asyncHandler } from '../../utils/asyncHandler.js'
import { ApiError } from '../../utils/ApiError.js'
import Role from '../../models/Role.js'

/** GET /api/roles */
export const list = asyncHandler(async (req, res) => {
  const items = await Role.find({ agency: req.agencyId }).sort('createdAt')
  res.json({ items, total: items.length })
})

/** POST /api/roles  { name } */
export const create = asyncHandler(async (req, res) => {
  const { name } = req.body
  if (!name) throw ApiError.badRequest('Role name is required')
  const exists = await Role.findOne({ agency: req.agencyId, name })
  if (exists) throw ApiError.conflict('A role with this name already exists')
  const role = await Role.create({
    agency: req.agencyId, name,
    perms: { dashboard: true, clients: true, viewPricing: true },
  })
  res.status(201).json(role)
})

/** PATCH /api/roles/:id/perm  { key, value } — cannot edit a system role. */
export const setPerm = asyncHandler(async (req, res) => {
  const role = await Role.findOne({ _id: req.params.id, agency: req.agencyId })
  if (!role) throw ApiError.notFound('Role not found')
  if (role.system) throw ApiError.badRequest('System roles cannot be modified')
  role.perms.set(req.body.key, !!req.body.value)
  await role.save()
  res.json(role)
})

/** DELETE /api/roles/:id — system roles are protected. */
export const remove = asyncHandler(async (req, res) => {
  const role = await Role.findOne({ _id: req.params.id, agency: req.agencyId })
  if (!role) throw ApiError.notFound('Role not found')
  if (role.system) throw ApiError.badRequest('System roles cannot be deleted')
  await role.deleteOne()
  res.json({ ok: true, id: req.params.id })
})
