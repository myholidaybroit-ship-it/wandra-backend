import mongoose from 'mongoose'
import { baseModel } from './_plugins.js'

const { Schema } = mongoose

const quotationSchema = new Schema({
  package: { type: Schema.Types.ObjectId, ref: 'Package' },
  packageCode: String,
  client: String,
  travelDate: String,
  phone: String,
  email: String,
  status: { type: String, default: 'Draft' },           // Draft/Sent/Confirmed/Cancelled
  amount: { type: Number, default: 0 },
})

baseModel(quotationSchema)

export const Quotation = mongoose.model('Quotation', quotationSchema)
export default Quotation
