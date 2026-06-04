import express from 'express'
import {
  getAllSelectedImages,
  getMySelectedImages,
  submitSelectedImages,
  updateSelectedImagesRecord,
} from '../controllers/selectedImageController.js'
import { protect, adminOnly } from '../middleware/auth.middleware.js'

const router = express.Router()

router.post('/', protect, submitSelectedImages)
router.get('/my', protect, getMySelectedImages)
router.get('/', protect, adminOnly, getAllSelectedImages)
router.put('/:id', protect, adminOnly, updateSelectedImagesRecord)

export default router