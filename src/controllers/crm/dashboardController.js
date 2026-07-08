import { asyncHandler } from '../../utils/asyncHandler.js'
import Client from '../../models/Client.js'
import Package from '../../models/Package.js'
import Booking from '../../models/Booking.js'
import Invoice from '../../models/Invoice.js'
import Story from '../../models/Story.js'
import { computeDashboard } from '../../services/analytics.js'

/** GET /api/dashboard — KPIs, sparklines, analytics & activity, all live from real tenant data. */
export const stats = asyncHandler(async (req, res) => {
  const scope = { agency: req.agencyId }
  const [clients, packages, bookings, invoices, stories] = await Promise.all([
    Client.find(scope),
    Package.find(scope),
    Booking.find(scope),
    Invoice.find(scope),
    Story.find(scope),
  ])
  res.json(computeDashboard({ clients, packages, bookings, invoices, stories }))
})
