import express from 'express'
import {
  getMyConversation,
  getMyMessages,
  sendMyMessage,
  getAdminConversations,
  getAdminMessagesByConversation,
  sendAdminMessage,
  markConversationClosed,
} from '../controllers/chat.controller.js'
import { protect, adminOnly } from '../middleware/auth.middleware.js'

const router = express.Router()

router.get('/my-conversation', protect, getMyConversation)
router.get('/my-messages', protect, getMyMessages)
router.post('/my-messages', protect, sendMyMessage)

router.get('/admin/conversations', protect, adminOnly, getAdminConversations)
router.get('/admin/conversations/:id/messages', protect, adminOnly, getAdminMessagesByConversation)
router.post('/admin/conversations/:id/messages', protect, adminOnly, sendAdminMessage)
router.patch('/admin/conversations/:id/toggle-status', protect, adminOnly, markConversationClosed)

export default router