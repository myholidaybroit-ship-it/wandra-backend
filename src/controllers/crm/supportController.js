import { asyncHandler } from '../../utils/asyncHandler.js'
import { ApiError } from '../../utils/ApiError.js'
import SupportInquiry from '../../models/SupportInquiry.js'
import { getOrCreateSupportSettings } from '../supportSettings.js'

export const getSettings = asyncHandler(async (_req, res) => {
  const settings = await getOrCreateSupportSettings()
  res.json({
    companyName: settings.companyName,
    email: settings.email,
    phone: settings.phone,
    whatsapp: settings.whatsapp,
    hours: settings.hours,
    description: settings.description,
  })
})

export const createInquiry = asyncHandler(async (req, res) => {
  const { subject, category, message, contactEmail, contactPhone, priority } = req.body
  if (!subject?.trim() || !message?.trim()) throw ApiError.badRequest('Subject and message are required')

  const inquiry = await SupportInquiry.create({
    agency: req.agencyId,
    submittedBy: req.user._id,
    subject: subject.trim(),
    category: category || 'Technical issue',
    message: message.trim(),
    contactEmail: String(contactEmail || req.user.email || req.agency.email || '').trim(),
    contactPhone: String(contactPhone || req.user.phone || req.agency.phone || '').trim(),
    priority: priority === 'high' ? 'high' : 'normal',
  })
  res.status(201).json(inquiry.toJSON())
})
