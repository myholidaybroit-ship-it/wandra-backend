import mongoose from 'mongoose'
import { baseModel } from './_plugins.js'

const { Schema } = mongoose

const activitySchema = new Schema({
  name: { type: String, required: true },
  category: String,
  durationMins: Number,
  cost: Number,
  sell: Number,
  city: String,
  description: String,
  image: String,
})

baseModel(activitySchema)

export const Activity = mongoose.model('Activity', activitySchema)
export default Activity
