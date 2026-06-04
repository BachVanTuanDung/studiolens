import Service from '../models/Service.js'

export const getServices = async (req, res) => {
  try {
    const { category, keyword } = req.query

    const query = { isActive: true }

    if (category) query.category = category
    if (keyword) query.name = { $regex: keyword, $options: 'i' }

    const services = await Service.find(query).sort({ createdAt: -1 })
    res.json({ success: true, data: services })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id)
    if (!service) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy dịch vụ' })
    }
    res.json({ success: true, data: service })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const createService = async (req, res) => {
  try {
    const service = await Service.create(req.body)
    res.status(201).json({ success: true, data: service })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const updateService = async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!service) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy dịch vụ' })
    }
    res.json({ success: true, data: service })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id)
    if (!service) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy dịch vụ' })
    }

    service.isActive = false
    await service.save()

    res.json({ success: true, message: 'Đã ẩn dịch vụ' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}