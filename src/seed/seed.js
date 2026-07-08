/**
 * CLI entrypoint for seeding.
 *   npm run seed         → seeds only if the DB looks empty
 *   npm run seed:fresh   → wipes all Wandra collections, then reseeds
 */
import 'dotenv/config'
import mongoose from 'mongoose'
import { connectDB } from '../config/db.js'
import { runSeed } from './seedRunner.js'

const fresh = process.argv.includes('--fresh')

async function main() {
  await connectDB()
  const { seeded } = await runSeed({ fresh })
  if (seeded) {
    const email = process.env.SUPER_ADMIN_EMAIL || 'admin@wandra.travel'
    const pw = process.env.SUPER_ADMIN_PASSWORD || 'wandra@admin'
    console.log(`\n   Admin panel  →  ${email} / ${pw}`)
    console.log('   Then create your first agency in the admin panel; its owner logs into the CRM')
    console.log('   with the email you set and the password shown on the agency page.\n')
  }
  await mongoose.disconnect()
}

main().catch(async (err) => {
  console.error('x Seed failed:', err)
  await mongoose.disconnect()
  process.exit(1)
})
