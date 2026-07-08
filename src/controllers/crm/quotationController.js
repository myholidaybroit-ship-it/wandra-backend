import { asyncHandler } from '../../utils/asyncHandler.js'
import { ApiError } from '../../utils/ApiError.js'
import Quotation from '../../models/Quotation.js'

/** GET /api/quotations */
export const list = asyncHandler(async (req, res) => {
  const q = { agency: req.agencyId }
  if (req.query.status) q.status = req.query.status
  const items = await Quotation.find(q).sort('-createdAt')
  res.json({ items, total: items.length })
})

/** PATCH /api/quotations/:id/status  { status } */
export const setStatus = asyncHandler(async (req, res) => {
  const quote = await Quotation.findOneAndUpdate(
    { _id: req.params.id, agency: req.agencyId }, { status: req.body.status }, { new: true },
  )
  if (!quote) throw ApiError.notFound('Quotation not found')
  res.json(quote)
})
