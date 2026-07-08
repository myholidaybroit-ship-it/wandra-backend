import { Router } from 'express'
import * as pub from '../controllers/publicController.js'

const router = Router()

router.get('/itinerary/:code', pub.itinerary)
router.get('/invoice/:code', pub.invoice)
router.get('/voucher/:id', pub.voucher)
router.get('/site/:slug', pub.site)
router.post('/site/:slug/lead', pub.submitLead)
router.get('/stories/:slug', pub.publicStories)
router.post('/stories/:slug', pub.submitStory)

export default router
