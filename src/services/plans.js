import Plan from '../models/Plan.js'
import { defaultFeaturesForPlan, defaultLimitsForPlan } from '../config/features.js'

/** Current feature map for a plan (DB source of truth, falls back to catalog). */
export async function planFeatureMap(planKey) {
  const p = await Plan.findOne({ key: planKey })
  if (p?.features && Object.keys(p.features).length) return { ...p.features }
  return defaultFeaturesForPlan(planKey)
}

/** Current numeric limit map for a plan. */
export async function planLimitMap(planKey) {
  const p = await Plan.findOne({ key: planKey })
  if (p?.limits && Object.keys(p.limits).length) return { ...p.limits }
  return defaultLimitsForPlan(planKey)
}
