import { asyncHandler } from '../../utils/asyncHandler.js'
import { ApiError } from '../../utils/ApiError.js'
import Plan from '../../models/Plan.js'
import Agency from '../../models/Agency.js'
import { defaultFeaturesForPlan, defaultLimitsForPlan, FEATURE_GROUPS, LIMIT_DEFS } from '../../config/features.js'
import { PLAN_CATALOG } from '../../config/planCatalog.js'

/** GET /api/admin/plans */
export const list = asyncHandler(async (req, res) => {
  const plans = await Plan.find().sort('price')
  res.json({ items: plans })
})

/** GET /api/admin/feature-catalog — the master feature groups + limit defs. */
export const catalog = asyncHandler(async (req, res) => {
  res.json({ groups: FEATURE_GROUPS, limits: LIMIT_DEFS })
})

/** PATCH /api/admin/plans/:key  (managed monthly pricing + copy + feature/limit maps) */
export const update = asyncHandler(async (req, res) => {
  const plan = await Plan.findOne({ key: req.params.key })
  if (!plan) throw ApiError.notFound('Plan not found')
  const { name, price, tagline, plus, color, featured, limit, billingCycle, annualDiscountPercent } = req.body
  if (name != null) plan.name = name
  if (plan.key === 'Free') plan.price = 0
  else if (price != null) {
    const monthlyPrice = Number(price)
    if (!Number.isFinite(monthlyPrice) || monthlyPrice < 0) throw ApiError.badRequest('Monthly price must be a non-negative number')
    plan.price = monthlyPrice
  }
  if (billingCycle != null) plan.billingCycle = billingCycle === 'yearly' ? 'yearly' : 'monthly'
  if (annualDiscountPercent != null) {
    const d = Number(annualDiscountPercent)
    plan.annualDiscountPercent = Number.isFinite(d) ? Math.min(100, Math.max(0, d)) : 0
  }
  if (tagline != null) plan.tagline = tagline
  if (plus != null) plan.plus = plus
  if (color != null) plan.color = color
  if (featured != null) plan.featured = featured
  if (limit != null) plan.limit = Number(limit)
  await plan.save()
  res.json(plan)
})

/** PATCH /api/admin/plans/:key/features  { key, value } | { patch } */
export const setFeatures = asyncHandler(async (req, res) => {
  const plan = await Plan.findOne({ key: req.params.key })
  if (!plan) throw ApiError.notFound('Plan not found')
  plan.features = { ...(plan.features || {}) }
  if (req.body.patch && typeof req.body.patch === 'object') {
    for (const [k, v] of Object.entries(req.body.patch)) plan.features[k] = !!v
  } else if (req.body.key != null) {
    plan.features[req.body.key] = !!req.body.value
  }
  plan.markModified('features')
  await plan.save()
  res.json(plan)
})

/** PATCH /api/admin/plans/:key/limits  { key, value } */
export const setLimit = asyncHandler(async (req, res) => {
  const plan = await Plan.findOne({ key: req.params.key })
  if (!plan) throw ApiError.notFound('Plan not found')
  plan.limits = { ...(plan.limits || {}), [req.body.key]: Number(req.body.value) }
  plan.markModified('limits')
  await plan.save()
  res.json(plan)
})

/** POST /api/admin/plans/:key/reset — back to hard-coded catalog defaults. */
export const resetToCatalog = asyncHandler(async (req, res) => {
  const plan = await Plan.findOne({ key: req.params.key })
  if (!plan) throw ApiError.notFound('Plan not found')
  plan.features = defaultFeaturesForPlan(plan.key)
  plan.limits = defaultLimitsForPlan(plan.key)
  const catalog = PLAN_CATALOG.find((item) => item.key === plan.key)
  if (catalog) {
    plan.price = catalog.price
    plan.billingCycle = catalog.billingCycle || 'monthly'
    plan.annualDiscountPercent = catalog.annualDiscountPercent || 0
    plan.tagline = catalog.tagline
  }
  plan.markModified('features'); plan.markModified('limits')
  await plan.save()
  res.json(plan)
})

/** POST /api/admin/plans/:key/apply — push plan maps onto every agency on it. */
export const applyToAgencies = asyncHandler(async (req, res) => {
  const plan = await Plan.findOne({ key: req.params.key })
  if (!plan) throw ApiError.notFound('Plan not found')
  const features = { ...(plan.features || {}) }
  const limits = { ...(plan.limits || {}) }
  const result = await Agency.updateMany({ plan: plan.key }, { $set: { features, limits } })
  res.json({ ok: true, count: result.modifiedCount })
})
