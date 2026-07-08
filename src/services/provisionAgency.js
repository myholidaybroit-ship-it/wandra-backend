import Role from '../models/Role.js'
import User from '../models/User.js'
import AssignmentConfig from '../models/AssignmentConfig.js'
import Landing from '../models/Landing.js'
import InclusionPreset from '../models/InclusionPreset.js'
import { ROLES_DEFAULT, ASSIGNMENT_DEFAULT, landingDefault } from '../config/crmDefaults.js'

/**
 * Provision baseline CRM data for a freshly-created tenant:
 * default roles, an owner staff account (for CRM login), an assignment config,
 * a landing-page config and an empty inclusion-preset doc.
 * Idempotent-ish: skips pieces that already exist.
 */
export async function provisionAgency(agency, ownerPassword, ownerInfo = {}) {
  const agencyId = agency._id
  const ownerEmail = (ownerInfo.email || agency.email).toLowerCase()
  const ownerName = ownerInfo.name || agency.owner || `${agency.name} Admin`

  // roles
  const existingRoles = await Role.countDocuments({ agency: agencyId })
  if (!existingRoles) {
    await Role.insertMany(ROLES_DEFAULT.map((r) => ({ ...r, agency: agencyId })))
  }

  // owner user (CRM login)
  let owner = await User.findOne({ agency: agencyId, email: ownerEmail })
  if (!owner) {
    owner = new User({
      agency: agencyId,
      name: ownerName,
      email: ownerEmail,
      role: 'Admin',
      phone: agency.phone,
      department: 'Management',
      designation: 'Owner',
      status: 'Active',
    })
    if (ownerPassword) await owner.setPassword(ownerPassword)
    await owner.save()
  }

  // assignment config
  await AssignmentConfig.updateOne(
    { agency: agencyId },
    { $setOnInsert: { agency: agencyId, ...ASSIGNMENT_DEFAULT } },
    { upsert: true },
  )

  // landing page
  await Landing.updateOne(
    { agency: agencyId },
    { $setOnInsert: { agency: agencyId, ...landingDefault(agency.name, agency.logo) } },
    { upsert: true },
  )

  // inclusion presets (starts empty)
  await InclusionPreset.updateOne(
    { agency: agencyId },
    { $setOnInsert: { agency: agencyId, byDest: {} } },
    { upsert: true },
  )

  return owner
}

export default provisionAgency
