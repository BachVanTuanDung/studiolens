import express from 'express'
import {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../controllers/notification.controller.js'
import { protect } from '../middleware/auth.middleware.js'

const router = express.Router()

router.get('/my', protect, getMyNotifications)
router.put('/read-all', protect, markAllNotificationsAsRead)
router.put('/:id/read', protect, markNotificationAsRead)

export default router