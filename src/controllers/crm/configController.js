import { asyncHandler } from '../../utils/asyncHandler.js'
import Plan from '../../models/Plan.js'
import { PREVIEW_THEMES, CATEGORY_GROUPS } from '../../config/appConfig.js'
import { planCardShape } from '../../config/planCatalog.js'
import { crudFactory } from '../crudFactory.js'
import ItineraryTemplate from '../../models/ItineraryTemplate.js'

/** GET /api/config — platform config the CRM needs (themes, category groups, plan cards). */
export const config = asyncHandler(async (req, res) => {
  const plans = await Plan.find().sort('price')
  res.json({
    categoryGroups: CATEGORY_GROUPS,
    previewThemes: PREVIEW_THEMES,
    plans: plans.map(planCardShape),
  })
})

/** Tenant-scoped CRUD for reusable itinerary day-templates. */
export const itineraryTemplates = crudFactory(ItineraryTemplate, { searchable: ['name', 'activity'] })
