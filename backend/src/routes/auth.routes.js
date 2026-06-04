import express from 'express'
import {
  register,
  login,
  verifyEmail,
  resendVerificationCode,
  forgotPassword,
  getMe,
  updateProfile,
  changePassword,
} from '../controllers/auth.controller.js'
import { protect } from '../middleware/auth.middleware.js'

const router = express.Router()

// Public routes
router.post('/register', register)
router.post('/login', login)
router.post('/verify-email', verifyEmail)
router.post('/resend-verification-code', resendVerificationCode)
router.post('/forgot-password', forgotPassword)

// Protected routes
router.get('/me', protect, getMe)
router.put('/update-profile', protect, updateProfile)
router.put('/change-password', protect, changePassword)

export default router