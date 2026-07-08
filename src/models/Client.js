import mongoose from 'mongoose'
import { baseModel, jsonTransform } from './_plugins.js'

const { Schema } = mongoose

const docSchema = new Schema({
  name: String,
  category: String,
  kind: String,
  fileName: String,
  size: Number,
  mime: String,
  url: String,
  uploadedAt: String,
}, { _id: true })
jsonTransform(docSchema)  // expose `id` so the UI can remove a document

/** Lead / client record. `query` holds the enquiry + assignment info. */
const clientSchema = new Schema({
  code: { type: String, index: true },                  // CLI-YYYYMM-###
  name: { type: String, required: true },
  email: String,
  phone: String,
  address: String,
  city: String,
  state: String,
  country: { type: String, default: 'India' },
  tripStatus: { type: String, default: 'New Query' },   // New Query → In Progress → Converted → On Trip
  note: String,
  interest: String,
  budget: Number,
  source: String,
  tags: { type: [String], default: [] },
  query: {
    type: new Schema({
      assignee: String,
      assignedVia: String,
      refId: String,
      startDate: String,
      nights: Number,
      days: Number,
      adults: Number,
      children: Number,
      fromCity: String,
      comments: String,
    }, { _id: false }),
    default: () => ({}),
  },
  docs: { type: [docSchema], default: [] },
})

baseModel(clientSchema)

export const Client = mongoose.model('Client', clientSchema)
export default Client
