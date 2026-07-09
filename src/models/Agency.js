import mongoose from 'mongoose'
import { jsonTransform } from './_plugins.js'

const { Schema } = mongoose

/**
 * Agency = a tenant. This single document is the source of truth for BOTH:
 *  - the admin panel's agency-management fields (plan, features, limits, usage,
 *    billing, renewal, status, code, owner login), AND
 *  - the CRM's own "agency profile" branding (legalName, logo, bank, gstin…).
 */
const bankSchema = new Schema({
  accountName: String,
  bankName: String,
  accountNumber: String,
  ifsc: String,
}, { _id: false })

const agencySchema = new Schema({
  code: { type: String, unique: true, index: true },      // AGY-0001
  name: { type: String, required: true },
  legalName: String,
  owner: String,                                          // owner's display name
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: String,
  city: String,

  // ── CRM brand profile (client-facing) ──
  logo: { type: String, default: '' },   // empty until the agency uploads their own — never the Wandra logo
  website: String,
  address: String,
  gstin: String,
  currency: { type: String, default: 'INR' },
  bank: { type: bankSchema, default: () => ({}) },

  // ── lead capture config (agency-customisable) ──
  leadSources: {
    type: [String],
    default: () => ['Website', 'Landing Page', 'Ad Form', 'Referral', 'WhatsApp', 'Walk-in', 'B2B Agent', 'Instagram'],
  },

  // ── Plan / entitlements (admin-controlled) ──
  plan: { type: String, enum: ['Free', 'Pro'], default: 'Free', index: true },
  status: { type: String, enum: ['active', 'suspended'], default: 'active', index: true },
  // stored as plain objects (not Maps) because feature keys contain dots
  // (e.g. "dashboard.view"), which Mongoose Maps disallow.
  features: { type: Schema.Types.Mixed, default: {} },    // per-agency feature overrides
  limits: { type: Schema.Types.Mixed, default: {} },      // numeric usage limits (-1 = unlimited)
  usage: {
    clients: { type: Number, default: 0 },
    packages: { type: Number, default: 0 },
    team: { type: Number, default: 1 },
    storage: { type: Number, default: 0 },
  },

  // admin-managed owner login password (kept in sync with the owner User hash)
  password: { type: String, select: false },

  // ── Billing / renewals ──
  billing: {
    type: new Schema({ since: String, renewalOn: String }, { _id: false }),
    default: null,
  },
  renewal: {
    type: new Schema({
      status: { type: String, enum: ['none', 'requested', 'accepted', 'declined'], default: 'none' },
      requestedOn: String,
      respondedOn: String,
    }, { _id: false }),
    default: () => ({ status: 'none' }),
  },
}, { timestamps: true })

jsonTransform(agencySchema)

export const Agency = mongoose.model('Agency', agencySchema)
export default Agency
