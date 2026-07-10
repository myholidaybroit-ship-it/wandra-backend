import mongoose from 'mongoose'
import { jsonTransform } from './_plugins.js'

const { Schema } = mongoose

/* Platform-owned settings. The support document is a singleton managed by the
   super-admin and is deliberately separate from each agency's profile. */
const platformSettingsSchema = new Schema({
  key: { type: String, unique: true, default: 'support' },
  companyName: { type: String, default: process.env.SUPPORT_COMPANY_NAME || 'Wandra', trim: true },
  email: { type: String, default: process.env.SUPPORT_EMAIL || '', trim: true },
  phone: { type: String, default: process.env.SUPPORT_PHONE || '', trim: true },
  whatsapp: { type: String, default: process.env.SUPPORT_WHATSAPP || '', trim: true },
  hours: { type: String, default: process.env.SUPPORT_HOURS || 'Mon-Sat, 10am-7pm IST', trim: true },
  description: { type: String, default: 'We are one message away.', trim: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'AdminUser' },
}, { timestamps: true })

jsonTransform(platformSettingsSchema)

export const PlatformSettings = mongoose.model('PlatformSettings', platformSettingsSchema)
export default PlatformSettings
