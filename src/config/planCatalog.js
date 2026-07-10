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
    price: 999,
    period: 'mo',
    billingCycle: 'yearly',        // ₹999/month, billed once a year
    annualDiscountPercent: 0,      // admin-set discount on the 12-month total
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
  const price = plan.price || 0
  const billingCycle = plan.billingCycle || 'monthly'
  const annualDiscountPercent = plan.annualDiscountPercent || 0
  // yearly-billed plans: the amount actually charged once a year (12 × monthly, less discount)
  const annualTotal = billingCycle === 'yearly' ? Math.round(price * 12 * (1 - annualDiscountPercent / 100)) : price
  return {
    id: (plan.key || plan.id || '').toLowerCase(),
    name: plan.name,
    price,
    period: plan.period,
    billingCycle,
    annualDiscountPercent,
    annualTotal,
    tagline: plan.tagline,
    plus: plan.plus,
    perks: plan.perks || [],
    featured: plan.featured,
    limit: plan.limit,
  }
}
