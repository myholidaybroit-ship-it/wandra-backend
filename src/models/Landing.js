import mongoose from 'mongoose'
import { baseModel } from './_plugins.js'

const { Schema } = mongoose

/** One lead-capture landing-page config per agency (fully editable in the builder). */
const landingSchema = new Schema({
  slug: { type: String, index: true },
  published: { type: Boolean, default: true },
  accent: { type: String, default: '#111113' },
  order: { type: [String], default: ['hero', 'about', 'form'] },
  header: { type: Schema.Types.Mixed, default: {} },
  hero: { type: Schema.Types.Mixed, default: {} },
  about: { type: Schema.Types.Mixed, default: {} },
  form: { type: Schema.Types.Mixed, default: {} },
})

baseModel(landingSchema, { unique: true })

export const Landing = mongoose.model('Landing', landingSchema)
export default Landing
