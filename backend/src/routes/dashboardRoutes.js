import express from 'express'
import {
  getDashboardStats,
  getBookingsChart,
  getRevenueChart,
  getBookingStatusChart,
  getPaymentMethodChart,
  getSessionChart,
  getTopServices,
  getRecentUsers,
} from '../controllers/dashboardController.js'
import { protect, adminOnly } from '../middleware/auth.middleware.js'

const router = express.Router()

router.get('/stats', protect, adminOnly, getDashboardStats)
router.get('/charts/bookings', protect, adminOnly, getBookingsChart)
router.get('/charts/revenue', protect, adminOnly, getRevenueChart)
router.get('/charts/status', protect, adminOnly, getBookingStatusChart)
router.get('/charts/payment-methods', protect, adminOnly, getPaymentMethodChart)
router.get('/charts/sessions', protect, adminOnly, getSessionChart)
router.get('/top-services', protect, adminOnly, getTopServices)
router.get('/recent-users', protect, adminOnly, getRecentUsers)

export default router