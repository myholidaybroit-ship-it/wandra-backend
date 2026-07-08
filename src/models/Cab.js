import mongoose from 'mongoose'
import { baseModel } from './_plugins.js'

const { Schema } = mongoose

const cabSchema = new Schema({
  name: { type: String, required: true },
  type: String,                                         // Sedan / SUV / Tempo Traveller …
  acType: { type: String, default: 'AC' },
  capacity: Number,
  ratePerKm: Number,
  ratePerDay: Number,
  image: String,
  contact: String,
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
})

baseModel(cabSchema)

export const Cab = mongoose.model('Cab', cabSchema)
export default Cab
