import { asyncHandler } from '../../utils/asyncHandler.js'
import { ApiError } from '../../utils/ApiError.js'
import { bookingCode } from '../../utils/codes.js'
import Booking from '../../models/Booking.js'
import Package from '../../models/Package.js'
import Quotation from '../../models/Quotation.js'
import Client from '../../models/Client.js'
import Invoice from '../../models/Invoice.js'
import { createInvoiceDoc } from './invoiceController.js'
import { computePricing } from '../../services/pricing.js'

const today = () => new Date().toISOString().slice(0, 10)

/** GET /api/bookings */
export const list = asyncHandler(async (req, res) => {
  const q = { agency: req.agencyId }
  if (req.query.status) q.status = req.query.status
  const items = await Booking.find(q).sort('-createdAt')
  res.json({ items, total: items.length })
})

/** GET /api/bookings/:id */
export const getOne = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({ _id: req.params.id, agency: req.agencyId })
  if (!booking) throw ApiError.notFound('Booking not found')
  res.json(booking)
})

/**
 * POST /api/bookings/from-package  { packageId }
 * Converts a package into a booking, auto-generates its invoice, moves the
 * package → Booked, confirms the quotation, and converts the client.
 */
export const fromPackage = asyncHandler(async (req, res) => {
  const pkg = await Package.findOne({ _id: req.body.packageId, agency: req.agencyId })
  if (!pkg) throw ApiError.notFound('Package not found')

  const existing = await Booking.findOne({ agency: req.agencyId, package: pkg._id, status: { $ne: 'Cancelled' } })
  if (existing) return res.json(existing)

  const pr = computePricing(pkg.toObject())
  const destShort = (pkg.destination || '').split(' - ')[0]
  const inv = await createInvoiceDoc(req.agencyId, {
    client: pkg.client, clientName: pkg.clientName, type: 'Booking', package: pkg._id,
    issueDate: today(), dueDate: pkg.startDate || '', status: 'Unpaid', gst: false,
    items: [{ description: `Travel Package ${pkg.code} — ${destShort} (${pkg.nights}N/${pkg.days}D)`, qty: 1, rate: pr.grandTotal, tax: 0 }],
  })

  const code = await bookingCode(req.agencyId)
  const booking = await Booking.create({
    agency: req.agencyId, code, package: pkg._id, invoice: inv._id,
    clientName: pkg.clientName, travelDate: pkg.startDate, status: 'Active',
    value: pr.grandTotal, paid: pkg.paid || 0, payments: [],
  })
  inv.booking = booking._id
  await inv.save()

  pkg.status = 'Booked'
  pkg.logs.unshift({ text: `Booking ${booking.code} created · Invoice ${inv.code} generated`, at: today() })
  await pkg.save()

  await Quotation.updateOne({ agency: req.agencyId, package: pkg._id }, { $set: { status: 'Confirmed' } })
  await Client.updateMany(
    { agency: req.agencyId, $or: [{ _id: pkg.client }, { name: pkg.clientName }] },
    { $set: { tripStatus: 'Converted' } },
  )
  res.status(201).json(booking)
})

/** POST /api/bookings/:id/cancel — rolls the package + invoice back. */
export const cancel = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({ _id: req.params.id, agency: req.agencyId })
  if (!booking) throw ApiError.notFound('Booking not found')
  booking.status = 'Cancelled'
  await booking.save()
  if (booking.invoice) await Invoice.updateOne({ _id: booking.invoice, agency: req.agencyId }, { $set: { status: 'Cancelled' } })
  if (booking.package) {
    const pkg = await Package.findOne({ _id: booking.package, agency: req.agencyId })
    if (pkg) {
      pkg.status = 'Quoted'
      pkg.logs.unshift({ text: `Booking ${booking.code} cancelled`, at: today() })
      await pkg.save()
      await Quotation.updateOne({ agency: req.agencyId, package: pkg._id }, { $set: { status: 'Sent' } })
    }
  }
  res.json(booking)
})

/** POST /api/bookings/:id/payments  { date, method, reference, amount } */
export const addPayment = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({ _id: req.params.id, agency: req.agencyId })
  if (!booking) throw ApiError.notFound('Booking not found')
  booking.payments.push(req.body)
  booking.paid = (booking.paid || 0) + Number(req.body.amount || 0)
  await booking.save()
  res.json(booking)
})

/** PATCH /api/bookings/:id/status  { status } */
export const setStatus = asyncHandler(async (req, res) => {
  const booking = await Booking.findOneAndUpdate(
    { _id: req.params.id, agency: req.agencyId }, { status: req.body.status }, { new: true },
  )
  if (!booking) throw ApiError.notFound('Booking not found')
  res.json(booking)
})
