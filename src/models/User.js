import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { baseModel } from './_plugins.js'

const { Schema } = mongoose

/** Agency staff account (the CRM login). Tenant-scoped. */
const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  role: { type: String, default: 'Sales' },              // matches a Role.name
  phone: String,
  department: String,
  designation: String,                                   // 'Owner' | 'Sales Executive' | …
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  passwordHash: { type: String, select: false },
})

userSchema.methods.setPassword = async function setPassword(plain) {
  this.passwordHash = await bcrypt.hash(plain, 10)
}
userSchema.methods.checkPassword = function checkPassword(plain) {
  if (!this.passwordHash) return Promise.resolve(false)
  return bcrypt.compare(plain, this.passwordHash)
}

baseModel(userSchema)
userSchema.index({ agency: 1, email: 1 }, { unique: true })

export const User = mongoose.model('User', userSchema)
export default User
