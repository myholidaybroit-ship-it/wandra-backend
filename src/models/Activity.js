import mongoose from 'mongoose'
import { baseModel } from './_plugins.js'

const { Schema } = mongoose

const activitySchema = new Schema({
  name: { type: String, required: true },
  destination: String,
  category: String,
  durationMins: Number,
  cost: Number,
  sell: Number,
  city: String,
  description: String,
  image: String,
  gallery: { type: [String], default: [] },
})

baseModel(activitySchema)

export const Activity = mongoose.model('Activity', activitySchema)
export default Activity
