/**
 * End-to-end smoke test against an in-memory MongoDB, exercising the REAL SaaS
 * flow with no seeded business data:
 *   seed platform → admin creates an agency → its owner logs into the CRM →
 *   builds data → every dashboard number is computed live.
 * Run:  node src/seed/integrationTest.mjs
 */
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'

const mongod = await MongoMemoryServer.create()
process.env.MONGODB_URI = mongod.getUri('wandra')
process.env.JWT_SECRET = 'test-secret'
process.env.NODE_ENV = 'test'
process.env.SUPER_ADMIN_EMAIL = 'admin@wandra.travel'
process.env.SUPER_ADMIN_PASSWORD = 'wandra@admin'

let pass = 0, fail = 0
const ok = (cond, label) => { if (cond) { pass++; console.log('  ok', label) } else { fail++; console.error('  x', label) } }

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

try {
  ok((await req('GET', '/api/health')).json.ok, 'health check')

  // ── ADMIN: platform starts empty except plans + super admin ──
  const adminLogin = await req('POST', '/api/admin/auth/login', { body: { email: 'admin@wandra.travel', password: 'wandra@admin' } })
  ok(adminLogin.status === 200 && adminLogin.json.token, 'admin login uses .env credentials')
  const aTok = adminLogin.json.token

  // env is the source of truth: wrong password rejected, and password is env-managed
  ok((await req('POST', '/api/admin/auth/login', { body: { email: 'admin@wandra.travel', password: 'nope' } })).status === 401, 'admin login rejects wrong .env password')
  ok((await req('POST', '/api/admin/auth/password', { token: aTok, body: { current: 'wandra@admin', next: 'x123456' } })).status === 400, 'admin password change is env-managed (blocked)')

  ok((await req('GET', '/api/admin/agencies', { token: aTok })).json.total === 0, 'NO seeded agencies (clean platform)')
  ok((await req('GET', '/api/admin/transactions', { token: aTok })).json.total === 0, 'NO seeded transactions')
  ok((await req('GET', '/api/admin/demos', { token: aTok })).json.total === 0, 'NO seeded demos')
  ok((await req('GET', '/api/admin/plans', { token: aTok })).json.items.length === 2, 'plans seeded (Free/Pro)')
  ok((await req('GET', '/api/admin/dashboard', { token: aTok })).json.counts.agencies === 0, 'admin dashboard: 0 agencies')

  // admin provisions the first real agency
  const created = await req('POST', '/api/admin/agencies', { token: aTok, body: { name: 'Test Voyages', owner: 'Tester', email: 'owner@testvoyages.io', phone: '+91 90000 00000', city: 'Pune', plan: 'Free' } })
  ok(created.status === 201 && created.json.code === 'AGY-0001', `first agency created (${created.json.code})`)
  ok(!!created.json.password, 'owner password returned to admin')
  const agencyId = created.json.id
  const ownerPw = created.json.password

  // ── CRM: the new agency logs in — starts with ZERO business data ──
  const crmLogin = await req('POST', '/api/auth/login', { body: { email: 'owner@testvoyages.io', password: ownerPw } })
  ok(crmLogin.status === 200 && crmLogin.json.token && crmLogin.json.isAdmin, 'agency owner logs into CRM')
  const cTok = crmLogin.json.token

  ok((await req('GET', '/api/clients', { token: cTok })).json.total === 0, 'CRM starts with 0 clients (no seed)')
  ok((await req('GET', '/api/packages', { token: cTok })).json.total === 0, 'CRM starts with 0 packages')
  ok((await req('GET', '/api/destinations', { token: cTok })).json.total === 0, 'CRM starts with 0 destinations')
  ok((await req('GET', '/api/itinerary-templates', { token: cTok })).json.total === 0, 'itinerary templates start empty')

  // file upload endpoint (S3 when configured; data-URL fallback otherwise)
  const tinyPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
  const up = await req('POST', '/api/upload', { token: cTok, body: { data: tinyPng, folder: 'logo' } })
  ok(up.status === 200 && typeof up.json.url === 'string', 'agency upload endpoint returns a url')
  ok((await req('POST', '/api/upload', { body: { data: tinyPng } })).status === 401, 'upload blocked without token')

  // config served from backend
  const cfg = await req('GET', '/api/config', { token: cTok })
  ok(cfg.json.plans.length === 2 && cfg.json.plans.find((p) => p.id === 'pro')?.perks?.length, 'config: plan cards with perks')
  ok(cfg.json.previewThemes.length > 0 && cfg.json.categoryGroups.length > 0, 'config: themes + category groups')

  // dashboard is all zeros for a fresh tenant (computed, not faked)
  const dash0 = await req('GET', '/api/dashboard', { token: cTok })
  ok(dash0.json.kpis.clients === 0 && dash0.json.kpis.revenue === 0, 'dashboard KPIs computed = 0 for new tenant')
  ok(Array.isArray(dash0.json.analytics.grossByMonth) && dash0.json.analytics.grossByMonth.every((n) => n === 0), 'analytics computed live (all zero)')

  // build real data
  const lead = await req('POST', '/api/clients', { token: cTok, body: { name: 'First Client', phone: '9990001111', interest: 'Goa', source: 'Referral' } })
  ok(lead.status === 201 && /^CLI-\d{6}-\d{3}$/.test(lead.json.code), `lead created (${lead.json.code})`)

  const pkg = await req('POST', '/api/packages', { token: cTok, body: { clientId: lead.json.id, clientName: 'First Client', destination: 'Goa', days: 3, nights: 2, hotelsAlloc: [{ price: 9000, net: 7000 }], cabs: [{ km: 150, rate: 20 }], pricing: { mode: 'Total', packageCost: 2000, gstPercent: 5 } } })
  ok(pkg.status === 201 && pkg.json.computed.grandTotal > 0, `package built (₹${pkg.json.computed.grandTotal})`)

  const booking = await req('POST', '/api/bookings/from-package', { token: cTok, body: { packageId: pkg.json.id } })
  ok(booking.status === 201 && booking.json.value > 0, `booking + invoice auto-generated (${booking.json.code})`)
  await req('POST', `/api/bookings/${booking.json.id}/payments`, { token: cTok, body: { date: '2026-07-08', method: 'UPI', amount: 5000 } })

  // dashboard now reflects the real data
  const dash1 = await req('GET', '/api/dashboard', { token: cTok })
  ok(dash1.json.kpis.clients === 1 && dash1.json.kpis.bookings === 1 && dash1.json.kpis.revenue === booking.json.value, 'dashboard KPIs now reflect real records')
  ok(dash1.json.recentActivity.length > 0, 'recent activity built from real events')
  ok(dash1.json.analytics.leadSources.some((s) => s.label === 'Referral'), 'analytics leadSources computed from real clients')

  // ── tenant isolation ──
  const ag2 = await req('POST', '/api/admin/agencies', { token: aTok, body: { name: 'Second Agency', owner: 'Two', email: 'owner@second.io', plan: 'Free' } })
  const login2 = await req('POST', '/api/auth/login', { body: { email: 'owner@second.io', password: ag2.json.password } })
  ok((await req('GET', '/api/clients', { token: login2.json.token })).json.total === 0, 'TENANT ISOLATION: second agency sees none of the first agency data')

  // ── billing: activate Pro ──
  const pro = await req('POST', `/api/admin/agencies/${agencyId}/activate-pro`, { token: aTok, body: { method: 'UPI', originalPrice: 3999, amount: 3999, reference: 'TEST-1' } })
  ok(pro.status === 201 && pro.json.agency.plan === 'Pro' && pro.json.transaction.code === 'INV-0001', 'activate Pro → first invoice INV-0001')
  ok((await req('GET', '/api/admin/transactions', { token: aTok })).json.total === 1, 'transaction ledger has exactly the real payment')

  // ── public ──
  const pubItin = await req('GET', `/api/public/itinerary/${pkg.json.code}`)
  ok(pubItin.status === 200 && pubItin.json.agency.name === 'Test Voyages', 'public itinerary by code')
  const pubLead = await req('POST', '/api/public/site/test-voyages/lead', { body: { name: 'Site Visitor', phone: '8887776665', destination: 'Goa' } })
  ok(pubLead.status === 201, 'public landing lead submission')
  ok((await req('GET', '/api/clients', { token: cTok })).json.total === 2, 'public lead landed in the agency CRM')

  // ── auth guards ──
  ok((await req('GET', '/api/clients')).status === 401, 'CRM route blocked without token')
  ok((await req('GET', '/api/admin/agencies')).status === 401, 'admin route blocked without token')

  console.log(`\n${fail === 0 ? 'OK' : 'FAIL'} ${pass} passed, ${fail} failed`)
} catch (err) {
  console.error('\n Test threw:', err)
  fail++
} finally {
  server.close()
  await mongoose.disconnect()
  await mongod.stop()
  process.exit(fail === 0 ? 0 : 1)
}
