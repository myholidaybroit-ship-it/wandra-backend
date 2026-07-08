/**
 * Platform-level UI config served to the CRM via GET /api/config.
 * These are app definitions (theme presets, category-group names) — not tenant
 * business data and not demo records. Served from the backend so the frontend
 * holds no static copies.
 */

/** Public itinerary / PDF preview theme presets. */
export const PREVIEW_THEMES = [
  { id: 'standard', name: 'Standard', accent: '#171717', public: true },
  { id: 'classic', name: 'Classic', accent: '#0d74ce', public: true },
  { id: 'modern', name: 'Modern', accent: '#16a34a', public: false },
  { id: 'premium', name: 'Premium', accent: '#8145b5', public: false },
  { id: 'marine', name: 'Marine (Premium)', accent: '#0e7490', public: false },
  { id: 'extensive', name: 'Public Preview · Extensive', accent: '#000000', public: true },
]

/** Inclusion/exclusion category-group names used by the builder. */
export const CATEGORY_GROUPS = [
  'Meals', 'Hotel Policies', 'Services & Support', 'Visa & Drinks',
  'Transportation', 'Insurance & Medical', 'Personal Expenses', 'Policy / Cancellation', 'Travel Costs',
]
