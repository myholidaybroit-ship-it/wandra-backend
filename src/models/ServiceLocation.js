import mongoose from 'mongoose'
import { baseModel } from './_plugins.js'

const { Schema } = mongoose

const serviceLocationSchema = new Schema({
  name: { type: String, required: true },
  serviceType: String,
  durationMins: Number,
  cost: Number,
  sell: Number,
  city: String,
  description: String,
  image: String,
})

baseModel(serviceLocationSchema)

export const ServiceLocation = mongoose.model('ServiceLocation', serviceLocationSchema)
export default ServiceLocation
