/* ============================================================
   Wandra — master FEATURE CATALOG
   Every capability in the Wandra SaaS, grouped by module.
   Each feature has a stable `key`, a human label, a short desc,
   and per-plan defaults (free / pro). The admin can override
   any feature per-agency (granular control).
   ============================================================ */

export const FEATURE_GROUPS = [
  {
    key: 'dashboard',
    label: 'Dashboard & Analytics',
    icon: 'dashboard',
    features: [
      { key: 'dashboard.view', label: 'Access dashboard', desc: 'See the main analytics dashboard', free: true, pro: true },
      { key: 'dashboard.revenue_kpis', label: 'Revenue KPI cards', desc: 'Revenue, bookings, clients KPI tiles', free: true, pro: true },
      { key: 'dashboard.sparklines', label: 'KPI sparklines', desc: 'Trend mini-charts on KPI cards', free: false, pro: true },
      { key: 'dashboard.revenue_chart', label: 'Revenue area chart', desc: 'Revenue-over-time chart', free: false, pro: true },
      { key: 'dashboard.funnel', label: 'Lead funnel', desc: 'Pipeline conversion funnel', free: false, pro: true },
      { key: 'dashboard.sources', label: 'Lead sources donut', desc: 'Breakdown of lead sources', free: false, pro: true },
      { key: 'dashboard.cashflow', label: 'Cashflow columns', desc: 'Monthly collection stacked chart', free: false, pro: true },
      { key: 'dashboard.invoice_aging', label: 'Invoice aging', desc: 'Outstanding invoices by age', free: false, pro: true },
      { key: 'dashboard.profit_margin', label: 'Profit-margin chart', desc: 'Profit vs margin combo chart', free: false, pro: true },
      { key: 'dashboard.heatmap', label: 'Inquiry heatmap', desc: 'Weekly inquiry intensity grid', free: false, pro: true },
    ],
  },
  {
    key: 'crm',
    label: 'CRM — Leads & Clients',
    icon: 'clients',
    features: [
      { key: 'crm.view', label: 'View clients & trips', desc: 'Access the Trips & Clients list', free: true, pro: true },
      { key: 'crm.create', label: 'Create client / lead', desc: 'Add new queries and clients', free: true, pro: true },
      { key: 'crm.edit', label: 'Edit client', desc: 'Modify client records', free: true, pro: true },
      { key: 'crm.delete', label: 'Delete client', desc: 'Remove client records', free: false, pro: true },
      { key: 'crm.pipeline', label: 'Trip status pipeline', desc: 'New Query → Converted → On Trip stages', free: true, pro: true },
      { key: 'crm.lead_temp', label: 'Lead temperature', desc: 'Warm/hot lead scoring', free: false, pro: true },
      { key: 'crm.source_tracking', label: 'Source tracking', desc: 'Track where each lead came from', free: true, pro: true },
      { key: 'crm.documents', label: 'Client documents', desc: 'Upload passports, tickets, visas per traveler', free: false, pro: true },
      { key: 'crm.notes', label: 'Notes & comments', desc: 'Internal notes and activity log', free: true, pro: true },
      { key: 'crm.whatsapp', label: 'WhatsApp client', desc: 'One-click WhatsApp to client', free: false, pro: true },
      { key: 'crm.bulk_import', label: 'Bulk import', desc: 'Import clients from CSV/Excel', free: false, pro: true },
      { key: 'crm.export', label: 'Export clients', desc: 'Download client list as CSV', free: false, pro: true },
      { key: 'crm.tags', label: 'Tags', desc: 'Custom tags on clients', free: true, pro: true },
      { key: 'crm.followup', label: 'Follow-up reminders', desc: 'Tasks & reminders per lead', free: false, pro: true },
    ],
  },
  {
    key: 'builder',
    label: 'Quote & Package Builder',
    icon: 'packages',
    features: [
      { key: 'builder.access', label: 'Access builder', desc: 'Open the quote/package builder', free: true, pro: true },
      { key: 'builder.multi_option', label: 'Multiple options', desc: 'Option 1/2/3 variant quotes', free: false, pro: true },
      { key: 'builder.multi_destination', label: 'Multi-destination sectors', desc: 'Multi-city trip sectors', free: false, pro: true },
      { key: 'builder.hotels', label: 'Hotel allocation', desc: 'Per-night hotel & room allocation', free: true, pro: true },
      { key: 'builder.transports', label: 'Transports', desc: 'Cabs & transfers', free: true, pro: true },
      { key: 'builder.activities', label: 'Activities & tickets', desc: 'Sightseeing & activity lines', free: true, pro: true },
      { key: 'builder.flights', label: 'Flight details', desc: 'Rich flight cards', free: false, pro: true },
      { key: 'builder.inclusions', label: 'Inclusions / exclusions', desc: 'Managed inclusion & exclusion lists', free: true, pro: true },
      { key: 'builder.markup', label: 'Markup engine', desc: 'Percentage / flat markup pricing', free: true, pro: true },
      { key: 'builder.tax_config', label: 'Tax configuration', desc: 'GST / tax on cost or cost+markup', free: false, pro: true },
      { key: 'builder.rounding', label: 'Price rounding', desc: 'Round selling price to 100/500/1000', free: false, pro: true },
      { key: 'builder.templates', label: 'Package templates', desc: 'Save & reuse itinerary templates', free: false, pro: true },
      { key: 'builder.copy_option', label: 'Copy / duplicate option', desc: 'Clone options between quotes', free: false, pro: true },
      { key: 'builder.profit_view', label: 'Profit visibility', desc: 'Show cost & profit inside builder', free: false, pro: true },
      { key: 'builder.ai_itinerary', label: 'AI itinerary builder', desc: 'AI-assisted day-plan generation', free: false, pro: true },
      { key: 'builder.day_wise', label: 'Day-wise itinerary', desc: 'Timeline day-by-day plan', free: true, pro: true },
    ],
  },
  {
    key: 'pdf',
    label: 'Itineraries & PDF',
    icon: 'file',
    features: [
      { key: 'pdf.export', label: 'PDF export', desc: 'Download itinerary as PDF', free: true, pro: true },
      { key: 'pdf.classic', label: 'Classic theme', desc: 'Classic PDF layout', free: true, pro: true },
      { key: 'pdf.vivid', label: 'Vivid theme', desc: 'Colorful cover PDF layout', free: false, pro: true },
      { key: 'pdf.mono', label: 'Mono theme', desc: 'Minimal black & white PDF', free: false, pro: true },
      { key: 'pdf.luxe', label: 'Luxe theme', desc: 'Premium dark + gold PDF', free: false, pro: true },
      { key: 'pdf.compact', label: 'Compact theme', desc: 'One-page summary PDF', free: false, pro: true },
      { key: 'pdf.studio', label: 'PDF Studio', desc: 'Live PDF customiser (Holiday/Coastal)', free: false, pro: true },
      { key: 'pdf.custom_branding', label: 'Custom PDF branding', desc: 'Own logo & colors on PDFs', free: false, pro: true },
      { key: 'pdf.remove_watermark', label: 'Remove "Powered by Wandra"', desc: 'Hide Wandra footer on documents', free: false, pro: true },
      { key: 'pdf.whatsapp_itinerary', label: 'WhatsApp itinerary', desc: 'Rich WhatsApp itinerary message', free: true, pro: true },
      { key: 'pdf.email_itinerary', label: 'Email itinerary', desc: 'Professional email itinerary', free: true, pro: true },
      { key: 'pdf.public_share', label: 'Public share link', desc: 'Tokenized shareable itinerary page', free: true, pro: true },
      { key: 'pdf.share_themes', label: 'Preview themes', desc: 'Multiple public itinerary themes', free: false, pro: true },
      { key: 'pdf.image_rich', label: 'Image-rich PDFs', desc: 'Destination & hotel photos in PDF', free: false, pro: true },
    ],
  },
  {
    key: 'bookings',
    label: 'Bookings',
    icon: 'bookings',
    features: [
      { key: 'bookings.view', label: 'View bookings', desc: 'Access bookings list', free: true, pro: true },
      { key: 'bookings.create', label: 'Create booking', desc: 'Convert a package to a booking', free: true, pro: true },
      { key: 'bookings.cancel', label: 'Cancel booking', desc: 'Cancel & roll back a booking', free: false, pro: true },
      { key: 'bookings.runsheet', label: 'Operational run-sheet', desc: 'Day-by-day booking schedule', free: false, pro: true },
      { key: 'bookings.payments', label: 'Record payments', desc: 'Add payments against bookings', free: true, pro: true },
      { key: 'bookings.countdown', label: 'Trip countdown', desc: 'Days-to-departure indicators', free: false, pro: true },
      { key: 'bookings.assign_ops', label: 'Assign to operations', desc: 'Hand off bookings to ops team', free: false, pro: true },
    ],
  },
  {
    key: 'invoices',
    label: 'Invoices & Payments',
    icon: 'invoices',
    features: [
      { key: 'invoices.view', label: 'View invoices', desc: 'Access invoices list', free: true, pro: true },
      { key: 'invoices.create', label: 'Create invoice', desc: 'Raise invoices', free: true, pro: true },
      { key: 'invoices.gst', label: 'GST invoices', desc: 'GST-compliant invoicing', free: false, pro: true },
      { key: 'invoices.non_gst', label: 'Non-GST invoices', desc: 'Simple non-GST invoices', free: true, pro: true },
      { key: 'invoices.payment_history', label: 'Payment history', desc: 'Track partial payments', free: true, pro: true },
      { key: 'invoices.public', label: 'Public invoice link', desc: 'Shareable invoice page', free: false, pro: true },
      { key: 'invoices.pdf', label: 'Invoice PDF', desc: 'Download invoice PDF', free: true, pro: true },
      { key: 'invoices.reminders', label: 'Payment reminders', desc: 'Automated due reminders', free: false, pro: true },
      { key: 'invoices.settings', label: 'Invoice settings', desc: 'Numbering, terms, tax config', free: false, pro: true },
      { key: 'invoices.multi_currency', label: 'Multi-currency', desc: 'Invoice in multiple currencies', free: false, pro: true },
      { key: 'invoices.payment_gateway', label: 'Online payment link', desc: 'Collect via payment gateway', free: false, pro: true },
    ],
  },
  {
    key: 'quotations',
    label: 'Quotations',
    icon: 'quotations',
    features: [
      { key: 'quotations.view', label: 'View quotations', desc: 'Access quotations list', free: true, pro: true },
      { key: 'quotations.send', label: 'Send quotation', desc: 'Mark & share quotations', free: true, pro: true },
      { key: 'quotations.pdf', label: 'Quotation PDF', desc: 'Download quotation PDF', free: true, pro: true },
      { key: 'quotations.followup', label: 'Quotation follow-up', desc: 'Track sent/viewed status', free: false, pro: true },
      { key: 'quotations.approval', label: 'Client approval', desc: 'Online accept/reject by client', free: false, pro: true },
    ],
  },
  {
    key: 'vouchers',
    label: 'Vouchers',
    icon: 'file',
    features: [
      { key: 'vouchers.view', label: 'View vouchers', desc: 'Access vouchers', free: true, pro: true },
      { key: 'vouchers.generate', label: 'Auto-generate from package', desc: 'Build vouchers from a package', free: false, pro: true },
      { key: 'vouchers.hotel', label: 'Hotel voucher', desc: 'Hotel confirmation vouchers', free: true, pro: true },
      { key: 'vouchers.transport', label: 'Transport voucher', desc: 'Cab / transfer vouchers', free: true, pro: true },
      { key: 'vouchers.activity', label: 'Activity voucher', desc: 'Activity / ticket vouchers', free: true, pro: true },
      { key: 'vouchers.pdf', label: 'Voucher PDF', desc: 'Download printable voucher', free: true, pro: true },
      { key: 'vouchers.custom_terms', label: 'Custom voucher terms', desc: 'Editable terms & conditions', free: false, pro: true },
    ],
  },
  {
    key: 'master',
    label: 'Master Data',
    icon: 'database',
    features: [
      { key: 'master.destinations', label: 'Destinations', desc: 'Manage destinations master', free: true, pro: true },
      { key: 'master.hotels', label: 'Hotels', desc: 'Manage hotels & bed pricing', free: true, pro: true },
      { key: 'master.cabs', label: 'Cab Types', desc: 'Manage cab types & rates', free: true, pro: true },
      { key: 'master.service_locations', label: 'Transport', desc: 'Transport routes master', free: false, pro: true },
      { key: 'master.activities', label: 'Activities', desc: 'Activities & tickets master', free: false, pro: true },
      { key: 'master.inclusions', label: 'Inclusion presets', desc: 'Reusable inclusion/exclusion lists', free: true, pro: true },
      { key: 'master.gallery_images', label: 'Master images', desc: 'Photos on destinations & hotels', free: false, pro: true },
      { key: 'master.bulk_edit', label: 'Bulk edit master', desc: 'Edit master data in bulk', free: false, pro: true },
    ],
  },
  {
    key: 'reports',
    label: 'Reports',
    icon: 'reports',
    features: [
      { key: 'reports.view', label: 'View reports', desc: 'Access the reports module', free: false, pro: true },
      { key: 'reports.sales', label: 'Sales report', desc: 'Lead & conversion report', free: false, pro: true },
      { key: 'reports.profit', label: 'Profit report', desc: 'Selling − buying profit report', free: false, pro: true },
      { key: 'reports.destination', label: 'Destination report', desc: 'Top destinations breakdown', free: false, pro: true },
      { key: 'reports.source', label: 'Source report', desc: 'Performance by lead source', free: false, pro: true },
      { key: 'reports.team', label: 'Team performance', desc: 'Per-salesperson breakdown', free: false, pro: true },
      { key: 'reports.export_csv', label: 'Export CSV', desc: 'Download report summary', free: false, pro: true },
      { key: 'reports.export_excel', label: 'Export Excel', desc: 'Download leads as Excel', free: false, pro: true },
      { key: 'reports.custom_range', label: 'Custom date range', desc: 'Arbitrary reporting periods', free: false, pro: true },
    ],
  },
  {
    key: 'reviews',
    label: 'Reviews & Gallery',
    icon: 'star',
    features: [
      { key: 'reviews.view', label: 'View reviews', desc: 'Access testimonials', free: true, pro: true },
      { key: 'reviews.collect', label: 'Collect stories', desc: 'Send story-submission links', free: false, pro: true },
      { key: 'reviews.public_gallery', label: 'Public gallery', desc: 'Public traveler-stories wall', free: false, pro: true },
      { key: 'reviews.moderate', label: 'Moderate reviews', desc: 'Approve / hide stories', free: true, pro: true },
      { key: 'reviews.star_rating', label: 'Star ratings', desc: 'Collect 1–5 star ratings', free: true, pro: true },
      { key: 'reviews.photos', label: 'Review photos', desc: 'Traveler photo uploads', free: false, pro: true },
    ],
  },
  {
    key: 'landing',
    label: 'Landing Page Builder',
    icon: 'wand',
    features: [
      { key: 'landing.builder', label: 'Landing builder', desc: 'Build a lead-capture site', free: false, pro: true },
      { key: 'landing.publish', label: 'Publish site', desc: 'Go live on a public URL', free: false, pro: true },
      { key: 'landing.lead_form', label: 'Lead capture form', desc: 'Public inquiry form', free: true, pro: true },
      { key: 'landing.custom_accent', label: 'Custom brand color', desc: 'Set accent color', free: false, pro: true },
      { key: 'landing.custom_logo', label: 'Custom logo', desc: 'Upload site logo', free: false, pro: true },
      { key: 'landing.sections', label: 'Reorder sections', desc: 'Drag-and-drop section order', free: false, pro: true },
      { key: 'landing.custom_domain', label: 'Custom domain', desc: 'Connect your own domain', free: false, pro: true },
      { key: 'landing.multi_page', label: 'Multiple landing pages', desc: 'More than one campaign page', free: false, pro: true },
    ],
  },
  {
    key: 'team',
    label: 'Team & Roles',
    icon: 'users',
    features: [
      { key: 'team.users', label: 'User management', desc: 'Add & manage staff accounts', free: false, pro: true },
      { key: 'team.roles', label: 'Roles & permissions', desc: 'Per-role feature access matrix', free: false, pro: true },
      { key: 'team.custom_roles', label: 'Custom roles', desc: 'Create bespoke roles', free: false, pro: true },
      { key: 'team.lead_assignment', label: 'Lead assignment rules', desc: 'Auto-route leads to staff', free: false, pro: true },
      { key: 'team.round_robin', label: 'Round-robin routing', desc: 'Rotate leads across the team', free: false, pro: true },
      { key: 'team.activity_log', label: 'Team activity log', desc: 'Audit who did what', free: false, pro: true },
      { key: 'team.performance', label: 'Team load view', desc: 'Live per-member workload', free: false, pro: true },
    ],
  },
  {
    key: 'branding',
    label: 'Branding & Settings',
    icon: 'settings',
    features: [
      { key: 'branding.agency_profile', label: 'Agency profile', desc: 'Brand name, contact, address', free: true, pro: true },
      { key: 'branding.logo', label: 'Agency logo', desc: 'Upload logo used on documents', free: true, pro: true },
      { key: 'branding.bank_details', label: 'Bank details', desc: '"Secure your booking" block', free: true, pro: true },
      { key: 'branding.gst_config', label: 'GST / tax number', desc: 'Tax identity on invoices', free: false, pro: true },
      { key: 'branding.currency', label: 'Currency', desc: 'Set operating currency', free: true, pro: true },
      { key: 'branding.email_signature', label: 'Email signature', desc: 'Branded email footer', free: false, pro: true },
      { key: 'branding.white_label', label: 'White-label', desc: 'Fully remove Wandra branding', free: false, pro: true },
      { key: 'branding.custom_domain', label: 'Custom email domain', desc: 'Send from your domain', free: false, pro: true },
      { key: 'branding.theme', label: 'Theme customization', desc: 'Adjust app accent colors', free: false, pro: true },
    ],
  },
  {
    key: 'integrations',
    label: 'Integrations & API',
    icon: 'layers',
    features: [
      { key: 'integrations.whatsapp', label: 'WhatsApp integration', desc: 'WhatsApp share & CTAs', free: true, pro: true },
      { key: 'integrations.email_smtp', label: 'Email (SMTP)', desc: 'Send via your own SMTP', free: false, pro: true },
      { key: 'integrations.payment_gateway', label: 'Payment gateway', desc: 'Razorpay / Stripe collection', free: false, pro: true },
      { key: 'integrations.calendly', label: 'Calendly', desc: 'Embed booking calendar', free: false, pro: true },
      { key: 'integrations.google_calendar', label: 'Google Calendar', desc: 'Sync trips to calendar', free: false, pro: true },
      { key: 'integrations.api_access', label: 'API access', desc: 'REST API keys', free: false, pro: true },
      { key: 'integrations.webhooks', label: 'Webhooks', desc: 'Event webhooks', free: false, pro: true },
      { key: 'integrations.zapier', label: 'Zapier', desc: 'Connect 5000+ apps', free: false, pro: true },
      { key: 'integrations.meta_pixel', label: 'Meta Pixel', desc: 'Track landing-page conversions', free: false, pro: true },
    ],
  },
]

/* Numeric usage limits — controlled per plan, overridable per agency.
   -1 means unlimited. */
export const LIMIT_DEFS = [
  { key: 'clients', label: 'Clients / leads', unit: 'records', free: 100, pro: -1 },
  { key: 'packages', label: 'Packages / quotes', unit: 'per month', free: 25, pro: -1 },
  { key: 'team', label: 'Team members', unit: 'seats', free: 1, pro: 15 },
  { key: 'storage', label: 'Cloud storage', unit: 'MB', free: 200, pro: 10240 },
  { key: 'landing_pages', label: 'Landing pages', unit: 'pages', free: 0, pro: 5 },
  { key: 'destinations', label: 'Destinations', unit: 'records', free: 20, pro: -1 },
  { key: 'hotels', label: 'Hotels', unit: 'records', free: 50, pro: -1 },
  { key: 'cabs', label: 'Cab Types', unit: 'records', free: 20, pro: -1 },
]

/* Flat list of every feature key + lookup helpers */
export const ALL_FEATURES = FEATURE_GROUPS.flatMap((g) =>
  g.features.map((f) => ({ ...f, group: g.key, groupLabel: g.label })),
)
export const FEATURE_COUNT = ALL_FEATURES.length

/* Default feature-access map for a given plan id ('Free' | 'Pro') */
export function defaultFeaturesForPlan(planId) {
  const isPro = planId === 'Pro'
  const map = {}
  ALL_FEATURES.forEach((f) => { map[f.key] = isPro ? f.pro : f.free })
  return map
}

/* Default numeric limits for a plan */
export function defaultLimitsForPlan(planId) {
  const isPro = planId === 'Pro'
  const map = {}
  LIMIT_DEFS.forEach((l) => { map[l.key] = isPro ? l.pro : l.free })
  return map
}

export function countEnabled(featureMap) {
  return ALL_FEATURES.reduce((n, f) => n + (featureMap?.[f.key] ? 1 : 0), 0)
}
