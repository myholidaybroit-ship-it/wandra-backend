import mongoose from 'mongoose'
import { baseModel } from './_plugins.js'

const { Schema } = mongoose

const fieldSchema = new Schema({ k: String, v: String }, { _id: false })

const voucherSchema = new Schema({
  code: { type: String, index: true },                  // VCH-####
  type: { type: String, enum: ['Hotel', 'Transport', 'Activity'], default: 'Hotel' },
  client: { type: Schema.Types.ObjectId, ref: 'Client' },
  clientName: String,
  package: { type: Schema.Types.ObjectId, ref: 'Package' },
  title: String,
  fields: { type: [fieldSchema], default: [] },
  notes: String,
})

baseModel(voucherSchema)

export const Voucher = mongoose.model('Voucher', voucherSchema)
export default Voucher
