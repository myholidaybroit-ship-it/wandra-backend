/** Billing date helpers — mirror wandra-admin/src/utils/billing.js. */

export const todayISO = () => new Date().toISOString().slice(0, 10)

export function addMonths(iso, n) {
  const d = new Date(iso + 'T00:00:00')
  d.setMonth(d.getMonth() + n)
  return d.toISOString().slice(0, 10)
}

export function monthLabel(iso) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleString('en-US', { month: 'short', year: 'numeric' })
}

export function daysUntil(iso) {
  if (!iso) return 0
  const d = new Date(iso + 'T00:00:00')
  const now = new Date(todayISO() + 'T00:00:00')
  return Math.round((d - now) / 86400000)
}
