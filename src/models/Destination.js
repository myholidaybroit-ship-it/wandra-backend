import mongoose from 'mongoose'
import { baseModel } from './_plugins.js'

const { Schema } = mongoose

const destinationSchema = new Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['Domestic', 'International'], default: 'Domestic' },
  location: String,
  features: String,
  image: String,
  gallery: { type: [String], default: [] },
})

baseModel(destinationSchema)

export const Destination = mongoose.model('Destination', destinationSchema)
export default Destination
