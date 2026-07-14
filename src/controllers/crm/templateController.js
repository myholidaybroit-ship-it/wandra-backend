import { crudFactory } from '../crudFactory.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import PackageTemplate from '../../models/PackageTemplate.js'
import Package from '../../models/Package.js'
import { computePricing } from '../../services/pricing.js'

/** Standard CRUD for explicitly-saved package templates. */
const crud = crudFactory(PackageTemplate, {
  sort: '-usedCount',
  searchable: ['name', 'destination', 'tag'],
})

/* A built package is already "package-shaped", so it can be reused as a
   suggestion directly — the builder's fromLegacy() maps hotelsAlloc → stays,
   cabs → transport and categories → extras when the agent starts from it. */
function packageToSuggestion(p) {
  let priceFrom = 0
  try { priceFrom = computePricing(p.toObject()).grandTotal || 0 } catch { priceFrom = p.pricing?.grandTotal || 0 }
  return {
    id: p.id,
    fromPackage: true,
    name: `${p.destination || 'Package'} · ${p.nights || 0}N / ${p.days || 0}D`,
    destination: p.destination || '',
    tag: 'Recent',
    nights: p.nights || 0,
    days: p.days || 0,
    summary: (p.itinerary || []).map((d) => d.title).filter(Boolean).slice(0, 3).join(' · '),
    highlights: [],
    priceFrom,
    usedCount: 0,
    hotelsAlloc: p.hotelsAlloc || [],
    cabs: p.cabs || [],
    categories: p.categories || [],
    pricing: p.pricing || {},
    itinerary: p.itinerary || [],
  }
}

/**
 * GET /api/templates — reusable package suggestions.
 * Every destination the agency has already built a (substantive) package for
 * shows up as a ready-made starting point — auto-derived, latest package per
 * destination — merged with any explicitly-saved templates. This is why a past
 * package for a destination re-appears as a suggestion next time.
 */
const list = asyncHandler(async (req, res) => {
  const saved = await PackageTemplate.find({ agency: req.agencyId }).sort('-usedCount')
  const seen = new Set(saved.map((t) => String(t.destination || '').trim().toLowerCase()))
  const pkgs = await Package.find({ agency: req.agencyId, 'hotelsAlloc.0': { $exists: true } })
    .sort('-createdAt')
    .limit(400)
  const derived = []
  for (const p of pkgs) {
    const key = String(p.destination || '').trim().toLowerCase()
    if (!key || seen.has(key)) continue   // one suggestion per destination (latest wins)
    seen.add(key)
    derived.push(packageToSuggestion(p))
  }
  const items = [...saved.map((t) => t.toJSON()), ...derived]
  res.json({ items, total: items.length })
})

export const templates = { ...crud, list }
