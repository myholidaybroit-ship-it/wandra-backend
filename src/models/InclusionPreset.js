import mongoose from 'mongoose'
import { baseModel } from './_plugins.js'

const { Schema } = mongoose

/**
 * Per-agency inclusion/exclusion presets, one independent list per destination.
 * `byDest` = { [destinationName]: { inclusions: [], exclusions: [] } }.
 * Stored as one doc per agency for simple whole-map reads/writes.
 */
const inclusionPresetSchema = new Schema({
  byDest: { type: Schema.Types.Mixed, default: {} },
})

baseModel(inclusionPresetSchema, { unique: true })

export const InclusionPreset = mongoose.model('InclusionPreset', inclusionPresetSchema)
export default InclusionPreset
