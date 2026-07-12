import { asyncHandler } from '../../utils/asyncHandler.js'
import Role from '../../models/Role.js'

/**
 * Roles are read-only inside the CRM. Agencies see what each role can access,
 * but creating roles / changing permissions is done by the Wandra team from
 * the admin panel (see controllers/admin/roleController.js) after the agency
 * sends a request through Help & Support.
 */

/** GET /api/roles */
export const list = asyncHandler(async (req, res) => {
  const items = await Role.find({ agency: req.agencyId }).sort('createdAt')
  res.json({ items, total: items.length })
})
