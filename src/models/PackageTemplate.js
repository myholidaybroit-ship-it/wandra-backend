import mongoose from 'mongoose'
import { baseModel } from './_plugins.js'

const { Schema } = mongoose

/** Reusable proven itinerary — cloning one pre-fills a whole package. */
const packageTemplateSchema = new Schema({
  name: { type: String, required: true },
  destination: String,
  tag: String,
  nights: Number,
  days: Number,
  summary: String,
  highlights: { type: [String], default: [] },
  priceFrom: Number,
  usedCount: { type: Number, default: 0 },
  hotelsAlloc: { type: [Schema.Types.Mixed], default: [] },
  cabs: { type: [Schema.Types.Mixed], default: [] },
  categories: { type: [Schema.Types.Mixed], default: [] },
  pricing: { type: Schema.Types.Mixed, default: {} },
  itinerary: { type: [Schema.Types.Mixed], default: [] },
})

baseModel(packageTemplateSchema)

export const PackageTemplate = mongoose.model('PackageTemplate', packageTemplateSchema)
export default PackageTemplate
