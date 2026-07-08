import mongoose from 'mongoose'
import { jsonTransform } from './_plugins.js'

const { Schema } = mongoose

/** Manual demo log — prospects booked via Calendly, tracked to conversion. */
const demoRequestSchema = new Schema({
  name: String,
  agencyName: String,
  phone: String,
  email: String,
  slot: String,                                         // '2026-07-09 15:00'
  status: { type: String, enum: ['pending', 'interested', 'not', 'converted'], default: 'pending' },
  note: String,
}, { timestamps: true })

jsonTransform(demoRequestSchema)

export const DemoRequest = mongoose.model('DemoRequest', demoRequestSchema)
export default DemoRequest
