import express from 'express'
import {
  getConcepts,
  getConceptById,
  createConcept,
  updateConcept,
  deleteConcept,
  suggestConcepts,
} from '../controllers/conceptController.js'
import { protect, adminOnly } from '../middleware/auth.middleware.js'

const router = express.Router()

router.get('/', getConcepts)
router.get('/suggest/:serviceId', suggestConcepts)
router.get('/:id', getConceptById)
router.post('/', protect, adminOnly, createConcept)
router.put('/:id', protect, adminOnly, updateConcept)
router.delete('/:id', protect, adminOnly, deleteConcept)

export default router