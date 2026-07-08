import mongoose from 'mongoose'
import { baseModel } from './_plugins.js'

const { Schema } = mongoose

/** Feature role — which modules a role can use. Admin is a `system` role. */
const roleSchema = new Schema({
  name: { type: String, required: true },
  system: { type: Boolean, default: false },
  perms: { type: Map, of: Boolean, default: {} },        // dashboard/clients/builder/… + viewPricing
})

baseModel(roleSchema)
roleSchema.index({ agency: 1, name: 1 }, { unique: true })

export const Role = mongoose.model('Role', roleSchema)
export default Role
