import express from 'express'
import {
  getMyGalleries,
  getAllGalleries,
  getGalleryById,
  createGallery,
  updateGallery,
  deleteGallery,
} from '../controllers/galleryController.js'
import { protect, adminOnly } from '../middleware/auth.middleware.js'

const router = express.Router()

router.get('/my', protect, getMyGalleries)
router.get('/', protect, adminOnly, getAllGalleries)
router.get('/:id', protect, getGalleryById)
router.post('/', protect, adminOnly, createGallery)
router.put('/:id', protect, adminOnly, updateGallery)
router.delete('/:id', protect, adminOnly, deleteGallery)

export default router