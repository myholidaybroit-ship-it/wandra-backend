/**
 * FULL end-to-end feature sweep — admin panel + SaaS CRM + public + backend.
 * Runs against an in-memory MongoDB, exercising every feature the frontends use,
 * with behavioural assertions (not just status codes). Run:
 *   node src/seed/e2eFull.mjs
 */
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'

const mongod = await MongoMemoryServer.create()
process.env.MONGODB_URI = mongod.getUri('wandra')
process.env.JWT_SECRET = 'e2e-secret'
process.env.NODE_ENV = 'test'
process.env.SUPER_ADMIN_EMAIL = 'admin@wandra.travel'
process.env.SUPER_ADMIN_PASSWORD = 'wandra@admin'

let pass = 0, fail = 0
const fails = []
const ok = (cond, label) => { if (cond) { pass++; console.log('  ok', label) } else { fail++; fails.push(label); console.error('  x', label) } }
const section = (t) => console.log(`\n\x1b[1m▐ ${t}\x1b[0m`)

const { connectDB } = await import('../config/db.js')
await connectDB()
const { runSeed } = await import('./seedRunner.js')
await runSeed({ fresh: true, quiet: true })

const { createApp } = await import('../app.js')
const server = createApp().listen(0)
const base = `http://localhost:${server.address().port}`

const req = async (method, path, { token, body } = {}) => {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json().catch(() => ({}))
  return { status: res.status, json }
}
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='

try {
  // ══════════════════════════ ADMIN PANEL ══════════════════════════
  section('ADMIN · auth (.env credentials)')
  let r = await req('POST', '/api/admin/auth/login', { body: { email: 'admin@wandra.travel', password: 'wandra@admin' } })
  ok(r.status === 200 && r.json.token, 'admin login with .env creds')
  const aTok = r.json.token
  ok((await req('POST', '/api/admin/auth/login', { body: { email: 'admin@wandra.travel', password: 'x' } })).status === 401, 'admin login rejects wrong password')
  ok((await req('GET', '/api/admin/auth/me', { token: aTok })).json.admin.role === 'Super Admin', 'admin /me')
  ok((await req('PATCH', '/api/admin/auth/profile', { token: aTok, body: { name: 'Boss', notifyNewAgency: false } })).json.admin.name === 'Boss', 'admin profile update')
  ok((await req('POST', '/api/admin/auth/password', { token: aTok, body: { current: 'wandra@admin', next: 'y123456' } })).status === 400, 'admin password change blocked (env-managed)')

  section('ADMIN · dashboard + feature catalog + plans')
  ok((await req('GET', '/api/admin/dashboard', { token: aTok })).json.counts.agencies === 0, 'admin dashboard: clean platform')
  const cat = await req('GET', '/api/admin/feature-catalog', { token: aTok })
  ok(cat.json.groups.length > 10 && cat.json.limits.length > 0, `feature catalog (${cat.json.groups.length} groups)`)
  ok((await req('GET', '/api/admin/plans', { token: aTok })).json.items.length === 2, 'plans list (Free/Pro)')
  ok((await req('PATCH', '/api/admin/plans/Pro', { token: aTok, body: { price: 999 } })).json.price === 999, 'monthly plan pricing update')
  ok((await req('PATCH', '/api/admin/plans/Pro/features', { token: aTok, body: { key: 'reports.view', value: true } })).json.features['reports.view'] === true, 'plan feature toggle')
  ok((await req('PATCH', '/api/admin/plans/Free/limits', { token: aTok, body: { key: 'clients', value: 150 } })).json.limits.clients === 150, 'plan limit update')
  ok((await req('POST', '/api/admin/plans/Free/reset', { token: aTok })).json.limits.clients === 100, 'plan reset to catalog')

  section('ADMIN · agency lifecycle')
  const created = await req('POST', '/api/admin/agencies', { token: aTok, body: { name: 'Acme Travels', owner: 'Tester', email: 'owner@acme.io', phone: '+91 90000 00000', city: 'Pune', plan: 'Free', password: 'acme-pass-1' } })
  ok(created.status === 201 && created.json.code === 'AGY-0001', `agency created (${created.json.code})`)
  ok(created.json.password === 'acme-pass-1', 'custom owner password honoured')
  const agId = created.json.id
  ok((await req('GET', `/api/admin/agencies/${agId}`, { token: aTok })).json.password === 'acme-pass-1', 'admin can view owner password')
  ok((await req('PATCH', `/api/admin/agencies/${agId}`, { token: aTok, body: { city: 'Mumbai' } })).json.city === 'Mumbai', 'agency profile update (admin)')
  ok((await req('PATCH', `/api/admin/agencies/${agId}/features`, { token: aTok, body: { key: 'landing.builder', value: true } })).json.features['landing.builder'] === true, 'per-agency feature override')
  ok((await req('PATCH', `/api/admin/agencies/${agId}/limits`, { token: aTok, body: { key: 'clients', value: 500 } })).json.limits.clients === 500, 'per-agency limit override')
  ok((await req('POST', `/api/admin/agencies/${agId}/features/reset`, { token: aTok })).json.features['landing.builder'] === false, 'reset features to plan defaults')
  ok((await req('POST', '/api/admin/upload', { token: aTok, body: { data: PNG, folder: 'proofs' } })).json.url, 'admin upload endpoint')

  section('ADMIN · suspend / reactivate gate the CRM')
  await req('PATCH', `/api/admin/agencies/${agId}/status`, { token: aTok, body: { status: 'suspended' } })
  ok((await req('POST', '/api/auth/login', { body: { email: 'owner@acme.io', password: 'acme-pass-1' } })).status === 403, 'suspended agency: CRM login blocked')
  await req('PATCH', `/api/admin/agencies/${agId}/status`, { token: aTok, body: { status: 'active' } })
  ok((await req('POST', '/api/auth/login', { body: { email: 'owner@acme.io', password: 'acme-pass-1' } })).status === 200, 'reactivated: CRM login works')

  section('ADMIN · password reset propagates to CRM login')
  await req('POST', `/api/admin/agencies/${agId}/password`, { token: aTok, body: { password: 'reset-pass-2' } })
  ok((await req('POST', '/api/auth/login', { body: { email: 'owner@acme.io', password: 'acme-pass-1' } })).status === 401, 'old password rejected after reset')
  const crmLogin = await req('POST', '/api/auth/login', { body: { email: 'owner@acme.io', password: 'reset-pass-2' } })
  ok(crmLogin.status === 200, 'new password works after reset')
  const cTok = crmLogin.json.token

  section('ADMIN · billing (activate Pro, renewals, downgrade)')
  const pro = await req('POST', `/api/admin/agencies/${agId}/activate-pro`, { token: aTok, body: { method: 'UPI', originalPrice: 999, amount: 999, reference: 'R1' } })
  ok(pro.status === 201 && pro.json.agency.plan === 'Pro' && pro.json.transaction.code === 'INV-0001', 'activate Pro → INV-0001')
  ok(pro.json.agency.features['reports.view'] === true, 'Pro features applied to agency')
  ok((await req('POST', `/api/admin/agencies/${agId}/renewal/request`, { token: aTok })).json.renewal.status === 'requested', 'renewal request')
  ok((await req('POST', '/api/agency/renewal/respond', { token: cTok, body: { answer: 'accepted' } })).json.renewal.status === 'accepted', 'agency responds to renewal (CRM)')
  ok((await req('POST', `/api/admin/agencies/${agId}/renewal/record`, { token: aTok, body: { method: 'UPI', originalPrice: 999, amount: 999, reference: 'R2' } })).json.transaction.code === 'INV-0002', 'renewal recorded → INV-0002')
  ok((await req('GET', '/api/admin/transactions', { token: aTok })).json.total === 2, 'transactions ledger (2)')
  ok((await req('GET', `/api/admin/transactions/${pro.json.transaction.id}`, { token: aTok })).json.code === 'INV-0001', 'transaction detail')

  section('ADMIN · demo requests')
  const demo = await req('POST', '/api/admin/demos', { token: aTok, body: { name: 'Lead A', agencyName: 'X', phone: '9', status: 'pending' } })
  ok(demo.status === 201, 'demo create')
  ok((await req('PATCH', `/api/admin/demos/${demo.json.id}`, { token: aTok, body: { status: 'interested' } })).json.status === 'interested', 'demo update status')
  ok((await req('GET', '/api/admin/demos', { token: aTok })).json.total === 1, 'demo list')
  ok((await req('DELETE', `/api/admin/demos/${demo.json.id}`, { token: aTok })).json.ok, 'demo delete')

  // ══════════════════════════ SAAS / CRM ══════════════════════════
  section('CRM · session, profile, config, dashboard')
  const me = await req('GET', '/api/auth/me', { token: cTok })
  ok(me.json.isAdmin === true && me.json.canSeePricing === true, 'CRM session flags (Admin role)')
  ok((await req('GET', '/api/agency', { token: cTok })).json.categoryGroups.length > 0, 'agency profile + categoryGroups')
  const feats = await req('GET', '/api/agency/features', { token: cTok })
  ok(feats.json.plan === 'Pro' && feats.json.features['bookings.create'] === true, 'agency entitlements map')
  const cfg = await req('GET', '/api/config', { token: cTok })
  ok(cfg.json.plans.find((p) => p.id === 'pro')?.perks?.length && cfg.json.previewThemes.length && cfg.json.categoryGroups.length, 'config: plans+themes+categoryGroups')
  ok((await req('GET', '/api/dashboard', { token: cTok })).json.kpis.clients === 0, 'dashboard KPIs computed (empty)')

  section('CRM · team & roles')
  const staff = await req('POST', '/api/users', { token: cTok, body: { name: 'Aamir', email: 'aamir@acme.io', role: 'Sales', password: 'p1' } })
  ok(staff.status === 201, 'create staff user')
  ok((await req('GET', '/api/users', { token: cTok })).json.total === 2, 'users list (owner + staff)')
  const roles = await req('GET', '/api/roles', { token: cTok })
  ok(roles.json.total === 4, 'default roles seeded (4)')
  const salesRole = roles.json.items.find((x) => x.name === 'Sales')
  ok((await req('PATCH', `/api/roles/${salesRole.id}/perm`, { token: cTok, body: { key: 'invoices', value: true } })).json.perms.invoices === true, 'role permission toggle')
  const adminRole = roles.json.items.find((x) => x.system)
  ok((await req('DELETE', `/api/roles/${adminRole.id}`, { token: cTok })).status === 400, 'system role protected from delete')

  section('CRM · lead assignment (round-robin rule)')
  await req('POST', '/api/assignment/rules', { token: cTok, body: { name: 'Goa team', field: 'destination', values: ['Goa'], members: ['Aamir'] } })
  ok((await req('GET', '/api/assignment', { token: cTok })).json.rules.length === 1, 'assignment rule added')
  const ruleLead = await req('POST', '/api/clients', { token: cTok, body: { name: 'Rule Lead', phone: '9001', interest: 'Goa trip', source: 'Ad' } })
  ok(ruleLead.json.query.assignee === 'Aamir', `auto-assigned by rule → ${ruleLead.json.query.assignee}`)
  const rid = (await req('GET', '/api/assignment', { token: cTok })).json.rules[0].id
  ok((await req('PATCH', `/api/assignment/rules/${rid}`, { token: cTok, body: { name: 'Goa specialists' } })).json.rules[0].name === 'Goa specialists', 'assignment rule update')
  ok((await req('DELETE', `/api/assignment/rules/${rid}`, { token: cTok })).json.rules.length === 0, 'assignment rule remove')

  section('CRM · user rename cascades to lead assignee')
  await req('PATCH', `/api/users/${staff.json.id}`, { token: cTok, body: { name: 'Aamir Khan' } })
  const afterRename = await req('GET', `/api/clients/${ruleLead.json.id}`, { token: cTok })
  ok(afterRename.json.query.assignee === 'Aamir Khan', 'rename cascaded to lead assignee')

  section('CRM · master data (CRUD + S3 image conversion)')
  const dest = await req('POST', '/api/destinations', { token: cTok, body: { name: 'Goa', type: 'Domestic', location: 'India', image: PNG } })
  ok(dest.status === 201, 'destination create')
  ok((await req('PATCH', `/api/destinations/${dest.json.id}`, { token: cTok, body: { features: 'Beaches' } })).json.features === 'Beaches', 'destination update')
  const hotel = await req('POST', '/api/hotels', { token: cTok, body: { name: 'Sea Hotel', city: 'Goa', buyingPrice: 5000, image: PNG } })
  ok(hotel.status === 201, 'hotel create')
  const cab = await req('POST', '/api/cabs', { token: cTok, body: { name: 'Innova', type: 'SUV', ratePerKm: 20 } })
  ok(cab.status === 201, 'cab create')
  ok((await req('POST', '/api/services', { token: cTok, body: { name: 'Airport pickup', cost: 1000, sell: 1400 } })).status === 201, 'service location create')
  ok((await req('POST', '/api/activities', { token: cTok, body: { name: 'Scuba', cost: 2000, sell: 3000 } })).status === 201, 'activity create')
  ok((await req('GET', '/api/destinations?q=goa', { token: cTok })).json.items.length === 1, 'master search filter')
  const itin = await req('POST', '/api/itinerary-templates', { token: cTok, body: { name: 'Arrival Day', mealPlan: 'Dinner' } })
  ok(itin.status === 201, 'itinerary day-template create')

  section('CRM · inclusion presets')
  ok((await req('POST', '/api/inclusions', { token: cTok, body: { dest: 'Goa', type: 'inclusions', text: 'Breakfast' } })).json.byDest.Goa.inclusions.includes('Breakfast'), 'inclusion add')
  ok((await req('PATCH', '/api/inclusions', { token: cTok, body: { dest: 'Goa', type: 'inclusions', oldText: 'Breakfast', newText: 'All meals' } })).json.byDest.Goa.inclusions.includes('All meals'), 'inclusion rename')
  ok(!(await req('DELETE', '/api/inclusions', { token: cTok, body: { dest: 'Goa', type: 'inclusions', text: 'All meals' } })).json.byDest.Goa.inclusions.length, 'inclusion remove')

  section('CRM · clients / leads + documents')
  const client = await req('POST', '/api/clients', { token: cTok, body: { name: 'Zubair', phone: '9002', email: 'z@x.io', interest: 'Goa', source: 'Referral', budget: 90000 } })
  ok(client.status === 201 && /^CLI-\d{6}-\d{3}$/.test(client.json.code), `client create (${client.json.code})`)
  const cid = client.json.id
  ok((await req('GET', '/api/clients?q=zubair', { token: cTok })).json.items.length === 1, 'client search')
  ok((await req('PATCH', `/api/clients/${cid}`, { token: cTok, body: { tripStatus: 'In Progress' } })).json.tripStatus === 'In Progress', 'client update')
  const withDoc = await req('POST', `/api/clients/${cid}/docs`, { token: cTok, body: { name: 'Passport', url: PNG } })
  ok(withDoc.json.docs.length === 1, 'client document add')
  ok((await req('DELETE', `/api/clients/${cid}/docs/${withDoc.json.docs[0].id}`, { token: cTok })).json.docs.length === 0, 'client document remove')

  section('CRM · package builder + pricing + quotation')
  const pkgBody = { clientId: cid, clientName: 'Zubair', destination: 'Goa - India', days: 4, nights: 3, hotelsAlloc: [{ price: 22000, net: 18000 }], cabs: [{ km: 200, rate: 20 }], categories: [{ name: 'Scuba', amount: 6000 }], pricing: { mode: 'Total', packageCost: 5000, gstPercent: 5 } }
  const pkg = await req('POST', '/api/packages', { token: cTok, body: pkgBody })
  ok(pkg.status === 201 && pkg.json.computed.grandTotal > 0, `package built (₹${pkg.json.computed.grandTotal})`)
  const pid = pkg.json.id
  ok((await req('POST', '/api/packages/price', { token: cTok, body: pkgBody })).json.grandTotal === pkg.json.computed.grandTotal, 'pricing preview matches')
  ok((await req('GET', '/api/quotations', { token: cTok })).json.items.some((q) => q.packageCode === pkg.json.code), 'auto-quotation created')
  ok((await req('PATCH', `/api/packages/${pid}`, { token: cTok, body: { nights: 4 } })).json.nights === 4, 'package update')
  ok((await req('PATCH', `/api/packages/${pid}/status`, { token: cTok, body: { status: 'Quoted' } })).json.status === 'Quoted', 'package status change')
  ok((await req('POST', `/api/packages/${pid}/logs`, { token: cTok, body: { text: 'Called client' } })).json.logs.length >= 1, 'package activity log')

  section('CRM · package templates → clone')
  const tpl = await req('POST', '/api/templates', { token: cTok, body: { name: 'Goa 3N', destination: 'Goa', nights: 3, days: 4, hotelsAlloc: [{ price: 20000, net: 16000 }], pricing: { mode: 'Total', packageCost: 4000, gstPercent: 5 } } })
  ok(tpl.status === 201, 'package template create')
  const cloned = await req('POST', '/api/packages/from-template', { token: cTok, body: { templateId: tpl.json.id, clientId: cid } })
  ok(cloned.status === 201 && cloned.json.fromTemplate === 'Goa 3N', 'package cloned from template')
  ok((await req('GET', `/api/templates/${tpl.json.id}`, { token: cTok })).json.usedCount === 1, 'template usedCount incremented')

  section('CRM · booking → invoice → payment cascade')
  const booking = await req('POST', '/api/bookings/from-package', { token: cTok, body: { packageId: pid } })
  ok(booking.status === 201 && /^BKG-\d{6}-\d{4}$/.test(booking.json.code), `booking created (${booking.json.code})`)
  const bid = booking.json.id
  ok((await req('GET', `/api/packages/${pid}`, { token: cTok })).json.status === 'Booked', 'package → Booked')
  const invs = await req('GET', '/api/invoices', { token: cTok })
  const inv = invs.json.items.find((i) => i.booking === bid)
  ok(!!inv, 'invoice auto-generated for booking')
  ok((await req('GET', '/api/clients/' + cid, { token: cTok })).json.tripStatus === 'Converted', 'client → Converted')
  ok((await req('POST', `/api/bookings/${bid}/payments`, { token: cTok, body: { date: '2026-07-09', method: 'UPI', amount: 10000 } })).json.paid === 10000, 'booking payment recorded')
  ok((await req('PATCH', `/api/bookings/${bid}/status`, { token: cTok, body: { status: 'Confirmed' } })).json.status === 'Confirmed', 'booking status update')

  section('CRM · invoices')
  const inv2 = await req('POST', '/api/invoices', { token: cTok, body: { clientName: 'Zubair', type: 'Advance', items: [{ description: 'Advance', qty: 1, rate: 20000, tax: 0 }] } })
  ok(inv2.status === 201 && /^INV-\d{6}-\d{4}$/.test(inv2.json.code), `invoice create (${inv2.json.code})`)
  const paid = await req('POST', `/api/invoices/${inv2.json.id}/payments`, { token: cTok, body: { date: '2026-07-09', method: 'Cash', amount: 20000 } })
  ok(paid.json.status === 'Paid', 'invoice fully paid → status Paid')
  ok((await req('PATCH', `/api/invoices/${inv2.json.id}`, { token: cTok, body: { dueDate: '2026-08-01' } })).json.dueDate === '2026-08-01', 'invoice update')

  section('CRM · quotations, vouchers, stories')
  const quote = (await req('GET', '/api/quotations', { token: cTok })).json.items[0]
  ok((await req('PATCH', `/api/quotations/${quote.id}/status`, { token: cTok, body: { status: 'Sent' } })).json.status === 'Sent', 'quotation status update')
  const vch = await req('POST', '/api/vouchers', { token: cTok, body: { type: 'Hotel', clientName: 'Zubair', title: 'Sea Hotel stay', fields: [{ k: 'Nights', v: '3' }] } })
  ok(vch.status === 201 && /^VCH-\d{4}$/.test(vch.json.code), `voucher create (${vch.json.code})`)
  ok((await req('GET', `/api/vouchers/${vch.json.id}`, { token: cTok })).json.title === 'Sea Hotel stay', 'voucher detail')
  const story = await req('POST', '/api/stories', { token: cTok, body: { client: 'Zubair', rating: 5, text: 'Great trip!' } })
  ok(story.status === 201 && story.json.status === 'Pending', 'story create (pending)')
  ok((await req('PATCH', `/api/stories/${story.json.id}/approve`, { token: cTok })).json.status === 'Published', 'story approve → Published')

  section('CRM · landing builder')
  ok((await req('GET', '/api/landing', { token: cTok })).json.slug, 'landing config exists')
  ok((await req('PATCH', '/api/landing', { token: cTok, body: { accent: '#ff0000', hero: { heading: 'Visit Goa' } } })).json.hero.heading === 'Visit Goa', 'landing update (section merge)')

  section('CRM · upload endpoint')
  ok((await req('POST', '/api/upload', { token: cTok, body: { data: PNG, folder: 'logo' } })).json.url, 'agency upload endpoint')

  // ══════════════════════════ PUBLIC ══════════════════════════
  section('PUBLIC · client-facing pages')
  const landing = await req('GET', '/api/landing', { token: cTok })
  const slug = landing.json.slug
  ok((await req('GET', `/api/public/itinerary/${pkg.json.code}`)).json.agency.name === 'Acme Travels', 'public itinerary by code')
  ok((await req('GET', `/api/public/invoice/${inv2.json.code}`)).json.invoice.code === inv2.json.code, 'public invoice by code')
  ok((await req('GET', `/api/public/voucher/${vch.json.id}`)).json.voucher.code === vch.json.code, 'public voucher by id')
  ok((await req('GET', `/api/public/site/${slug}`)).json.landing.slug === slug, 'public landing site by slug')
  const pubLead = await req('POST', `/api/public/site/${slug}/lead`, { body: { name: 'Web Visitor', phone: '9999', destination: 'Goa' } })
  ok(pubLead.status === 201, 'public landing lead submission')
  ok((await req('GET', '/api/clients', { token: cTok })).json.items.some((c) => c.name === 'Web Visitor'), 'public lead landed in CRM')
  ok((await req('GET', `/api/public/stories/${slug}`)).json.stories.length === 1, 'public gallery (published stories)')
  ok((await req('POST', `/api/public/stories/${slug}`, { body: { client: 'Happy Traveller', rating: 5, text: 'Loved it', image: PNG } })).status === 201, 'public story submission')

  // ══════════════════════════ SECURITY / MULTI-TENANCY ══════════════════════════
  section('SECURITY · tenant isolation + auth guards + limits')
  const ag2 = await req('POST', '/api/admin/agencies', { token: aTok, body: { name: 'Rival Co', owner: 'Riv', email: 'owner@rival.io', plan: 'Free' } })
  const l2 = await req('POST', '/api/auth/login', { body: { email: 'owner@rival.io', password: ag2.json.password } })
  ok((await req('GET', '/api/clients', { token: l2.json.token })).json.total === 0, 'TENANT ISOLATION: rival sees none of Acme data')
  ok((await req('GET', `/api/packages/${pid}`, { token: l2.json.token })).status === 404, 'cannot fetch another tenant\'s package')
  ok((await req('GET', '/api/clients')).status === 401, 'CRM route blocked without token')
  ok((await req('GET', '/api/admin/agencies')).status === 401, 'admin route blocked without token')
  ok((await req('POST', '/api/admin/agencies', { token: cTok, body: {} })).status === 403, 'agency token cannot access admin realm')

  section('FEATURE CONTROL · admin toggles gate the agency')
  // disable a module for the agency → its CRM route is blocked + entitlements reflect it
  await req('PATCH', `/api/admin/agencies/${agId}/features`, { token: aTok, body: { key: 'master.hotels', value: false } })
  ok((await req('GET', '/api/agency/features', { token: cTok })).json.features['master.hotels'] === false, 'agency sees feature disabled in entitlements')
  ok((await req('GET', '/api/hotels', { token: cTok })).status === 402, 'disabled module route returns 402 (blocked)')
  // re-enable → works again
  await req('PATCH', `/api/admin/agencies/${agId}/features`, { token: aTok, body: { key: 'master.hotels', value: true } })
  ok((await req('GET', '/api/hotels', { token: cTok })).status === 200, 're-enabled module route works again')
  // bulk group toggle
  await req('PATCH', `/api/admin/agencies/${agId}/features`, { token: aTok, body: { patch: { 'reviews.view': false, 'landing.builder': false } } })
  const ents = (await req('GET', '/api/agency/features', { token: cTok })).json.features
  ok(ents['reviews.view'] === false && ents['landing.builder'] === false, 'bulk feature patch applied')
  ok((await req('GET', '/api/landing', { token: cTok })).status === 402 && (await req('GET', '/api/stories', { token: cTok })).status === 402, 'bulk-disabled modules blocked')
  await req('PATCH', `/api/admin/agencies/${agId}/features`, { token: aTok, body: { patch: { 'reviews.view': true, 'landing.builder': true } } })

  section('CLEANUP · delete flows')
  ok((await req('POST', `/api/bookings/${bid}/cancel`, { token: cTok })).json.status === 'Cancelled', 'booking cancel (rollback)')
  ok((await req('GET', `/api/packages/${pid}`, { token: cTok })).json.status === 'Quoted', 'package rolled back to Quoted')
  ok((await req('DELETE', `/api/vouchers/${vch.json.id}`, { token: cTok })).json.ok, 'voucher delete')
  ok((await req('DELETE', `/api/hotels/${hotel.json.id}`, { token: cTok })).json.ok, 'hotel delete')
  ok((await req('DELETE', `/api/clients/${cid}`, { token: cTok })).json.ok, 'client delete')
  ok((await req('DELETE', `/api/admin/agencies/${agId}`, { token: aTok })).json.ok, 'agency delete (cascade)')

  console.log(`\n${'═'.repeat(48)}`)
  console.log(`${fail === 0 ? '\x1b[32mOK ALL FEATURES PASSED' : '\x1b[31mFAIL SOME FAILED'}\x1b[0m — ${pass} passed, ${fail} failed`)
  if (fails.length) console.log('Failures:\n - ' + fails.join('\n - '))
} catch (err) {
  console.error('\n Threw:', err)
  fail++
} finally {
  server.close(); await mongoose.disconnect(); await mongod.stop()
  process.exit(fail === 0 ? 0 : 1)
}
