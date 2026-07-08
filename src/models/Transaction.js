import mongoose from 'mongoose'
import { jsonTransform } from './_plugins.js'

const { Schema } = mongoose

/** Billing ledger — one row per Pro activation or renewal payment. */
const transactionSchema = new Schema({
  code: { type: String, index: true },                  // INV-0001
  agency: { type: Schema.Types.ObjectId, ref: 'Agency', index: true },
  agencyName: String,
  plan: { type: String, default: 'Pro' },
  type: { type: String, enum: ['subscription', 'renewal'], default: 'subscription' },
  method: String,                                       // Razorpay / UPI / Bank Transfer …
  originalPrice: Number,
  discountPercent: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  amount: Number,
  status: { type: String, default: 'paid' },
  reference: String,
  proof: String,                                        // data-URL / link to uploaded proof
  proofKind: String,
  note: String,
  period: String,                                       // 'Jun 2026'
}, { timestamps: true })

jsonTransform(transactionSchema)

export const Transaction = mongoose.model('Transaction', transactionSchema)
export default Transaction
