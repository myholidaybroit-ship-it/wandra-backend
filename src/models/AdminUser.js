import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { jsonTransform } from './_plugins.js'

const { Schema } = mongoose

/**
 * Super-admin profile of the whole Wandra platform. The actual login
 * CREDENTIALS live in the server's .env (SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD)
 * — this doc only carries editable profile prefs (name, notifications). The
 * password hash is legacy/optional and not used for authentication anymore.
 */
const adminUserSchema = new Schema({
  name: { type: String, default: 'Wandra Admin' },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  role: { type: String, default: 'Super Admin' },
  passwordHash: { type: String, select: false },
  notifyNewAgency: { type: Boolean, default: true },
}, { timestamps: true })

adminUserSchema.methods.setPassword = async function setPassword(plain) {
  this.passwordHash = await bcrypt.hash(plain, 10)
}
adminUserSchema.methods.checkPassword = function checkPassword(plain) {
  return bcrypt.compare(plain, this.passwordHash)
}

jsonTransform(adminUserSchema)

export const AdminUser = mongoose.model('AdminUser', adminUserSchema)
export default AdminUser
