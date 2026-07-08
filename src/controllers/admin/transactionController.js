import { asyncHandler } from '../../utils/asyncHandler.js'
import { ApiError } from '../../utils/ApiError.js'
import Transaction from '../../models/Transaction.js'

/** GET /api/admin/transactions  (?agency=&type=&q=) */
export const list = asyncHandler(async (req, res) => {
  const q = {}
  if (req.query.agency) q.agency = req.query.agency
  if (req.query.type) q.type = req.query.type
  if (req.query.q) {
    const rx = new RegExp(String(req.query.q).trim(), 'i')
    q.$or = [{ code: rx }, { agencyName: rx }, { reference: rx }, { method: rx }]
  }
  const items = await Transaction.find(q).sort('-createdAt')
  res.json({ items, total: items.length })
})

/** GET /api/admin/transactions/:id */
export const getOne = asyncHandler(async (req, res) => {
  const tx = await Transaction.findById(req.params.id)
  if (!tx) throw ApiError.notFound('Transaction not found')
  res.json(tx)
})
