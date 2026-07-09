import { asyncHandler } from '../../utils/asyncHandler.js'
import { ApiError } from '../../utils/ApiError.js'
import { packageCode } from '../../utils/codes.js'
import Package from '../../models/Package.js'
import PackageTemplate from '../../models/PackageTemplate.js'
import Quotation from '../../models/Quotation.js'
import Client from '../../models/Client.js'
import InclusionPreset from '../../models/InclusionPreset.js'
import { computePricing } from '../../services/pricing.js'
import { uploadDeep } from '../../services/storage.js'

const today = () => new Date().toISOString().slice(0, 10)
const normalizeRefs = (body = {}) => {
  if (body.clientId && !body.client) body.client = body.clientId
  delete body.clientId
  return body
}

/** GET /api/packages */
export const list = asyncHandler(async (req, res) => {
  const q = { agency: req.agencyId }
  if (req.query.status) q.status = req.query.status
  if (req.query.q) {
    const rx = new RegExp(String(req.query.q).trim(), 'i')
    q.$or = [{ code: rx }, { clientName: rx }, { destination: rx }]
  }
  const items = await Package.find(q).sort('-createdAt')
  res.json({ items, total: items.length })
})

/** GET /api/packages/:id — includes computed pricing. */
export const getOne = asyncHandler(async (req, res) => {
  const pkg = await Package.findOne({ _id: req.params.id, agency: req.agencyId })
  if (!pkg) throw ApiError.notFound('Package not found')
  res.json({ ...pkg.toJSON(), computed: computePricing(pkg.toObject()) })
})

/** Internal: create a package + its auto-quotation. Returns the package doc. */
async function createPackage(agencyId, data, createdBy) {
  const code = await packageCode(agencyId)
  const body = normalizeRefs({ ...data })
  const pkg = await Package.create({
    ...body,
    agency: agencyId,
    code,
    createdBy: createdBy || body.createdBy,
    status: body.status || 'Draft',
    paid: body.paid || 0,
  })
  const pr = computePricing(pkg.toObject())
  await Quotation.create({
    agency: agencyId,
    package: pkg._id,
    packageCode: pkg.code,
    client: pkg.clientName,
    travelDate: pkg.startDate,
    phone: pkg.clientPhone || '',
    email: pkg.clientEmail || '',
    status: 'Draft',
    amount: pr.grandTotal,
  })
  return pkg
}

/** POST /api/packages */
export const create = asyncHandler(async (req, res) => {
  // safety net: push any nested data-URL images (e.g. flight screenshot) to S3
  const body = normalizeRefs(await uploadDeep(req.body, { folder: `agencies/${req.agencyId}/packages` }))
  const pkg = await createPackage(req.agencyId, body, req.agency.name)
  res.status(201).json({ ...pkg.toJSON(), computed: computePricing(pkg.toObject()) })
})

/** PATCH /api/packages/:id — keeps the linked quotation amount in sync. */
export const update = asyncHandler(async (req, res) => {
  const patch = normalizeRefs(await uploadDeep({ ...req.body }, { folder: `agencies/${req.agencyId}/packages` }))
  delete patch.agency; delete patch.code; delete patch.id
  const pkg = await Package.findOneAndUpdate(
    { _id: req.params.id, agency: req.agencyId }, patch, { new: true, runValidators: true },
  )
  if (!pkg) throw ApiError.notFound('Package not found')
  const pr = computePricing(pkg.toObject())
  await Quotation.updateOne({ agency: req.agencyId, package: pkg._id }, { $set: { amount: pr.grandTotal, travelDate: pkg.startDate, client: pkg.clientName } })
  res.json({ ...pkg.toJSON(), computed: pr })
})

/** DELETE /api/packages/:id */
export const remove = asyncHandler(async (req, res) => {
  const pkg = await Package.findOneAndDelete({ _id: req.params.id, agency: req.agencyId })
  if (!pkg) throw ApiError.notFound('Package not found')
  await Quotation.deleteMany({ agency: req.agencyId, package: pkg._id })
  res.json({ ok: true, id: req.params.id })
})

/** PATCH /api/packages/:id/status  { status } — cascades to the quotation + logs. */
export const setStatus = asyncHandler(async (req, res) => {
  const { status } = req.body
  const pkg = await Package.findOne({ _id: req.params.id, agency: req.agencyId })
  if (!pkg) throw ApiError.notFound('Package not found')
  pkg.status = status
  pkg.logs.unshift({ text: `Status changed to ${status}`, at: today() })
  await pkg.save()
  const qStatus = status === 'Confirmed' ? 'Confirmed' : status === 'Cancelled' ? 'Cancelled' : 'Sent'
  await Quotation.updateOne({ agency: req.agencyId, package: pkg._id }, { $set: { status: qStatus } })
  res.json(pkg)
})

/** POST /api/packages/:id/logs  { text } */
export const addLog = asyncHandler(async (req, res) => {
  const pkg = await Package.findOne({ _id: req.params.id, agency: req.agencyId })
  if (!pkg) throw ApiError.notFound('Package not found')
  pkg.logs.unshift({ text: req.body.text, at: today() })
  await pkg.save()
  res.json(pkg)
})

/** POST /api/packages/from-template  { templateId, clientId } */
export const fromTemplate = asyncHandler(async (req, res) => {
  const { templateId, clientId } = req.body
  const tpl = await PackageTemplate.findOne({ _id: templateId, agency: req.agencyId })
  if (!tpl) throw ApiError.notFound('Template not found')
  const client = clientId ? await Client.findOne({ _id: clientId, agency: req.agencyId }) : null
  const preset = await InclusionPreset.findOne({ agency: req.agencyId })
  const ie = preset?.byDest?.[tpl.destination] || { inclusions: [], exclusions: [] }

  const adults = client?.query?.adults || 2
  const children = client?.query?.children || 0
  const pkg = await createPackage(req.agencyId, {
    client: client?._id, clientName: client?.name || '', clientPhone: client?.phone || '',
    clientEmail: client?.email || '', clientAddress: client?.address || '',
    fromLocation: '', route: '',
    destination: tpl.destination,
    days: tpl.days, nights: tpl.nights, autoNights: false,
    startDate: client?.query?.startDate || '',
    pax: { total: adults + children, adults, children, childrenNoBed: 0, extraBeds: 0, rooms: Math.max(1, Math.ceil(adults / 2)), roomType: 'Double / Twin' },
    flightIncluded: false, flight: { airline: '', flightNo: '', depart: '', arrive: '' },
    status: 'Draft',
    cabs: (tpl.cabs || []).map((c) => ({ ...c })),
    hotelsAlloc: (tpl.hotelsAlloc || []).map((h) => ({ ...h })),
    itinerary: (tpl.itinerary || []).map((d) => ({ ...d, stops: (d.stops || []).map((s) => ({ ...s })) })),
    inclusions: [...(ie.inclusions || [])],
    exclusions: [...(ie.exclusions || [])],
    categories: (tpl.categories || []).map((c) => ({ ...c })),
    pricing: { ...tpl.pricing },
    fromTemplate: tpl.name,
    logs: [{ text: `Created from template “${tpl.name}”`, at: today() }],
  }, req.agency.name)

  tpl.usedCount = (tpl.usedCount || 0) + 1
  await tpl.save()
  res.status(201).json({ ...pkg.toJSON(), computed: computePricing(pkg.toObject()) })
})

/** POST /api/packages/price — compute pricing for an arbitrary payload (builder preview). */
export const price = asyncHandler(async (req, res) => {
  res.json(computePricing(req.body || {}))
})
