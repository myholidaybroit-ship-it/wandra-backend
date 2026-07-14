import { asyncHandler } from '../../utils/asyncHandler.js'
import Agency from '../../models/Agency.js'
import Landing from '../../models/Landing.js'
import { CATEGORY_GROUPS } from '../../config/crmDefaults.js'
import { ALL_FEATURES } from '../../config/features.js'
import { uploadIfDataUrl } from '../../services/storage.js'
import { cleanLogo } from '../../utils/brand.js'
import { trialState } from '../../services/trial.js'

/** GET /api/agency — the tenant's own brand profile + entitlements. */
export const getProfile = asyncHandler(async (req, res) => {
  const agency = req.agency.toJSON()
  agency.logo = cleanLogo(agency.logo)   // never surface the Wandra placeholder as the agency's own logo
  agency.trial = trialState(req.agency)  // { onTrial, expired, daysLeft, endsAt } — drives the in-app trial banner
  res.json({ agency, categoryGroups: CATEGORY_GROUPS })
})

/** PATCH /api/agency — update brand profile (name, logo, bank, gstin, contact…). */
export const updateProfile = asyncHandler(async (req, res) => {
  const patch = { ...req.body }
  // tenants cannot change their own plan/entitlements/status from the CRM
  for (const k of ['plan', 'features', 'limits', 'status', 'password', 'code', 'billing', 'renewal', 'usage']) delete patch[k]
  // lead sources: keep a clean, de-duped, non-empty list of trimmed labels
  if (patch.leadSources !== undefined) {
    const seen = new Set()
    patch.leadSources = (Array.isArray(patch.leadSources) ? patch.leadSources : [])
      .map((s) => String(s).trim())
      .filter((s) => s && !seen.has(s.toLowerCase()) && seen.add(s.toLowerCase()))
  }
  // the agency's own UPI QR image — store on S3 if it arrives as a data-URL
  if (patch.paymentQr !== undefined) {
    patch.paymentQr = await uploadIfDataUrl(patch.paymentQr, { folder: `agencies/${req.agencyId}/qr` })
  }
  // safety net: if a raw data-URL logo slips through, push it to S3
  if (patch.logo !== undefined) {
    patch.logo = await uploadIfDataUrl(patch.logo, { folder: `agencies/${req.agencyId}/logo` })
    // the agency logo is the single brand source — keep the landing header in sync
    await Landing.updateOne(
      { agency: req.agencyId },
      { $set: { 'header.logo': patch.logo } },
    )
  }
  const agency = await Agency.findByIdAndUpdate(req.agencyId, patch, { new: true, runValidators: true })
  res.json(agency)
})

/** POST /api/agency/renewal/respond  { answer: 'accepted'|'declined' } — agency's reply to a renewal prompt. */
export const respondRenewal = asyncHandler(async (req, res) => {
  const { answer } = req.body
  if (!['accepted', 'declined'].includes(answer)) return res.status(400).json({ error: 'Invalid answer' })
  req.agency.renewal = { ...(req.agency.renewal?.toObject?.() || {}), status: answer, respondedOn: new Date().toISOString().slice(0, 10) }
  await req.agency.save()
  res.json(req.agency)
})

/** GET /api/agency/features — the flat enabled/disabled map for the frontend to gate UI. */
export const features = asyncHandler(async (req, res) => {
  const map = {}
  const feats = req.agency.features || {}
  for (const f of ALL_FEATURES) map[f.key] = feats[f.key] ?? false
  res.json({
    plan: req.agency.plan,
    features: map,
    limits: { ...(req.agency.limits || {}) },
  })
})
