import mongoose from 'mongoose'
import { jsonTransform } from './_plugins.js'

const { Schema } = mongoose

const supportInquirySchema = new Schema({
  agency: { type: Schema.Types.ObjectId, ref: 'Agency', required: true, index: true },
  submittedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  subject: { type: String, required: true, trim: true, maxlength: 160 },
  category: {
    type: String,
    enum: ['Technical issue', 'How-to question', 'Billing', 'Account access', 'Feature request', 'Roles & team', 'Other'],
    default: 'Technical issue',
  },
  message: { type: String, required: true, trim: true, maxlength: 5000 },
  contactEmail: { type: String, trim: true },
  contactPhone: { type: String, trim: true },
  status: { type: String, enum: ['new', 'in_progress', 'resolved'], default: 'new', index: true },
  priority: { type: String, enum: ['normal', 'high'], default: 'normal' },
  adminNote: { type: String, trim: true, maxlength: 2000 },
}, { timestamps: true })

jsonTransform(supportInquirySchema)

supportInquirySchema.index({ createdAt: -1 })

export const SupportInquiry = mongoose.model('SupportInquiry', supportInquirySchema)
export default SupportInquiry
