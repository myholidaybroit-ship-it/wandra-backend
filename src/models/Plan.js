import mongoose from 'mongoose'
import { jsonTransform } from './_plugins.js'

const { Schema } = mongoose

/** Platform plan (Free / Pro) with editable feature + limit maps. */
const planSchema = new Schema({
  key: { type: String, required: true, unique: true },   // 'Free' | 'Pro'
  name: String,
  price: { type: Number, default: 0 },
  period: String,
  tagline: String,
  color: String,
  featured: { type: Boolean, default: false },
  // marketing fields shown on the CRM billing / upgrade pages
  perks: { type: [String], default: [] },
  plus: String,
  limit: { type: Number, default: 0 },   // client limit for the marketing card (-1 = unlimited)
  // plain objects — feature keys contain dots, which Mongoose Maps disallow
  features: { type: Schema.Types.Mixed, default: {} },
  limits: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true })

// The admin frontend keys plans by 'Free' / 'Pro', so expose `id = key`
// (not the ObjectId). This makes plans.find(p => p.id === 'Pro') work and keeps
// plan URLs (/api/admin/plans/:key) aligned with the returned id.
planSchema.set('toJSON', {
  virtuals: false,
  versionKey: false,
  transform(doc, ret) {
    ret.id = ret.key
    delete ret._id
    return ret
  },
})

export const Plan = mongoose.model('Plan', planSchema)
export default Plan
