import 'dotenv/config'
import { connectDB } from './config/db.js'
import { createApp } from './app.js'
import Plan from './models/Plan.js'

const PORT = process.env.PORT || 4000

async function main() {
  await connectDB()
  // One-time compatibility migration for installations created with the old
  // ₹3,999 monthly Pro catalog. Do not overwrite prices subsequently managed
  // by the admin; only migrate the exact legacy value.
  await Plan.updateMany(
    { key: 'Pro', price: 3999 },
    { $set: { price: 999, billingCycle: 'yearly', annualDiscountPercent: 0 } },
  )
  const app = createApp()
  app.listen(PORT, () => {
    console.log(`OK Wandra backend listening on http://localhost:${PORT}`)
    console.log(`  Admin API  → /api/admin`)
    console.log(`  CRM API    → /api`)
    console.log(`  Public API → /api/public`)
  })
}

main().catch((err) => {
  console.error('x Fatal startup error:', err)
  process.exit(1)
})
