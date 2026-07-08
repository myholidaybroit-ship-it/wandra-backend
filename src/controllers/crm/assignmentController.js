import { asyncHandler } from '../../utils/asyncHandler.js'
import { ApiError } from '../../utils/ApiError.js'
import AssignmentConfig from '../../models/AssignmentConfig.js'

async function getConfig(agencyId) {
  let cfg = await AssignmentConfig.findOne({ agency: agencyId })
  if (!cfg) cfg = await AssignmentConfig.create({ agency: agencyId })
  return cfg
}

/** GET /api/assignment */
export const get = asyncHandler(async (req, res) => {
  res.json(await getConfig(req.agencyId))
})

/** PATCH /api/assignment  { enabled, fallback } */
export const update = asyncHandler(async (req, res) => {
  const cfg = await getConfig(req.agencyId)
  if (req.body.enabled != null) cfg.enabled = req.body.enabled
  if (req.body.fallback) cfg.fallback = { ...cfg.fallback?.toObject?.(), ...req.body.fallback }
  await cfg.save()
  res.json(cfg)
})

/** POST /api/assignment/rules */
export const addRule = asyncHandler(async (req, res) => {
  const cfg = await getConfig(req.agencyId)
  cfg.rules.push({ name: 'New rule', enabled: true, field: 'destination', values: [], members: [], next: 0, ...req.body })
  await cfg.save()
  res.status(201).json(cfg)
})

/** PATCH /api/assignment/rules/:ruleId */
export const updateRule = asyncHandler(async (req, res) => {
  const cfg = await getConfig(req.agencyId)
  const rule = cfg.rules.id(req.params.ruleId)
  if (!rule) throw ApiError.notFound('Rule not found')
  Object.assign(rule, req.body)
  await cfg.save()
  res.json(cfg)
})

/** DELETE /api/assignment/rules/:ruleId */
export const removeRule = asyncHandler(async (req, res) => {
  const cfg = await getConfig(req.agencyId)
  if (!cfg.rules.id(req.params.ruleId)) throw ApiError.notFound('Rule not found')
  cfg.rules.pull(req.params.ruleId)
  await cfg.save()
  res.json(cfg)
})
