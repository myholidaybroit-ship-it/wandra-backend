import mongoose from 'mongoose'
import { baseModel, jsonTransform } from './_plugins.js'

const { Schema } = mongoose

const itemSchema = new Schema({
  description: String,
  qty: { type: Number, default: 1 },
  rate: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },                    // percent
}, { _id: false })

const paymentSchema = new Schema({
  date: String,
  method: String,
  reference: String,
  amount: Number,
}, { _id: true })
jsonTransform(paymentSchema)

const invoiceSchema = new Schema({
  code: { type: String, index: true },                  // INV-YYYYMM-####
  client: { type: Schema.Types.ObjectId, ref: 'Client' },
  clientName: String,
  type: { type: String, default: 'Booking' },
  package: { type: Schema.Types.ObjectId, ref: 'Package' },
  booking: { type: Schema.Types.ObjectId, ref: 'Booking' },
  issueDate: String,
  dueDate: String,
  status: { type: String, default: 'Draft' },           // Draft/Unpaid/Partial/Paid/Cancelled
  gst: { type: Boolean, default: false },
  items: { type: [itemSchema], default: [] },
  payments: { type: [paymentSchema], default: [] },
})

baseModel(invoiceSchema)

export const Invoice = mongoose.model('Invoice', invoiceSchema)
export default Invoice
