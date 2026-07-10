import { asyncHandler } from '../../utils/asyncHandler.js'
import { ApiError } from '../../utils/ApiError.js'
import { adminInvoiceCode } from '../../utils/codes.js'
import { todayISO, addMonths, monthLabel, daysUntil } from '../../utils/date.js'
import Agency from '../../models/Agency.js'
import Transaction from '../../models/Transaction.js'
import { planFeatureMap, planLimitMap } from '../../services/plans.js'
import Plan from '../../models/Plan.js'

async function proBillingMonths() {
  const plan = await Plan.findOne({ key: 'Pro' }).select('billingCycle')
  return (plan?.billingCycle || 'yearly') === 'yearly' ? 12 : 1
}

async function record(agency, data) {
  const code = await adminInvoiceCode()
  return Transaction.create({
    code,
    agency: agency._id,
    agencyName: agency.name,
    plan: 'Pro',
    status: 'paid',
    ...data,
  })
}

/** POST /api/admin/agencies/:id/activate-pro  { method, originalPrice, discountPercent, discount, amount, proof, proofKind, reference, note } */
export const activatePro = asyncHandler(async (req, res) => {
  const agency = await Agency.findById(req.params.id)
  if (!agency) throw ApiError.notFound('Agency not found')
  const since = todayISO()
  const billingMonths = await proBillingMonths()
  const renewalOn = addMonths(since, billingMonths)
  agency.plan = 'Pro'
  agency.features = await planFeatureMap('Pro')
  agency.limits = await planLimitMap('Pro')
  agency.markModified('features'); agency.markModified('limits')
  agency.billing = { since, renewalOn }
  agency.renewal = { status: 'none' }
  await agency.save()
  const tx = await record(agency, { type: 'subscription', period: billingMonths === 12 ? `${since} – ${renewalOn}` : monthLabel(since), ...req.body })
  res.status(201).json({ agency: agency.toJSON(), transaction: tx })
})

/** POST /api/admin/agencies/:id/downgrade */
export const downgradeToFree = asyncHandler(async (req, res) => {
  const agency = await Agency.findById(req.params.id)
  if (!agency) throw ApiError.notFound('Agency not found')
  agency.plan = 'Free'
  agency.features = await planFeatureMap('Free')
  agency.limits = await planLimitMap('Free')
  agency.markModified('features'); agency.markModified('limits')
  agency.billing = null
  agency.renewal = { status: 'none' }
  await agency.save()
  res.json(agency)
})

/** POST /api/admin/agencies/:id/renewal/request */
export const requestRenewal = asyncHandler(async (req, res) => {
  const agency = await Agency.findById(req.params.id)
  if (!agency) throw ApiError.notFound('Agency not found')
  agency.renewal = { status: 'requested', requestedOn: todayISO() }
  await agency.save()
  res.json(agency)
})

/** POST /api/admin/agencies/:id/renewal/cancel */
export const cancelRenewal = asyncHandler(async (req, res) => {
  const agency = await Agency.findById(req.params.id)
  if (!agency) throw ApiError.notFound('Agency not found')
  agency.renewal = { status: 'none' }
  await agency.save()
  res.json(agency)
})

/** POST /api/admin/agencies/:id/renewal/respond  { answer: 'accepted'|'declined' } */
export const respondRenewal = asyncHandler(async (req, res) => {
  const { answer } = req.body
  if (!['accepted', 'declined'].includes(answer)) throw ApiError.badRequest('Invalid answer')
  const agency = await Agency.findById(req.params.id)
  if (!agency) throw ApiError.notFound('Agency not found')
  agency.renewal = { ...agency.renewal?.toObject?.(), status: answer, respondedOn: todayISO() }
  await agency.save()
  res.json(agency)
})

/** POST /api/admin/agencies/:id/renewal/record  { ...payment } — extends cycle + invoice. */
export const recordRenewal = asyncHandler(async (req, res) => {
  const agency = await Agency.findById(req.params.id)
  if (!agency) throw ApiError.notFound('Agency not found')
  const from = agency.billing?.renewalOn && daysUntil(agency.billing.renewalOn) > 0
    ? agency.billing.renewalOn : todayISO()
  const billingMonths = await proBillingMonths()
  const renewalOn = addMonths(from, billingMonths)
  agency.billing = { since: agency.billing?.since || todayISO(), renewalOn }
  agency.renewal = { status: 'none' }
  await agency.save()
  const tx = await record(agency, { type: 'renewal', period: billingMonths === 12 ? `${from} – ${renewalOn}` : monthLabel(renewalOn), ...req.body })
  res.status(201).json({ agency: agency.toJSON(), transaction: tx })
})
