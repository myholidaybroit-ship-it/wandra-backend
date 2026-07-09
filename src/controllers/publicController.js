import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { clientCode } from '../utils/codes.js'
import Agency from '../models/Agency.js'
import Package from '../models/Package.js'
import Invoice from '../models/Invoice.js'
import Voucher from '../models/Voucher.js'
import Landing from '../models/Landing.js'
import Story from '../models/Story.js'
import Client from '../models/Client.js'
import User from '../models/User.js'
import Destination from '../models/Destination.js'
import Hotel from '../models/Hotel.js'
import Cab from '../models/Cab.js'
import Activity from '../models/Activity.js'
import ServiceLocation from '../models/ServiceLocation.js'
import AssignmentConfig from '../models/AssignmentConfig.js'
import DemoRequest from '../models/DemoRequest.js'
import { computePricing } from '../services/pricing.js'
import { runAssignment } from '../services/assignment.js'
import { uploadIfDataUrl } from '../services/storage.js'
import { cleanLogo } from '../utils/brand.js'

/** Public brand snapshot for client-facing documents. */
const DEFAULT_INVOICE_SETTINGS = {
  defaultGst: 18,
  defaultDue: 15,
  type: 'Non-GST',
  terms: 'Payable within 15 days. 50% advance to confirm booking.',
  footer: 'Thank you for travelling with us.',
}
const brand = (a) => a && ({
  name: a.name, legalName: a.legalName, logo: cleanLogo(a.logo), email: a.email, phone: a.phone,
  website: a.website, address: a.address, gstin: a.gstin, currency: a.currency, bank: a.bank,
  invoiceSettings: { ...DEFAULT_INVOICE_SETTINGS, ...(a.invoiceSettings?.toObject?.() || a.invoiceSettings || {}) },
})

const slugify = (v) => String(v || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
const escRx = (v) => String(v || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
async function findAgencyByPublicSlug(slug) {
  const landing = await Landing.findOne({ slug })
  if (landing) return Agency.findById(landing.agency)
  const byCode = await Agency.findOne({ code: new RegExp(`^${escRx(slug)}$`, 'i') })
  if (byCode) return byCode
  const agencies = await Agency.find({}).select('name code logo email phone website address gstin currency bank invoiceSettings')
  return agencies.find((a) => slugify(a.name) === slugify(slug)) || null
}

/** GET /api/public/itinerary/:code — shareable itinerary (package by code). */
export const itinerary = asyncHandler(async (req, res) => {
  const pkg = await Package.findOne({ code: req.params.code }).sort('-createdAt')
  if (!pkg) throw ApiError.notFound('Itinerary not found')
  const [agency, destinations, hotels, cabs, activities, serviceLocations] = await Promise.all([
    Agency.findById(pkg.agency),
    Destination.find({ agency: pkg.agency }).select('name location image gallery'),
    Hotel.find({ agency: pkg.agency }).select('name destination city rating description image roomTypes buyingPrice extraBedAdult extraBedChild childNoBed'),
    Cab.find({ agency: pkg.agency }).select('name type image contact ratePerDay ratePerKm'),
    Activity.find({ agency: pkg.agency }).select('name destination category description image sell cost durationMins'),
    ServiceLocation.find({ agency: pkg.agency }).select('name destination serviceType description image sell cost durationMins'),
  ])
  res.json({
    package: { ...pkg.toJSON(), computed: computePricing(pkg.toObject()) },
    agency: brand(agency),
    masters: { destinations, hotels, cabs, activities, serviceLocations },
  })
})

/** GET /api/public/invoice/:code */
export const invoice = asyncHandler(async (req, res) => {
  const inv = await Invoice.findOne({ code: req.params.code }).sort('-createdAt')
  if (!inv) throw ApiError.notFound('Invoice not found')
  const agency = await Agency.findById(inv.agency)
  res.json({ invoice: inv.toJSON(), agency: brand(agency) })
})

/** GET /api/public/voucher/:id */
export const voucher = asyncHandler(async (req, res) => {
  const v = await Voucher.findById(req.params.id)
  if (!v) throw ApiError.notFound('Voucher not found')
  const agency = await Agency.findById(v.agency)
  res.json({ voucher: v.toJSON(), agency: brand(agency) })
})

/** GET /api/public/site/:slug — a published lead-capture landing page. */
export const site = asyncHandler(async (req, res) => {
  const landing = await Landing.findOne({ slug: req.params.slug })
  if (!landing || !landing.published) throw ApiError.notFound('Site not found')
  const agency = await Agency.findById(landing.agency)
  const site = landing.toJSON()
  if (site.header) site.header.logo = cleanLogo(site.header.logo)   // header mirrors the agency logo, never the Wandra placeholder
  res.json({ landing: site, agency: brand(agency) })
})

/** POST /api/public/site/:slug/lead — submit an enquiry from a landing page. */
export const submitLead = asyncHandler(async (req, res) => {
  const landing = await Landing.findOne({ slug: req.params.slug })
  if (!landing) throw ApiError.notFound('Site not found')
  const agencyId = landing.agency
  const body = req.body || {}

  const draft = {
    name: body.name, email: body.email, phone: body.phone, city: body.fromCity,
    interest: body.destination, source: body.source || 'Landing Page',
    budget: body.budget,
    query: {
      startDate: body.startDate, days: body.days, adults: body.adults, children: body.children,
      fromCity: body.fromCity, comments: body.comments,
    },
  }

  const [cfg, activeUsers] = await Promise.all([
    AssignmentConfig.findOne({ agency: agencyId }),
    User.find({ agency: agencyId, status: 'Active' }).select('name'),
  ])
  const { assignee, via } = runAssignment(cfg, activeUsers.map((u) => u.name), draft)
  if (cfg) await cfg.save()

  const code = await clientCode(agencyId)
  await Client.create({
    ...draft, agency: agencyId, code, tripStatus: 'New Query',
    query: { ...draft.query, assignee, assignedVia: via },
  })
  res.status(201).json({ ok: true, message: landing.form?.successMsg || 'Thanks! We will be in touch shortly.' })
})

/** GET /api/public/stories/:slug — an agency's published testimonials. */
export const publicStories = asyncHandler(async (req, res) => {
  const agency = await findAgencyByPublicSlug(req.params.slug)
  if (!agency) throw ApiError.notFound('Agency not found')
  const stories = await Story.find({ agency: agency._id, status: 'Published' }).sort('-createdAt')
  res.json({ agency: brand(agency), stories })
})

/** POST /api/public/stories/:slug — submit a traveler story (pending moderation). */
export const submitStory = asyncHandler(async (req, res) => {
  const agency = await findAgencyByPublicSlug(req.params.slug)
  if (!agency) throw ApiError.notFound('Agency not found')
  const image = await uploadIfDataUrl(req.body.image, { folder: `agencies/${agency._id}/stories` })
  await Story.create({
    agency: agency._id, status: 'Pending',
    client: req.body.client, rating: req.body.rating || 5, text: req.body.text, image,
    date: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
  })
  res.status(201).json({ ok: true, message: 'Thank you for sharing your story!' })
})

/** POST /api/public/trial — collect a public free-trial request for admin follow-up. */
export const submitTrial = asyncHandler(async (req, res) => {
  const body = req.body || {}
  if (!body.name || !body.agencyName || !body.phone) throw ApiError.badRequest('Name, agency name and phone are required')
  const details = [
    body.city ? `City: ${body.city}` : '',
    body.website ? `Website: ${body.website}` : '',
    body.teamSize ? `Team size: ${body.teamSize}` : '',
    body.note ? `Notes: ${body.note}` : '',
  ].filter(Boolean).join('\n')
  await DemoRequest.create({
    name: body.name,
    agencyName: body.agencyName,
    phone: body.phone,
    email: body.email || '',
    status: 'pending',
    note: details || 'Free trial request from website',
  })
  res.status(201).json({ ok: true, message: 'Thanks! We will contact you to activate your free trial.' })
})
