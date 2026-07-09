import { asyncHandler } from '../../utils/asyncHandler.js'
import { ApiError } from '../../utils/ApiError.js'
import { voucherCode } from '../../utils/codes.js'
import Voucher from '../../models/Voucher.js'

/** GET /api/vouchers */
export const list = asyncHandler(async (req, res) => {
  const q = { agency: req.agencyId }
  if (req.query.type) q.type = req.query.type
  if (req.query.package) q.package = req.query.package
  const items = await Voucher.find(q).sort('-createdAt')
  res.json({ items, total: items.length })
})

/** GET /api/vouchers/:id */
export const getOne = asyncHandler(async (req, res) => {
  const v = await Voucher.findOne({ _id: req.params.id, agency: req.agencyId })
  if (!v) throw ApiError.notFound('Voucher not found')
  res.json(v)
})

/** POST /api/vouchers */
export const create = asyncHandler(async (req, res) => {
  const code = await voucherCode(req.agencyId)
  const body = { ...req.body }
  if (body.packageId && !body.package) body.package = body.packageId
  if (body.clientId && !body.client) body.client = body.clientId
  delete body.packageId
  delete body.clientId
  const v = await Voucher.create({ ...body, agency: req.agencyId, code })
  res.status(201).json(v)
})

/** DELETE /api/vouchers/:id */
export const remove = asyncHandler(async (req, res) => {
  const v = await Voucher.findOneAndDelete({ _id: req.params.id, agency: req.agencyId })
  if (!v) throw ApiError.notFound('Voucher not found')
  res.json({ ok: true, id: req.params.id })
})
