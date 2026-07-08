import mongoose from 'mongoose'
import { baseModel, jsonTransform } from './_plugins.js'

const { Schema } = mongoose

const ruleSchema = new Schema({
  name: { type: String, default: 'New rule' },
  enabled: { type: Boolean, default: true },
  field: { type: String, enum: ['destination', 'source', 'city'], default: 'destination' },
  values: { type: [String], default: [] },
  members: { type: [String], default: [] },              // user display names
  next: { type: Number, default: 0 },                    // round-robin pointer
}, { _id: true })
jsonTransform(ruleSchema)  // expose `id` (not `_id`) so the UI can address rules

/** One lead-assignment config per agency (conditional rules + round-robin fallback). */
const assignmentSchema = new Schema({
  enabled: { type: Boolean, default: true },
  rules: { type: [ruleSchema], default: [] },
  fallback: {
    type: new Schema({
      mode: { type: String, enum: ['all', 'members', 'unassigned'], default: 'all' },
      members: { type: [String], default: [] },
      next: { type: Number, default: 0 },
    }, { _id: false }),
    default: () => ({ mode: 'all', members: [], next: 0 }),
  },
})

baseModel(assignmentSchema, { unique: true })

export const AssignmentConfig = mongoose.model('AssignmentConfig', assignmentSchema)
export default AssignmentConfig
