import mongoose from 'mongoose'
import { baseModel } from './_plugins.js'

const { Schema } = mongoose

/** Traveler testimonial / gallery story. */
const storySchema = new Schema({
  client: String,
  rating: { type: Number, default: 5 },
  text: String,
  date: String,
  image: String,
  status: { type: String, enum: ['Pending', 'Published'], default: 'Pending' },
})

baseModel(storySchema)

export const Story = mongoose.model('Story', storySchema)
export default Story
