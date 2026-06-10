import express from 'express'
import {
  createBooking,
  getBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
  getBookedSlotsByDate,
  getMonthlyAvailability,
  markAsPaid,
  confirmPayment,
  handlePayOSWebhook,
  verifyPayOSPayment,
  requestEditBooking,
  approveEditBooking,
  rejectEditBooking,
  requestCancelBooking
} from '../controllers/booking.controller.js'
import { protect, adminOnly } from '../middleware/auth.middleware.js'

const router = express.Router()

router.get('/availability', protect, getMonthlyAvailability)
router.get('/slots/:date', protect, getBookedSlotsByDate)
router.post('/payos-webhook', handlePayOSWebhook)
router.get('/verify-payos-payment', protect, verifyPayOSPayment)
router.get('/', protect, getBookings)
router.get('/:id', protect, getBookingById)
router.post('/', protect, createBooking)
router.put('/:id', protect, updateBooking)
router.delete('/:id', protect, adminOnly, deleteBooking)
router.patch('/:id/pay', protect, markAsPaid)
router.patch('/:id/confirm-payment', protect, adminOnly, confirmPayment)
router.patch('/:id/request-edit', protect, requestEditBooking)
router.patch('/:id/approve-edit', protect, adminOnly, approveEditBooking)
router.patch('/:id/reject-edit', protect, adminOnly, rejectEditBooking)
router.patch('/:id/request-cancel', protect, requestCancelBooking)

export default router