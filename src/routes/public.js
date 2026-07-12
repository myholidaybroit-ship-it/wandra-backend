import { Router } from 'express'
import * as pub from '../controllers/publicController.js'

const router = Router()

// no public /plans — pricing is only visible inside the CRM after onboarding
router.get('/itinerary/:code', pub.itinerary)
router.get('/invoice/:code', pub.invoice)
router.get('/voucher/:id', pub.voucher)
router.get('/site/:slug', pub.site)
router.post('/site/:slug/lead', pub.submitLead)
router.get('/stories/:slug', pub.publicStories)
router.post('/stories/:slug', pub.submitStory)
router.post('/trial', pub.submitTrial)
// CORS-safe image proxy — used while capturing quote PDFs client-side
router.get('/img', pub.imageProxy)

export default router
