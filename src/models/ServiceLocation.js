import mongoose from 'mongoose'
import { baseModel } from './_plugins.js'

const { Schema } = mongoose

const serviceLocationSchema = new Schema({
  name: { type: String, required: true },
  destination: String,
  serviceType: String,
  durationMins: Number,
  cost: Number,
  sell: Number,
  city: String,
  description: String,
  image: String,
  gallery: { type: [String], default: [] },
})

baseModel(serviceLocationSchema)

export const ServiceLocation = mongoose.model('ServiceLocation', serviceLocationSchema)
export default ServiceLocation
