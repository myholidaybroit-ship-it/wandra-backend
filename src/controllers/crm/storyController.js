import { asyncHandler } from '../../utils/asyncHandler.js'
import { ApiError } from '../../utils/ApiError.js'
import Story from '../../models/Story.js'
import { uploadIfDataUrl } from '../../services/storage.js'

/** GET /api/stories */
export const list = asyncHandler(async (req, res) => {
  const q = { agency: req.agencyId }
  if (req.query.status) q.status = req.query.status
  const items = await Story.find(q).sort('-createdAt')
  res.json({ items, total: items.length })
})

/** POST /api/stories */
export const create = asyncHandler(async (req, res) => {
  const image = await uploadIfDataUrl(req.body.image, { folder: `agencies/${req.agencyId}/stories` })
  const story = await Story.create({
    ...req.body, image, agency: req.agencyId,
    status: req.body.status || 'Pending',
    date: req.body.date || new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
  })
  res.status(201).json(story)
})

/** PATCH /api/stories/:id/approve */
export const approve = asyncHandler(async (req, res) => {
  const story = await Story.findOneAndUpdate(
    { _id: req.params.id, agency: req.agencyId }, { status: 'Published' }, { new: true },
  )
  if (!story) throw ApiError.notFound('Story not found')
  res.json(story)
})

/** DELETE /api/stories/:id */
export const remove = asyncHandler(async (req, res) => {
  const story = await Story.findOneAndDelete({ _id: req.params.id, agency: req.agencyId })
  if (!story) throw ApiError.notFound('Story not found')
  res.json({ ok: true, id: req.params.id })
})
