/**
 * Baseline CRM config applied to every new tenant. Ported from
 * wandra-crm/src/data/mockData.js (rolesDefault / assignmentDefault /
 * landingDefault / categoryGroups).
 */

export const ROLES_DEFAULT = [
  { name: 'Admin', system: true, perms: { dashboard: true, clients: true, builder: true, bookings: true, invoices: true, vouchers: true, master: true, reports: true, landing: true, settings: true, viewPricing: true } },
  { name: 'Sales', system: false, perms: { dashboard: true, clients: true, builder: true, bookings: true, invoices: false, vouchers: true, master: false, reports: true, landing: true, settings: false, viewPricing: true } },
  { name: 'Operations', system: false, perms: { dashboard: true, clients: true, builder: true, bookings: true, invoices: false, vouchers: true, master: true, reports: false, landing: false, settings: false, viewPricing: false } },
  { name: 'Accounts', system: false, perms: { dashboard: true, clients: false, builder: false, bookings: true, invoices: true, vouchers: false, master: false, reports: true, landing: false, settings: false, viewPricing: true } },
]

export const ASSIGNMENT_DEFAULT = {
  enabled: true,
  rules: [],
  fallback: { mode: 'all', members: [], next: 0 },
}

const img = (id) => `https://images.unsplash.com/photo-${id}?w=1400&q=72&auto=format&fit=crop`

export const landingDefault = (agencyName = 'Wandra Travels', logo = '') => ({
  slug: agencyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
  published: true,
  accent: '#111113',
  order: ['hero', 'about', 'form'],
  header: { enabled: true, logo, name: agencyName, ctaText: 'Enquire now' },
  hero: {
    enabled: true,
    heading: 'Journeys crafted around you',
    sub: 'Handpicked hotels, private cabs and day-by-day plans across Kashmir & beyond — planned end to end by real humans.',
    ctaText: 'Plan my trip',
    image: img('1506905925346-21bda4d32df4'),
  },
  about: {
    enabled: true,
    title: 'Why travel with us',
    body: 'We are a full-service travel studio. Every trip is built from scratch — the hotels we trust, drivers we know by name, and experiences we have done ourselves.',
    image: img('1476514525535-07fb3b4ae5f1'),
    points: ['Handpicked hotels & houseboats', 'Private cabs, airport to airport', '24×7 on-trip support'],
  },
  form: {
    enabled: true,
    title: 'Send Package Enquiry',
    sub: 'Tell us about your trip — we usually reply within 30 minutes.',
    buttonText: 'Send Enquiry',
    successMsg: 'Thank you! Your enquiry is with our travel experts — expect a call shortly.',
    fields: { adults: true, children: true, email: true, fromCity: true, destination: true, startDate: true, days: true, comments: true },
  },
})

export const CATEGORY_GROUPS = [
  'Meals', 'Hotel Policies', 'Services & Support', 'Visa & Drinks',
  'Transportation', 'Insurance & Medical', 'Personal Expenses', 'Policy / Cancellation', 'Travel Costs',
]
