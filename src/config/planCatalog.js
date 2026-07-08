/**
 * The two platform plans — full config (feature/limit maps + marketing content).
 * Seeded into the Plan collection once; thereafter admin-editable via the admin
 * panel, and read by the CRM billing pages. This is platform configuration, not
 * demo/business data.
 */
import { defaultFeaturesForPlan, defaultLimitsForPlan } from './features.js'

export const PLAN_CATALOG = [
  {
    key: 'Free',
    name: 'Free',
    price: 0,
    period: 'forever',
    tagline: 'Everything you need to start selling trips.',
    color: 'var(--color-ink)',
    featured: false,
    limit: 100,
    perks: [
      'Up to 100 clients',
      'Quote builder with markup pricing',
      'Itineraries, quotations & PDF downloads',
      'WhatsApp & email sharing',
      'Basic reports',
      'Email support',
    ],
    features: defaultFeaturesForPlan('Free'),
    limits: defaultLimitsForPlan('Free'),
  },
  {
    key: 'Pro',
    name: 'Pro',
    price: 3999,
    priceYear: 2999,
    oldPrice: 9999,
    period: 'mo',
    tagline: 'The complete engine for a growing agency.',
    plus: 'Everything in Free, plus:',
    color: 'var(--color-brand-blue)',
    featured: true,
    limit: -1,
    perks: [
      'Unlimited clients & enquiries',
      'Bookings, invoices & payment tracking',
      'Vouchers — hotel, transport & activity',
      'Lead-capture landing page',
      'Auto lead assignment (round robin)',
      'In-depth reports with Excel / CSV export',
      'Team accounts with roles & permissions',
      'Your branding on every document',
      'Priority WhatsApp support',
    ],
    features: defaultFeaturesForPlan('Pro'),
    limits: defaultLimitsForPlan('Pro'),
  },
]

/** Shape a Plan doc for the CRM billing pages (lowercase id, marketing fields). */
export function planCardShape(plan) {
  return {
    id: (plan.key || plan.id || '').toLowerCase(),
    name: plan.name,
    price: plan.price,
    priceYear: plan.priceYear,
    oldPrice: plan.oldPrice,
    period: plan.period,
    tagline: plan.tagline,
    plus: plan.plus,
    perks: plan.perks || [],
    featured: plan.featured,
    limit: plan.limit,
  }
}
