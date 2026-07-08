import { asyncHandler } from '../../utils/asyncHandler.js'
import { ApiError } from '../../utils/ApiError.js'
import { clientCode } from '../../utils/codes.js'
import Client from '../../models/Client.js'
import User from '../../models/User.js'
import AssignmentConfig from '../../models/AssignmentConfig.js'
import { runAssignment } from '../../services/assignment.js'
import { uploadIfDataUrl } from '../../services/storage.js'

const AUTO = '__auto__'

/** GET /api/clients  (?q=&tripStatus=&source=) */
export const list = asyncHandler(async (req, res) => {
  const q = { agency: req.agencyId }
  if (req.query.tripStatus) q.tripStatus = req.query.tripStatus
  if (req.query.source) q.source = req.query.source
  if (req.query.q) {
    const rx = new RegExp(String(req.query.q).trim(), 'i')
    q.$or = [{ name: rx }, { code: rx }, { phone: rx }, { email: rx }, { interest: rx }]
  }
  const items = await Client.find(q).sort('-createdAt')
  res.json({ items, total: items.length })
})

/** GET /api/clients/:id */
export const getOne = asyncHandler(async (req, res) => {
  const client = await Client.findOne({ _id: req.params.id, agency: req.agencyId })
  if (!client) throw ApiError.notFound('Client not found')
  res.json(client)
})

/**
 * POST /api/clients — create a lead/client. If no assignee (or '__auto__'),
 * run the tenant's lead-assignment rules (round robin) to pick one.
 */
export const create = asyncHandler(async (req, res) => {
  const data = { ...req.body }
  const code = await clientCode(req.agencyId)

  const query = data.query || {}
  if (!query.assignee || query.assignee === AUTO) {
    const [cfg, activeUsers] = await Promise.all([
      AssignmentConfig.findOne({ agency: req.agencyId }),
      User.find({ agency: req.agencyId, status: 'Active' }).select('name'),
    ])
    const activeNames = activeUsers.map((u) => u.name)
    const { assignee, via } = runAssignment(cfg, activeNames, data)
    query.assignee = assignee
    query.assignedVia = via
    if (cfg) await cfg.save() // persist rotation pointers
  }

  const client = await Client.create({
    ...data,
    agency: req.agencyId,
    code,
    tripStatus: data.tripStatus || 'New Query',
    query,
  })
  res.status(201).json(client)
})

/** PATCH /api/clients/:id */
export const update = asyncHandler(async (req, res) => {
  const patch = { ...req.body }
  delete patch.agency; delete patch.code; delete patch.id
  const client = await Client.findOneAndUpdate(
    { _id: req.params.id, agency: req.agencyId }, patch, { new: true, runValidators: true },
  )
  if (!client) throw ApiError.notFound('Client not found')
  res.json(client)
})

/** DELETE /api/clients/:id */
export const remove = asyncHandler(async (req, res) => {
  const client = await Client.findOneAndDelete({ _id: req.params.id, agency: req.agencyId })
  if (!client) throw ApiError.notFound('Client not found')
  res.json({ ok: true, id: req.params.id })
})

/** POST /api/clients/:id/docs */
export const addDoc = asyncHandler(async (req, res) => {
  const client = await Client.findOne({ _id: req.params.id, agency: req.agencyId })
  if (!client) throw ApiError.notFound('Client not found')
  const doc = { ...req.body }
  // safety net: push a raw data-URL document straight to S3
  if (doc.url) doc.url = await uploadIfDataUrl(doc.url, { folder: `agencies/${req.agencyId}/client-docs` })
  client.docs.unshift({ uploadedAt: new Date().toISOString().slice(0, 10), ...doc })
  await client.save()
  res.status(201).json(client)
})

/** DELETE /api/clients/:id/docs/:docId */
export const removeDoc = asyncHandler(async (req, res) => {
  const client = await Client.findOne({ _id: req.params.id, agency: req.agencyId })
  if (!client) throw ApiError.notFound('Client not found')
  client.docs.pull(req.params.docId)
  await client.save()
  res.json(client)
})
