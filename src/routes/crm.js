import { Router } from 'express'
import { agencyAuth } from '../middleware/auth.js'
import { requireFeature } from '../middleware/planGate.js'

import * as auth from '../controllers/crm/authController.js'
import * as agency from '../controllers/crm/agencyController.js'
import * as master from '../controllers/crm/masterController.js'
import * as users from '../controllers/crm/userController.js'
import * as roles from '../controllers/crm/roleController.js'
import * as assignment from '../controllers/crm/assignmentController.js'
import * as inclusions from '../controllers/crm/inclusionController.js'
import * as clients from '../controllers/crm/clientController.js'
import * as packages from '../controllers/crm/packageController.js'
import { templates } from '../controllers/crm/templateController.js'
import * as bookings from '../controllers/crm/bookingController.js'
import * as invoices from '../controllers/crm/invoiceController.js'
import * as quotations from '../controllers/crm/quotationController.js'
import * as vouchers from '../controllers/crm/voucherController.js'
import * as stories from '../controllers/crm/storyController.js'
import * as landing from '../controllers/crm/landingController.js'
import * as dashboard from '../controllers/crm/dashboardController.js'
import * as config from '../controllers/crm/configController.js'
import { uploadAgency } from '../controllers/uploadController.js'

const router = Router()

// ── auth (public) ──
router.post('/auth/login', auth.login)
router.post('/auth/logout', auth.logout)

// everything below requires an agency token
router.use(agencyAuth)
router.get('/auth/me', auth.me)
router.post('/auth/password', auth.changePassword)

// agency profile + entitlements
router.get('/agency', agency.getProfile)
router.patch('/agency', agency.updateProfile)
router.get('/agency/features', agency.features)
router.post('/agency/renewal/respond', agency.respondRenewal)

// dashboard + platform config
router.get('/dashboard', dashboard.stats)
router.get('/config', config.config)

// file uploads → S3 (returns a public URL)
router.post('/upload', uploadAgency)

// ── feature gating (admin-controlled per agency/plan) ──
// A disabled feature returns 402 on that module's routes. Reads that other
// features depend on degrade gracefully (the frontend catches + shows empty).
router.use('/clients', requireFeature('crm.view'))
router.use('/packages', requireFeature('builder.access'))
router.use('/bookings', requireFeature('bookings.view'))
router.use('/invoices', requireFeature('invoices.view'))
router.use('/quotations', requireFeature('quotations.view'))
router.use('/vouchers', requireFeature('vouchers.view'))
router.use('/destinations', requireFeature('master.destinations'))
router.use('/hotels', requireFeature('master.hotels'))
router.use('/cabs', requireFeature('master.cabs'))
router.use('/services', requireFeature('master.service_locations'))
router.use('/activities', requireFeature('master.activities'))
router.use('/inclusions', requireFeature('master.inclusions'))
router.use('/landing', requireFeature('landing.builder'))
router.use('/stories', requireFeature('reviews.view'))
router.use('/assignment', requireFeature('team.lead_assignment'))

// team & roles
router.get('/users', users.list)
router.post('/users', users.create)
router.patch('/users/:id', users.update)
router.delete('/users/:id', users.remove)
router.get('/roles', roles.list)
router.post('/roles', roles.create)
router.patch('/roles/:id/perm', roles.setPerm)
router.delete('/roles/:id', roles.remove)

// lead assignment
router.get('/assignment', assignment.get)
router.patch('/assignment', assignment.update)
router.post('/assignment/rules', assignment.addRule)
router.patch('/assignment/rules/:ruleId', assignment.updateRule)
router.delete('/assignment/rules/:ruleId', assignment.removeRule)

// master data — a helper to mount standard CRUD
const mountCrud = (base, c, { del = true } = {}) => {
  router.get(base, c.list)
  router.post(base, c.create)
  router.get(`${base}/:id`, c.getOne)
  router.patch(`${base}/:id`, c.update)
  if (del) router.delete(`${base}/:id`, c.remove)
}
mountCrud('/destinations', master.destinations)
mountCrud('/hotels', master.hotels)
mountCrud('/cabs', master.cabs)
mountCrud('/services', master.services)
mountCrud('/activities', master.activities)
mountCrud('/templates', templates)
mountCrud('/itinerary-templates', config.itineraryTemplates)

// inclusion / exclusion presets
router.get('/inclusions', inclusions.get)
router.post('/inclusions', inclusions.add)
router.patch('/inclusions', inclusions.rename)
router.delete('/inclusions', inclusions.remove)

// clients / leads
router.get('/clients', clients.list)
router.post('/clients', clients.create)
router.get('/clients/:id', clients.getOne)
router.patch('/clients/:id', clients.update)
router.delete('/clients/:id', clients.remove)
router.post('/clients/:id/docs', clients.addDoc)
router.delete('/clients/:id/docs/:docId', clients.removeDoc)

// packages / quotes
router.get('/packages', packages.list)
router.post('/packages', packages.create)
router.post('/packages/price', packages.price)
router.post('/packages/from-template', packages.fromTemplate)
router.get('/packages/:id', packages.getOne)
router.patch('/packages/:id', packages.update)
router.delete('/packages/:id', packages.remove)
router.patch('/packages/:id/status', packages.setStatus)
router.post('/packages/:id/logs', packages.addLog)

// bookings
router.get('/bookings', bookings.list)
router.post('/bookings/from-package', bookings.fromPackage)
router.get('/bookings/:id', bookings.getOne)
router.post('/bookings/:id/cancel', bookings.cancel)
router.post('/bookings/:id/payments', bookings.addPayment)
router.patch('/bookings/:id/status', bookings.setStatus)

// invoices
router.get('/invoices', invoices.list)
router.post('/invoices', invoices.create)
router.get('/invoices/:id', invoices.getOne)
router.patch('/invoices/:id', invoices.update)
router.delete('/invoices/:id', invoices.remove)
router.post('/invoices/:id/payments', invoices.addPayment)

// quotations
router.get('/quotations', quotations.list)
router.patch('/quotations/:id/status', quotations.setStatus)

// vouchers
router.get('/vouchers', vouchers.list)
router.post('/vouchers', vouchers.create)
router.get('/vouchers/:id', vouchers.getOne)
router.delete('/vouchers/:id', vouchers.remove)

// gallery / stories
router.get('/stories', stories.list)
router.post('/stories', stories.create)
router.patch('/stories/:id/approve', stories.approve)
router.delete('/stories/:id', stories.remove)

// landing builder
router.get('/landing', landing.get)
router.patch('/landing', landing.update)

export default router
