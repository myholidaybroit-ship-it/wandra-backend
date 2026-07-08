import { asyncHandler } from '../../utils/asyncHandler.js'
import { ApiError } from '../../utils/ApiError.js'
import User from '../../models/User.js'
import AssignmentConfig from '../../models/AssignmentConfig.js'
import Client from '../../models/Client.js'

/** GET /api/users */
export const list = asyncHandler(async (req, res) => {
  const items = await User.find({ agency: req.agencyId }).sort('-createdAt')
  res.json({ items, total: items.length })
})

/** POST /api/users */
export const create = asyncHandler(async (req, res) => {
  const { name, email, role, phone, department, designation, password } = req.body
  if (!name || !email) throw ApiError.badRequest('Name and email are required')
  const exists = await User.findOne({ agency: req.agencyId, email: String(email).toLowerCase() })
  if (exists) throw ApiError.conflict('A user with this email already exists')
  const user = new User({
    agency: req.agencyId, name, email, role: role || 'Sales', phone, department, designation,
    status: 'Active',
  })
  await user.setPassword(password || 'wandra1234')
  await user.save()
  res.status(201).json(user)
})

/** PATCH /api/users/:id — renaming cascades to assignment rotations + lead assignees. */
export const update = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, agency: req.agencyId })
  if (!user) throw ApiError.notFound('User not found')
  const prevName = user.name
  const patch = { ...req.body }
  delete patch.agency; delete patch.passwordHash; delete patch.id
  if (patch.password) { await user.setPassword(patch.password); delete patch.password }
  Object.assign(user, patch)
  await user.save()

  if (patch.name && patch.name !== prevName) {
    const from = prevName, to = patch.name
    const cfg = await AssignmentConfig.findOne({ agency: req.agencyId })
    if (cfg) {
      cfg.rules.forEach((r) => { r.members = r.members.map((m) => (m === from ? to : m)) })
      if (cfg.fallback) cfg.fallback.members = (cfg.fallback.members || []).map((m) => (m === from ? to : m))
      await cfg.save()
    }
    await Client.updateMany({ agency: req.agencyId, 'query.assignee': from }, { $set: { 'query.assignee': to } })
  }
  res.json(user)
})

/** DELETE /api/users/:id — Owner cannot be removed; drops them from rotations. */
export const remove = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, agency: req.agencyId })
  if (!user) throw ApiError.notFound('User not found')
  if (user.designation === 'Owner') throw ApiError.badRequest('The Owner account cannot be deleted')
  await user.deleteOne()
  const cfg = await AssignmentConfig.findOne({ agency: req.agencyId })
  if (cfg) {
    cfg.rules.forEach((r) => {
      if (r.members.includes(user.name)) { r.members = r.members.filter((m) => m !== user.name); r.next = 0 }
    })
    if (cfg.fallback) { cfg.fallback.members = (cfg.fallback.members || []).filter((m) => m !== user.name); cfg.fallback.next = 0 }
    await cfg.save()
  }
  res.json({ ok: true, id: req.params.id })
})
