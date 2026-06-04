import Concept from '../models/Concept.js'
import Service from '../models/Service.js'

export const getConcepts = async (req, res) => {
  try {
    const { category, keyword, featured } = req.query

    const query = { isActive: true }

    if (category) query.category = category
    if (keyword) query.name = { $regex: keyword, $options: 'i' }
    if (featured === 'true') query.isFeatured = true

    const concepts = await Concept.find(query)
      .populate('relatedServices', 'name')
      .sort({ createdAt: -1 })

    res.json({ success: true, data: concepts })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const getConceptById = async (req, res) => {
  try {
    const concept = await Concept.findById(req.params.id).populate('relatedServices', 'name')

    if (!concept) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy concept',
      })
    }

    res.json({ success: true, data: concept })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const createConcept = async (req, res) => {
  try {
    const concept = await Concept.create(req.body)
    res.status(201).json({ success: true, data: concept })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const updateConcept = async (req, res) => {
  try {
    const concept = await Concept.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    })

    if (!concept) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy concept',
      })
    }

    res.json({ success: true, data: concept })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const deleteConcept = async (req, res) => {
  try {
    const concept = await Concept.findById(req.params.id)

    if (!concept) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy concept',
      })
    }

    concept.isActive = false
    await concept.save()

    res.json({ success: true, message: 'Đã ẩn concept' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const suggestConcepts = async (req, res) => {
  try {
    const { serviceId } = req.params

    const concepts = await Concept.find({
      isActive: true,
      relatedServices: serviceId,
    }).sort({ isFeatured: -1, createdAt: -1 })

    res.json({ success: true, data: concepts })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}