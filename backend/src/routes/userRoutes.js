import express from 'express'
import {
  getProfile,
  updateProfile,
  getUsers,
  getUserById,
  updateUserByAdmin,
  deleteUserByAdmin,
} from '../controllers/userController.js'
import { protect, adminOnly } from '../middleware/auth.middleware.js'

const router = express.Router()

router.get('/profile', protect, getProfile)
router.put('/profile', protect, updateProfile)

router.get('/', protect, adminOnly, getUsers)
router.get('/:id', protect, adminOnly, getUserById)
router.put('/:id', protect, adminOnly, updateUserByAdmin)
router.delete('/:id', protect, adminOnly, deleteUserByAdmin)

export default router