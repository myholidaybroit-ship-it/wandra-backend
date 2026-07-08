/**
 * Dev convenience: boot the full backend against a throwaway in-memory MongoDB,
 * seed it, and keep listening — so the frontends can be exercised end-to-end
 * without a real Atlas URI. NOT for production. Run: node src/seed/devWithMemory.mjs
 */
import 'dotenv/config'   // load .env (S3 creds, admin creds) — MONGODB_URI is overridden below
import { MongoMemoryServer } from 'mongodb-memory-server'
import { connectDB } from '../config/db.js'
import { createApp } from '../app.js'
import { runSeed } from './seedRunner.js'

const mongod = await MongoMemoryServer.create()
process.env.MONGODB_URI = mongod.getUri('wandra')  // in-memory DB, not the real Atlas
process.env.JWT_SECRET = process.env.JWT_SECRET || 'dev-memory-secret'
process.env.SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'admin@wandra.travel'
process.env.SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'wandra@admin'

await connectDB()
await runSeed({ fresh: true })

const PORT = process.env.PORT || 4000
createApp().listen(PORT, () => {
  console.log(`\nOK In-memory backend listening on http://localhost:${PORT}`)
  console.log(`  Admin (.env): ${process.env.SUPER_ADMIN_EMAIL} / ${process.env.SUPER_ADMIN_PASSWORD}`)
  console.log('  Create an agency in the admin panel, then log into the CRM as its owner.')
})

process.on('SIGINT', async () => { await mongod.stop(); process.exit(0) })
process.on('SIGTERM', async () => { await mongod.stop(); process.exit(0) })
