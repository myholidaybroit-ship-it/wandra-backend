import mongoose from 'mongoose'
import { baseModel, jsonTransform } from './_plugins.js'

const { Schema } = mongoose

const logSchema = new Schema({ text: String, at: String }, { _id: true })
jsonTransform(logSchema)

/**
 * Travel package / quote. Deeply nested builder payloads (itinerary, hotel
 * allocation, cabs, categories, pricing) are kept as Mixed to mirror the
 * frontend shapes exactly and stay flexible as the builder evolves.
 */
const packageSchema = new Schema({
  code: { type: String, index: true },                  // PKG-YYYYMM-####
  client: { type: Schema.Types.ObjectId, ref: 'Client' },
  clientName: String,
  clientPhone: String,
  clientEmail: String,
  clientAddress: String,

  destination: String,
  sectors: { type: [Schema.Types.Mixed], default: [] },
  fromLocation: String,
  route: String,
  days: Number,
  nights: Number,
  autoNights: Boolean,
  startDate: String,

  status: { type: String, default: 'Draft' },           // Draft/Quoted/Booked/Confirmed/Cancelled/Completed
  createdBy: String,
  fromTemplate: String,

  flightIncluded: { type: Boolean, default: false },
  flight: { type: Schema.Types.Mixed, default: {} },
  flights: { type: [Schema.Types.Mixed], default: [] },
  pax: { type: Schema.Types.Mixed, default: {} },
  cabs: { type: [Schema.Types.Mixed], default: [] },
  hotelsAlloc: { type: [Schema.Types.Mixed], default: [] },
  itinerary: { type: [Schema.Types.Mixed], default: [] },
  inclusions: { type: [String], default: [] },
  exclusions: { type: [String], default: [] },
  inclusionGroups: { type: [Schema.Types.Mixed], default: [] },
  categories: { type: [Schema.Types.Mixed], default: [] },
  pricing: { type: Schema.Types.Mixed, default: {} },
  customerRemarks: String,
  builderV2: { type: Schema.Types.Mixed, default: null },
  optionCount: Number,
  activeOption: Number,
  pdfCustom: { type: Schema.Types.Mixed, default: {} },

  paid: { type: Number, default: 0 },
  logs: { type: [logSchema], default: [] },
})

baseModel(packageSchema)

export const Package = mongoose.model('Package', packageSchema)
export default Package
