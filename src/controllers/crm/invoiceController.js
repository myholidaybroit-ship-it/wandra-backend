import { asyncHandler } from '../../utils/asyncHandler.js'
import { ApiError } from '../../utils/ApiError.js'
import { invoiceCode } from '../../utils/codes.js'
import Invoice from '../../models/Invoice.js'

const itemsTotal = (items = []) => items.reduce((s, it) => s + (it.qty || 0) * (it.rate || 0) * (1 + (it.tax || 0) / 100), 0)

/** Create an invoice (used by the route and internally by bookings). */
export async function createInvoiceDoc(agencyId, data) {
  const code = await invoiceCode(agencyId)
  return Invoice.create({
    agency: agencyId, code, status: data.status || 'Draft', payments: [], items: [], ...data,
  })
}

/** GET /api/invoices */
export const list = asyncHandler(async (req, res) => {
  const q = { agency: req.agencyId }
  if (req.query.status) q.status = req.query.status
  if (req.query.q) {
    const rx = new RegExp(String(req.query.q).trim(), 'i')
    q.$or = [{ code: rx }, { clientName: rx }]
  }
  const items = await Invoice.find(q).sort('-createdAt')
  res.json({ items, total: items.length })
})

/** GET /api/invoices/:id */
export const getOne = asyncHandler(async (req, res) => {
  const inv = await Invoice.findOne({ _id: req.params.id, agency: req.agencyId })
  if (!inv) throw ApiError.notFound('Invoice not found')
  res.json(inv)
})

/** POST /api/invoices */
export const create = asyncHandler(async (req, res) => {
  const inv = await createInvoiceDoc(req.agencyId, req.body)
  res.status(201).json(inv)
})

/** PATCH /api/invoices/:id */
export const update = asyncHandler(async (req, res) => {
  const patch = { ...req.body }
  delete patch.agency; delete patch.code; delete patch.id
  const inv = await Invoice.findOneAndUpdate({ _id: req.params.id, agency: req.agencyId }, patch, { new: true })
  if (!inv) throw ApiError.notFound('Invoice not found')
  res.json(inv)
})

/** DELETE /api/invoices/:id */
export const remove = asyncHandler(async (req, res) => {
  const inv = await Invoice.findOneAndDelete({ _id: req.params.id, agency: req.agencyId })
  if (!inv) throw ApiError.notFound('Invoice not found')
  res.json({ ok: true, id: req.params.id })
})

/** POST /api/invoices/:id/payments  { date, method, reference, amount } — recomputes status. */
export const addPayment = asyncHandler(async (req, res) => {
  const inv = await Invoice.findOne({ _id: req.params.id, agency: req.agencyId })
  if (!inv) throw ApiError.notFound('Invoice not found')
  inv.payments.push(req.body)
  const total = itemsTotal(inv.items)
  const paid = inv.payments.reduce((s, p) => s + Number(p.amount || 0), 0)
  inv.status = paid >= total && total > 0 ? 'Paid' : paid > 0 ? 'Partial' : inv.status
  await inv.save()
  res.json(inv)
})
