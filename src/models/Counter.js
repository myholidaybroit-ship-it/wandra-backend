import mongoose from 'mongoose'

/**
 * Atomic sequence counters. Scoped by (agency, key) so each tenant has its own
 * numbering, plus global counters (agency=null) for admin invoices / agency codes.
 */
const counterSchema = new mongoose.Schema({
  agency: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency', default: null, index: true },
  key: { type: String, required: true },
  seq: { type: Number, default: 0 },
})
counterSchema.index({ agency: 1, key: 1 }, { unique: true })

export const Counter = mongoose.model('Counter', counterSchema)

/** Return the next integer in a sequence, atomically. */
export async function nextSeq(key, agency = null, start = 1) {
  const doc = await Counter.findOneAndUpdate(
    { agency, key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  )
  // if a starting offset is requested and this is the first hit, respect it
  if (doc.seq < start) {
    doc.seq = start
    await doc.save()
  }
  return doc.seq
}

export default Counter
