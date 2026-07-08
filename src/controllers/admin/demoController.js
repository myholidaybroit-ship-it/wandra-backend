import { asyncHandler } from '../../utils/asyncHandler.js'
import { ApiError } from '../../utils/ApiError.js'
import DemoRequest from '../../models/DemoRequest.js'

/** GET /api/admin/demos */
export const list = asyncHandler(async (req, res) => {
  const q = {}
  if (req.query.status) q.status = req.query.status
  const items = await DemoRequest.find(q).sort('-createdAt')
  res.json({ items, total: items.length })
})

/** POST /api/admin/demos */
export const create = asyncHandler(async (req, res) => {
  const demo = await DemoRequest.create(req.body)
  res.status(201).json(demo)
})

/** PATCH /api/admin/demos/:id */
export const update = asyncHandler(async (req, res) => {
  const demo = await DemoRequest.findByIdAndUpdate(req.params.id, req.body, { new: true })
  if (!demo) throw ApiError.notFound('Demo not found')
  res.json(demo)
})

/** DELETE /api/admin/demos/:id */
export const remove = asyncHandler(async (req, res) => {
  const demo = await DemoRequest.findByIdAndDelete(req.params.id)
  if (!demo) throw ApiError.notFound('Demo not found')
  res.json({ ok: true, id: req.params.id })
})
