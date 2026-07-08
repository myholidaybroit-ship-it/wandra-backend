import mongoose from 'mongoose'
import { baseModel, jsonTransform } from './_plugins.js'

const { Schema } = mongoose

const paymentSchema = new Schema({
  date: String,
  method: String,
  reference: String,
  amount: Number,
}, { _id: true })
jsonTransform(paymentSchema)

const bookingSchema = new Schema({
  code: { type: String, index: true },                  // BKG-YYYYMM-####
  package: { type: Schema.Types.ObjectId, ref: 'Package' },
  invoice: { type: Schema.Types.ObjectId, ref: 'Invoice' },
  clientName: String,
  travelDate: String,
  status: { type: String, default: 'Active' },          // Active/Confirmed/Cancelled/Completed
  value: { type: Number, default: 0 },
  paid: { type: Number, default: 0 },
  payments: { type: [paymentSchema], default: [] },
})

baseModel(bookingSchema)

export const Booking = mongoose.model('Booking', bookingSchema)
export default Booking
