import { asyncHandler } from '../../utils/asyncHandler.js'
import Agency from '../../models/Agency.js'
import Transaction from '../../models/Transaction.js'
import DemoRequest from '../../models/DemoRequest.js'
import { daysUntil } from '../../utils/date.js'

/** GET /api/admin/dashboard — platform-level KPIs for the admin home. */
export const stats = asyncHandler(async (req, res) => {
  const [agencies, transactions, demos] = await Promise.all([
    Agency.find(),
    Transaction.find(),
    DemoRequest.find(),
  ])

  const proAgencies = agencies.filter((a) => a.plan === 'Pro')
  const revenue = transactions.reduce((s, t) => s + (t.amount || 0), 0)
  const mrr = proAgencies.length * (transactions.find((t) => t.plan === 'Pro')?.originalPrice || 3999)

  const renewalsDue = proAgencies
    .filter((a) => a.billing?.renewalOn && daysUntil(a.billing.renewalOn) <= 14)
    .map((a) => ({ id: a.id, name: a.name, renewalOn: a.billing.renewalOn, days: daysUntil(a.billing.renewalOn), renewal: a.renewal }))
    .sort((x, y) => x.days - y.days)

  res.json({
    counts: {
      agencies: agencies.length,
      active: agencies.filter((a) => a.status === 'active').length,
      suspended: agencies.filter((a) => a.status === 'suspended').length,
      pro: proAgencies.length,
      free: agencies.filter((a) => a.plan === 'Free').length,
      demos: demos.length,
      demosPending: demos.filter((d) => d.status === 'pending').length,
    },
    revenue,
    mrr,
    renewalsDue,
    recentTransactions: transactions.sort((a, b) => b.createdAt - a.createdAt).slice(0, 8),
  })
})
