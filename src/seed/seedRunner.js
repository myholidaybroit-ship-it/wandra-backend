/**
 * Seed — populates ONLY the platform essentials so the SaaS starts clean:
 *   • the super-admin login (admin panel)
 *   • the two plans (Free / Pro) with their feature + limit maps and marketing copy
 *
 * No demo agencies, no fake clients/packages/transactions. Everything else is
 * created dynamically: the admin provisions agencies from the admin panel, and
 * each agency builds its own data in the CRM.
 *
 * Exposed as `runSeed({ fresh, quiet })`; assumes a live Mongoose connection.
 * `seed.js` is the CLI wrapper.
 */
import AdminUser from '../models/AdminUser.js'
import Plan from '../models/Plan.js'
import { PLAN_CATALOG } from '../config/planCatalog.js'

let QUIET = false
const log = (...a) => { if (!QUIET) console.log(...a) }

async function seedPlans() {
  for (const p of PLAN_CATALOG) {
    await Plan.findOneAndUpdate(
      { key: p.key },
      { $set: p, $unset: { priceYear: '', oldPrice: '' } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    )
  }
  log(`  ok plans (${PLAN_CATALOG.length})`)
}

async function seedSuperAdmin() {
  // Login credentials live in .env (SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD).
  // We only pre-create the profile doc (name / notify prefs); it's also
  // auto-created on first login if missing.
  const email = (process.env.SUPER_ADMIN_EMAIL || 'admin@wandra.travel').toLowerCase()
  await AdminUser.findOneAndUpdate(
    { email },
    { $setOnInsert: { email, name: 'Wandra Admin', role: 'Super Admin', notifyNewAgency: true } },
    { upsert: true },
  )
  log(`  ok super admin profile — ${email} (password comes from .env)`)
}

/**
 * Run the seed against an already-connected Mongoose instance.
 * `fresh: true` re-applies the platform config (idempotent upserts).
 */
export async function runSeed({ fresh = false, quiet = false } = {}) {
  QUIET = quiet

  const admins = await AdminUser.countDocuments()
  const plans = await Plan.countDocuments()
  if (admins > 0 && plans > 0 && !fresh) {
    log('\n! Platform already initialised (super admin + plans exist). Use --fresh to re-apply config.\n')
    return { seeded: false }
  }

  log('\n Seeding Wandra platform essentials…')
  await seedPlans()
  await seedSuperAdmin()
  log('\nOK Platform ready. Create your first agency from the admin panel.')
  return { seeded: true }
}

export default runSeed
