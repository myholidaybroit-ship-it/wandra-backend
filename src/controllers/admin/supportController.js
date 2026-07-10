import { asyncHandler } from '../../utils/asyncHandler.js'
import { ApiError } from '../../utils/ApiError.js'
import SupportInquiry from '../../models/SupportInquiry.js'
import { editableFields, getOrCreateSupportSettings } from '../supportSettings.js'

export const getSettings = asyncHandler(async (_req, res) => {
  res.json((await getOrCreateSupportSettings()).toJSON())
})

export const updateSettings = asyncHandler(async (req, res) => {
  const settings = await getOrCreateSupportSettings()
  for (const field of editableFields) {
    if (req.body[field] !== undefined) settings[field] = String(req.body[field] || '').trim()
  }
  settings.updatedBy = req.admin._id
  await settings.save()
  res.json(settings.toJSON())
})

export const listInquiries = asyncHandler(async (req, res) => {
  const query = req.query.status ? { status: req.query.status } : {}
  const items = await SupportInquiry.find(query)
    .populate('agency', 'name code email phone')
    .populate('submittedBy', 'name email')
    .sort('-createdAt')
  res.json({ items: items.map((item) => item.toJSON()), total: items.length })
})

export const updateInquiry = asyncHandler(async (req, res) => {
  const allowed = ['status', 'priority', 'adminNote']
  const patch = Object.fromEntries(allowed.filter((key) => req.body[key] !== undefined).map((key) => [key, req.body[key]]))
  const inquiry = await SupportInquiry.findByIdAndUpdate(req.params.id, patch, { new: true, runValidators: true })
    .populate('agency', 'name code email phone')
    .populate('submittedBy', 'name email')
  if (!inquiry) throw ApiError.notFound('Support inquiry not found')
  res.json(inquiry.toJSON())
})
