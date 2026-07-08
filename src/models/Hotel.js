import mongoose from 'mongoose'
import { baseModel } from './_plugins.js'

const { Schema } = mongoose

const hotelSchema = new Schema({
  name: { type: String, required: true },
  city: String,
  phone: String,
  email: String,
  rating: { type: Number, default: 3 },
  buyingPrice: Number,
  extraBedAdult: Number,
  extraBedChild: Number,
  childNoBed: Number,
  roomTypes: String,
  description: String,
  image: String,
})

baseModel(hotelSchema)

export const Hotel = mongoose.model('Hotel', hotelSchema)
export default Hotel
