import mongoose from 'mongoose'
import { baseModel } from './_plugins.js'

const { Schema } = mongoose

/** Reusable day template that auto-fills a day in the package builder. Tenant-scoped. */
const itineraryTemplateSchema = new Schema({
  name: { type: String, required: true },
  mealPlan: String,
  activity: String,
  description: String,
})

baseModel(itineraryTemplateSchema)

export const ItineraryTemplate = mongoose.model('ItineraryTemplate', itineraryTemplateSchema)
export default ItineraryTemplate
