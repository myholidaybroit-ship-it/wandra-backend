import { computePricing } from './pricing.js'

/**
 * Compute the CRM dashboard's KPIs, sparkline series, rich analytics and recent
 * activity entirely from a tenant's real records. No demo/seed constants — a new
 * agency sees honest zeros that grow as it uses the product.
 */

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const k = (n) => Math.round((Number(n) || 0) / 1000)           // ₹ → ₹ thousands (chart unit)

/** A Date from an ISO/loose date string, or null. */
function d(v) {
  if (!v) return null
  const dt = new Date(typeof v === 'string' && v.length === 10 ? v + 'T00:00:00' : v)
  return isNaN(dt) ? null : dt
}

function invoiceTotals(inv) {
  const total = (inv.items || []).reduce((s, it) => s + (it.qty || 0) * (it.rate || 0) * (1 + (it.tax || 0) / 100), 0)
  const paid = (inv.payments || []).reduce((s, p) => s + Number(p.amount || 0), 0)
  return { total, paid }
}

export function computeDashboard({ clients, packages, bookings, invoices, stories }, now = new Date()) {
  const activeBookings = bookings.filter((b) => b.status !== 'Cancelled')

  // ── KPIs ──
  const revenue = activeBookings.reduce((s, b) => s + (b.value || 0), 0)
  const collected = activeBookings.reduce((s, b) => s + (b.paid || 0), 0)
  const grossProfit = packages.reduce((s, p) => s + (computePricing(p.toObject ? p.toObject() : p).profit || 0), 0)
  const outstanding = invoices
    .filter((i) => ['Unpaid', 'Partial', 'Draft'].includes(i.status))
    .reduce((s, i) => { const { total, paid } = invoiceTotals(i); return s + Math.max(0, total - paid) }, 0)

  const kpis = {
    clients: clients.length,
    packages: packages.length,
    bookings: activeBookings.length,
    revenue, collected, grossProfit, outstanding,
  }

  // ── last-12-months buckets ──
  const months = []
  const monthKeys = []
  for (let i = 11; i >= 0; i--) {
    const dt = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(MON[dt.getMonth()])
    monthKeys.push(`${dt.getFullYear()}-${dt.getMonth()}`)
  }
  const idxOf = (dt) => (dt ? monthKeys.indexOf(`${dt.getFullYear()}-${dt.getMonth()}`) : -1)

  const grossByMonth = Array(12).fill(0)
  const collectedByMonth = Array(12).fill(0)
  const bookingsByMonth = Array(12).fill(0)
  const profitByMonth = Array(12).fill(0)

  for (const b of activeBookings) {
    const i = idxOf(d(b.travelDate) || d(b.createdAt))
    if (i >= 0) { grossByMonth[i] += k(b.value); collectedByMonth[i] += k(b.paid); bookingsByMonth[i] += 1 }
  }
  for (const p of packages) {
    const i = idxOf(d(p.startDate) || d(p.createdAt))
    if (i >= 0) profitByMonth[i] += k(computePricing(p.toObject ? p.toObject() : p).profit)
  }
  const marginPctByMonth = grossByMonth.map((g, i) => (g > 0 ? Math.round((profitByMonth[i] / g) * 100) : 0))
  const monthlyTarget = Math.max(1, Math.round((grossByMonth.reduce((s, n) => s + n, 0) / 12) * 1.25)) || 1

  // ── weekly inquiries (last 7 days) ──
  const weeklyInquiries = Array(7).fill(0)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  for (const c of clients) {
    const dt = d(c.createdAt)
    if (!dt) continue
    const days = Math.floor((today - new Date(dt.getFullYear(), dt.getMonth(), dt.getDate())) / 86400000)
    if (days >= 0 && days < 7) weeklyInquiries[6 - days] += 1
  }

  // ── categorical breakdowns ──
  const groupCount = (items, keyFn) => {
    const m = new Map()
    for (const it of items) { const key = keyFn(it); if (!key) continue; m.set(key, (m.get(key) || 0) + 1) }
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }

  const leadSources = groupCount(clients, (c) => c.source).map(([label, value]) => ({ label, value })).slice(0, 6)
  const clientCities = groupCount(clients, (c) => c.city).map(([label, value]) => ({ label, value })).slice(0, 6)
  const packageStatusMix = groupCount(packages, (p) => p.status).map(([label, value]) => ({ label, value }))
  const topDestinations = groupCount(packages, (p) => (p.destination || '').split(' - ')[0]).map(([label, value]) => ({ label, value })).slice(0, 6)

  // lead funnel
  const paidInvoices = invoices.filter((i) => i.status === 'Paid').length
  const leadFunnel = [
    { stage: 'Leads captured', value: clients.length },
    { stage: 'Qualified', value: clients.filter((c) => c.tripStatus && c.tripStatus !== 'New Query').length },
    { stage: 'Quoted', value: packages.filter((p) => ['Quoted', 'Booked', 'Confirmed', 'Completed'].includes(p.status)).length },
    { stage: 'Booked', value: activeBookings.length },
    { stage: 'Paid in full', value: paidInvoices },
  ]

  // invoice aging (days since issue, for unpaid/partial)
  const agingBuckets = [
    { label: '0–15 days', value: 0 }, { label: '16–30 days', value: 0 },
    { label: '31–60 days', value: 0 }, { label: '60+ days', value: 0 },
  ]
  for (const i of invoices) {
    if (!['Unpaid', 'Partial', 'Draft'].includes(i.status)) continue
    const issued = d(i.issueDate) || d(i.createdAt)
    if (!issued) continue
    const age = Math.floor((today - issued) / 86400000)
    const b = age <= 15 ? 0 : age <= 30 ? 1 : age <= 60 ? 2 : 3
    agingBuckets[b].value += 1
  }

  // rating from stories
  const published = stories.filter((s) => s.status === 'Published')
  const ratingCount = published.length
  const ratingAvg = ratingCount ? Number((published.reduce((s, x) => s + (x.rating || 0), 0) / ratingCount).toFixed(1)) : 0
  const ratingDist = [5, 4, 3, 2, 1].map((stars) => ({ stars, value: published.filter((s) => s.rating === stars).length }))

  // inquiry heatmap (weekday × last 8 weeks)
  const heatDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const heatWeeks = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8']
  const inquiryHeatmap = Array.from({ length: 7 }, () => Array(8).fill(0))
  for (const c of clients) {
    const dt = d(c.createdAt); if (!dt) continue
    const days = Math.floor((today - new Date(dt.getFullYear(), dt.getMonth(), dt.getDate())) / 86400000)
    if (days < 0 || days >= 56) continue
    const week = 7 - Math.floor(days / 7)                 // W1 oldest → W8 newest
    const dow = (dt.getDay() + 6) % 7                     // Mon=0
    if (week >= 0 && week < 8) inquiryHeatmap[dow][week] += 1
  }

  const analytics = {
    months, grossByMonth, collectedByMonth, bookingsByMonth, profitByMonth, marginPctByMonth,
    monthlyTarget, weeklyInquiries, weekDays: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
    leadFunnel, leadSources, packageStatusMix, topDestinations, clientCities, invoiceAging: agingBuckets,
    ratingAvg, ratingCount, ratingDist, heatDays, heatWeeks, inquiryHeatmap,
  }

  // ── sparkline series (cumulative over the 12 buckets, last 10 points) ──
  const cumulative = (perMonth) => { let run = 0; return perMonth.map((n) => (run += n)).slice(-10) }
  const clientsByMonth = Array(12).fill(0)
  const packagesByMonth = Array(12).fill(0)
  for (const c of clients) { const i = idxOf(d(c.createdAt)); if (i >= 0) clientsByMonth[i] += 1 }
  for (const p of packages) { const i = idxOf(d(p.createdAt)); if (i >= 0) packagesByMonth[i] += 1 }
  const series = {
    revenue: cumulative(grossByMonth),
    bookings: cumulative(bookingsByMonth),
    packages: cumulative(packagesByMonth),
    clients: cumulative(clientsByMonth),
  }

  // ── recent activity (real events, newest first) ──
  const events = []
  for (const b of activeBookings) {
    for (const p of b.payments || []) events.push({ ts: d(p.date) || d(b.createdAt), text: `Payment received ₹${Number(p.amount || 0).toLocaleString('en-IN')}`, sub: `${b.clientName} · Booking ${b.code}` })
    events.push({ ts: d(b.createdAt) || d(b.travelDate), text: `New booking ${b.code}`, sub: `${b.clientName}` })
  }
  for (const c of clients) events.push({ ts: d(c.createdAt), text: `New lead${c.source ? ` from ${c.source}` : ''}`, sub: `${c.name}${c.interest ? ` · ${c.interest}` : ''}` })
  for (const s of published) events.push({ ts: d(s.createdAt), text: 'Testimonial published', sub: `${s.client} · ${s.rating}★ review` })
  const recentActivity = events
    .filter((e) => e.ts)
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 8)
    .map((e, i) => ({ id: `a${i}`, text: e.text, sub: e.sub, date: `${MON[e.ts.getMonth()]} ${e.ts.getDate()}` }))

  return { kpis, series, recentActivity, analytics }
}

export default computeDashboard
