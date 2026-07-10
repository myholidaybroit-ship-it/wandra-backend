import { Router } from 'express'
import { adminAuth } from '../middleware/auth.js'
import * as auth from '../controllers/admin/authController.js'
import * as agencies from '../controllers/admin/agencyController.js'
import * as plans from '../controllers/admin/planController.js'
import * as billing from '../controllers/admin/billingController.js'
import * as transactions from '../controllers/admin/transactionController.js'
import * as demos from '../controllers/admin/demoController.js'
import * as dashboard from '../controllers/admin/dashboardController.js'
import * as support from '../controllers/admin/supportController.js'
import { uploadAdmin } from '../controllers/uploadController.js'

const router = Router()

// ── public (no auth) ──
router.post('/auth/login', auth.login)

// everything below requires a super-admin token
router.use(adminAuth)

router.get('/auth/me', auth.me)
router.patch('/auth/profile', auth.updateProfile)
router.post('/auth/password', auth.changePassword)
router.post('/auth/reset-password', auth.resetPassword)

// platform-owned support details and the agency inquiry inbox
router.get('/support/settings', support.getSettings)
router.patch('/support/settings', support.updateSettings)
router.get('/support/inquiries', support.listInquiries)
router.patch('/support/inquiries/:id', support.updateInquiry)

router.get('/dashboard', dashboard.stats)
router.get('/feature-catalog', plans.catalog)
router.post('/upload', uploadAdmin)

// agencies
router.get('/agencies', agencies.list)
router.post('/agencies', agencies.create)
router.get('/agencies/:id', agencies.getOne)
router.patch('/agencies/:id', agencies.update)
router.delete('/agencies/:id', agencies.remove)
router.patch('/agencies/:id/status', agencies.setStatus)
router.patch('/agencies/:id/features', agencies.setFeatures)
router.post('/agencies/:id/features/reset', agencies.resetFeatures)
router.patch('/agencies/:id/limits', agencies.setLimit)
router.post('/agencies/:id/password', agencies.resetPassword)

// billing / subscriptions / renewals
router.post('/agencies/:id/activate-pro', billing.activatePro)
router.post('/agencies/:id/downgrade', billing.downgradeToFree)
router.post('/agencies/:id/renewal/request', billing.requestRenewal)
router.post('/agencies/:id/renewal/cancel', billing.cancelRenewal)
router.post('/agencies/:id/renewal/respond', billing.respondRenewal)
router.post('/agencies/:id/renewal/record', billing.recordRenewal)

// plans + feature catalog
router.get('/plans', plans.list)
router.patch('/plans/:key', plans.update)
router.patch('/plans/:key/features', plans.setFeatures)
router.patch('/plans/:key/limits', plans.setLimit)
router.post('/plans/:key/reset', plans.resetToCatalog)
router.post('/plans/:key/apply', plans.applyToAgencies)

// transactions
router.get('/transactions', transactions.list)
router.get('/transactions/:id', transactions.getOne)

// demos
router.get('/demos', demos.list)
router.post('/demos', demos.create)
router.patch('/demos/:id', demos.update)
router.delete('/demos/:id', demos.remove)

export default router
