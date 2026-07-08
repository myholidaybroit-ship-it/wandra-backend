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
import AssignmentConfig from '../models/AssignmentConfig.js'
import { computePricing } from '../services/pricing.js'
import { runAssignment } from '../services/assignment.js'
import { uploadIfDataUrl } from '../services/storage.js'
import { cleanLogo } from '../utils/brand.js'

/** Public brand snapshot for client-facing documents. */
const brand = (a) => a && ({
  name: a.name, legalName: a.legalName, logo: cleanLogo(a.logo), email: a.email, phone: a.phone,
  website: a.website, address: a.address, gstin: a.gstin, currency: a.currency, bank: a.bank,
})

/** GET /api/public/itinerary/:code — shareable itinerary (package by code). */
export const itinerary = asyncHandler(async (req, res) => {
  const pkg = await Package.findOne({ code: req.params.code }).sort('-createdAt')
  if (!pkg) throw ApiError.notFound('Itinerary not found')
  const agency = await Agency.findById(pkg.agency)
  res.json({ package: { ...pkg.toJSON(), computed: computePricing(pkg.toObject()) }, agency: brand(agency) })
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
  const landing = await Landing.findOne({ slug: req.params.slug })
  const agency = landing ? await Agency.findById(landing.agency) : await Agency.findOne({ code: req.params.slug })
  if (!agency) throw ApiError.notFound('Agency not found')
  const stories = await Story.find({ agency: agency._id, status: 'Published' }).sort('-createdAt')
  res.json({ agency: brand(agency), stories })
})

/** POST /api/public/stories/:slug — submit a traveler story (pending moderation). */
export const submitStory = asyncHandler(async (req, res) => {
  const landing = await Landing.findOne({ slug: req.params.slug })
  const agency = landing ? await Agency.findById(landing.agency) : await Agency.findOne({ code: req.params.slug })
  if (!agency) throw ApiError.notFound('Agency not found')
  const image = await uploadIfDataUrl(req.body.image, { folder: `agencies/${agency._id}/stories` })
  await Story.create({
    agency: agency._id, status: 'Pending',
    client: req.body.client, rating: req.body.rating || 5, text: req.body.text, image,
    date: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
  })
  res.status(201).json({ ok: true, message: 'Thank you for sharing your story!' })
})
