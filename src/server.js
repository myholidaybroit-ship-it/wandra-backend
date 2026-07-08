import 'dotenv/config'
import { connectDB } from './config/db.js'
import { createApp } from './app.js'

const PORT = process.env.PORT || 4000

async function main() {
  await connectDB()
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
