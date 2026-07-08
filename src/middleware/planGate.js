import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'

/**
 * Feature gate — blocks the request unless the agency has `featureKey` enabled
 * in its (per-agency, admin-controlled) feature map. Keys come from the admin
 * feature catalog, e.g. 'invoices.gst', 'landing.builder'.
 */
export function requireFeature(featureKey) {
  return asyncHandler(async (req, res, next) => {
    const enabled = req.agency?.features?.[featureKey]
    if (enabled === false) {
      throw ApiError.paymentRequired(`This feature (${featureKey}) is not enabled on your plan.`)
    }
    next()
  })
}

/**
 * Usage-limit gate — checks a live count against the agency's numeric limit for
 * `limitKey` before allowing a create. -1 / undefined means unlimited.
 * `countFn(req)` returns the current count for the tenant.
 */
export function enforceLimit(limitKey, countFn) {
  return asyncHandler(async (req, res, next) => {
    const limit = req.agency?.limits?.[limitKey]
    if (limit == null || limit === -1) return next()
    const current = await countFn(req)
    if (current >= limit) {
      throw ApiError.paymentRequired(
        `You've reached your plan limit for ${limitKey} (${limit}). Upgrade to add more.`,
      )
    }
    next()
  })
}
