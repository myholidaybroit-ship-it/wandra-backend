import mongoose from 'mongoose'
import { baseModel } from './_plugins.js'

const { Schema } = mongoose

const fieldSchema = new Schema({ k: String, v: String }, { _id: false })

// one segment of a unified Travel Pass (a hotel stay, a transfer, an activity)
const sectionSchema = new Schema({
  tag: { type: String, enum: ['Hotel', 'Transport', 'Activity'], default: 'Hotel' },
  title: String,
  fields: { type: [fieldSchema], default: [] },
}, { _id: false })

const voucherSchema = new Schema({
  code: { type: String, index: true },                  // VCH-####
  // 'Pass' = ONE unified travel pass for the whole trip (hotels + transport +
  // activities as sections). The single types remain for ad-hoc vouchers.
  type: { type: String, enum: ['Pass', 'Hotel', 'Transport', 'Activity'], default: 'Hotel' },
  client: { type: Schema.Types.ObjectId, ref: 'Client' },
  clientName: String,
  package: { type: Schema.Types.ObjectId, ref: 'Package' },
  title: String,
  fields: { type: [fieldSchema], default: [] },
  sections: { type: [sectionSchema], default: [] },     // only used by type 'Pass'
  notes: String,
})

baseModel(voucherSchema)

export const Voucher = mongoose.model('Voucher', voucherSchema)
export default Voucher
