import { asyncHandler } from '../../utils/asyncHandler.js'
import User from '../../models/User.js'

/**
 * Team members are read-only inside the CRM. Every user is a paid seat
 * (₹999/user/month, the owner counts too), so the Wandra team adds, edits,
 * resets passwords for and removes users from the admin panel
 * (see controllers/admin/userController.js) after the agency sends a request
 * through the "Roles & team" form.
 */

/** GET /api/users */
export const list = asyncHandler(async (req, res) => {
  const items = await User.find({ agency: req.agencyId }).sort('-createdAt')
  res.json({ items, total: items.length })
})
