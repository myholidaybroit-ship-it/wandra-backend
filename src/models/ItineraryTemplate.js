import mongoose from 'mongoose'
import { baseModel } from './_plugins.js'

const { Schema } = mongoose

/** Reusable day template that auto-fills a day in the package builder. Tenant-scoped.
 *  `services` mirrors the builder's service shape (transport + activities) so a
 *  saved day can be attached to a package day and fetched straight in. */
const itineraryTemplateSchema = new Schema({
  name: { type: String, required: true },
  destination: String,
  mealPlan: String,
  activity: String,          // legacy free-text summary, kept for old templates
  description: String,
  services: { type: [Schema.Types.Mixed], default: [] },
})

baseModel(itineraryTemplateSchema)

export const ItineraryTemplate = mongoose.model('ItineraryTemplate', itineraryTemplateSchema)
export default ItineraryTemplate
