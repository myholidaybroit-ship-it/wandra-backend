import bcrypt from 'bcryptjs'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { ApiError } from '../../utils/ApiError.js'
import { agencyCode } from '../../utils/codes.js'
import Agency from '../../models/Agency.js'
import User from '../../models/User.js'
import Client from '../../models/Client.js'
import Package from '../../models/Package.js'
import { planFeatureMap, planLimitMap } from '../../services/plans.js'
import { provisionAgency } from '../../services/provisionAgency.js'
import { newTrial, trialState, extendTrial } from '../../services/trial.js'

// CRM collections wiped when an agency is deleted
import Role from '../../models/Role.js'
import AssignmentConfig from '../../models/AssignmentConfig.js'
import Landing from '../../models/Landing.js'
import InclusionPreset from '../../models/InclusionPreset.js'
import Destination from '../../models/Destination.js'
import Hotel from '../../models/Hotel.js'
import Cab from '../../models/Cab.js'
import ServiceLocation from '../../models/ServiceLocation.js'
import Activity from '../../models/Activity.js'
import PackageTemplate from '../../models/PackageTemplate.js'
import Booking from '../../models/Booking.js'
import Invoice from '../../models/Invoice.js'
import Quotation from '../../models/Quotation.js'
import Voucher from '../../models/Voucher.js'
import Story from '../../models/Story.js'

/** Merge live usage counts (clients/packages/team) onto an agency JSON. */
async function withLiveUsage(agency) {
  const j = agency.toJSON()
  const [clients, packages, team] = await Promise.all([
    Client.countDocuments({ agency: agency._id }),
    Package.countDocuments({ agency: agency._id }),
    User.countDocuments({ agency: agency._id }),
  ])
  j.usage = { ...j.usage, clients, packages, team: team || j.usage?.team || 1 }
  j.trial = trialState(agency)   // live { onTrial, expired, daysLeft, endsAt } for the admin UI
  return j
}

/** GET /api/admin/agencies */
export const list = asyncHandler(async (req, res) => {
  const q = {}
  if (req.query.plan) q.plan = req.query.plan
  if (req.query.status) q.status = req.query.status
  if (req.query.q) {
    const rx = new RegExp(String(req.query.q).trim(), 'i')
    q.$or = [{ name: rx }, { code: rx }, { owner: rx }, { email: rx }, { city: rx }]
  }
  const agencies = await Agency.find(q).sort('-createdAt')
  const items = await Promise.all(agencies.map(withLiveUsage))
  res.json({ items, total: items.length })
})

/** GET /api/admin/agencies/:id */
export const getOne = asyncHandler(async (req, res) => {
  const agency = await Agency.findById(req.params.id).select('+password')
  if (!agency) throw ApiError.notFound('Agency not found')
  const j = await withLiveUsage(agency)
  j.password = agency.password // admin may view/reset the owner login
  res.json(j)
})

/** POST /api/admin/agencies */
export const create = asyncHandler(async (req, res) => {
  const data = { ...req.body }
  const plan = data.plan || 'Free'
  const code = data.code || (await agencyCode())
  const password = data.password || `travel@${code.slice(-4)}`

  const agency = await Agency.create({
    ...data,
    code,
    plan,
    status: data.status || 'active',
    features: await planFeatureMap(plan),
    limits: await planLimitMap(plan),
    // Free plans start a countdown trial; Pro has none.
    trial: plan === 'Free' ? newTrial(data.trialDays) : null,
    password,
    usage: { clients: 0, packages: 0, team: 1, storage: 0 },
  })

  await provisionAgency(agency, password)
  const j = await withLiveUsage(agency)
  j.password = password
  res.status(201).json(j)
})

/** PATCH /api/admin/agencies/:id */
export const update = asyncHandler(async (req, res) => {
  const patch = { ...req.body }
  delete patch.features
  delete patch.limits
  delete patch.password
  delete patch.plan // plan changes go through billing endpoints
  const agency = await Agency.findByIdAndUpdate(req.params.id, patch, { new: true, runValidators: true })
  if (!agency) throw ApiError.notFound('Agency not found')
  res.json(await withLiveUsage(agency))
})

/** DELETE /api/admin/agencies/:id — cascades tenant data. */
export const remove = asyncHandler(async (req, res) => {
  const agency = await Agency.findById(req.params.id)
  if (!agency) throw ApiError.notFound('Agency not found')
  const scope = { agency: agency._id }
  await Promise.all([
    User.deleteMany(scope), Role.deleteMany(scope), AssignmentConfig.deleteMany(scope),
    Landing.deleteMany(scope), InclusionPreset.deleteMany(scope), Destination.deleteMany(scope),
    Hotel.deleteMany(scope), Cab.deleteMany(scope), ServiceLocation.deleteMany(scope),
    Activity.deleteMany(scope), Client.deleteMany(scope), Package.deleteMany(scope),
    PackageTemplate.deleteMany(scope), Booking.deleteMany(scope), Invoice.deleteMany(scope),
    Quotation.deleteMany(scope), Voucher.deleteMany(scope), Story.deleteMany(scope),
  ])
  await agency.deleteOne()
  res.json({ ok: true, id: req.params.id })
})

/** PATCH /api/admin/agencies/:id/status  { status } */
export const setStatus = asyncHandler(async (req, res) => {
  const { status } = req.body
  if (!['active', 'suspended'].includes(status)) throw ApiError.badRequest('Invalid status')
  const agency = await Agency.findByIdAndUpdate(req.params.id, { status }, { new: true })
  if (!agency) throw ApiError.notFound('Agency not found')
  res.json(await withLiveUsage(agency))
})

/** PATCH /api/admin/agencies/:id/trial  { days } (extend/start) | { endsAt } (set exact) */
export const setTrial = asyncHandler(async (req, res) => {
  const agency = await Agency.findById(req.params.id)
  if (!agency) throw ApiError.notFound('Agency not found')
  const { days, endsAt } = req.body
  if (endsAt) {
    agency.trial = {
      startedAt: agency.trial?.startedAt || new Date().toISOString(),
      endsAt: new Date(endsAt).toISOString(),
      lengthDays: agency.trial?.lengthDays || 7,
    }
  } else if (days != null && Number(days) !== 0) {
    agency.trial = extendTrial(agency, Number(days))
  } else {
    throw ApiError.badRequest('Provide a number of days to extend, or an end date')
  }
  agency.markModified('trial')
  await agency.save()
  res.json(await withLiveUsage(agency))
})

/** PATCH /api/admin/agencies/:id/features  { key, value } | { patch: {...} } */
export const setFeatures = asyncHandler(async (req, res) => {
  const agency = await Agency.findById(req.params.id)
  if (!agency) throw ApiError.notFound('Agency not found')
  agency.features = { ...(agency.features || {}) }
  if (req.body.patch && typeof req.body.patch === 'object') {
    for (const [k, v] of Object.entries(req.body.patch)) agency.features[k] = !!v
  } else if (req.body.key != null) {
    agency.features[req.body.key] = !!req.body.value
  }
  agency.markModified('features')
  await agency.save()
  res.json(await withLiveUsage(agency))
})

/** POST /api/admin/agencies/:id/features/reset — back to plan defaults. */
export const resetFeatures = asyncHandler(async (req, res) => {
  const agency = await Agency.findById(req.params.id)
  if (!agency) throw ApiError.notFound('Agency not found')
  agency.features = await planFeatureMap(agency.plan)
  agency.limits = await planLimitMap(agency.plan)
  agency.markModified('features'); agency.markModified('limits')
  await agency.save()
  res.json(await withLiveUsage(agency))
})

/** PATCH /api/admin/agencies/:id/limits  { key, value } */
export const setLimit = asyncHandler(async (req, res) => {
  const agency = await Agency.findById(req.params.id)
  if (!agency) throw ApiError.notFound('Agency not found')
  agency.limits = { ...(agency.limits || {}), [req.body.key]: Number(req.body.value) }
  agency.markModified('limits')
  await agency.save()
  res.json(await withLiveUsage(agency))
})

/** POST /api/admin/agencies/:id/password  { password } */
export const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body
  if (!password || password.length < 4) throw ApiError.badRequest('Password too short')
  const agency = await Agency.findById(req.params.id)
  if (!agency) throw ApiError.notFound('Agency not found')
  agency.password = password
  await agency.save()
  // keep the owner login in sync
  const owner = await User.findOne({ agency: agency._id, designation: 'Owner' })
    || await User.findOne({ agency: agency._id, email: agency.email })
  if (owner) {
    owner.passwordHash = await bcrypt.hash(password, 10)
    await owner.save()
  }
  res.json({ ok: true })
})
