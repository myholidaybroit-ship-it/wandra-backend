import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { uploadDataUrl, isConfigured } from '../services/storage.js'

/**
 * POST /api/upload  (agency realm)  { data: <dataURL>, folder?: string }
 * Uploads a client-side-resized image/document to S3 under the tenant's folder
 * and returns { url }. Falls back to the data-URL if S3 isn't configured.
 */
export const uploadAgency = asyncHandler(async (req, res) => {
  const { data, folder } = req.body || {}
  if (!data) throw ApiError.badRequest('No file data provided')
  const url = await uploadDataUrl(data, { folder: `agencies/${req.agencyId}/${folder || 'uploads'}` })
  res.json({ url, stored: isConfigured() })
})

/**
 * POST /api/admin/upload  (admin realm)  { data: <dataURL>, folder?: string }
 * For platform-level uploads (e.g. payment proof screenshots).
 */
export const uploadAdmin = asyncHandler(async (req, res) => {
  const { data, folder } = req.body || {}
  if (!data) throw ApiError.badRequest('No file data provided')
  const url = await uploadDataUrl(data, { folder: `admin/${folder || 'uploads'}` })
  res.json({ url, stored: isConfigured() })
})
