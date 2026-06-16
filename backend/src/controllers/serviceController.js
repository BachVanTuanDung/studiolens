import Service from '../models/Service.js'

// Hàm hỗ trợ tự động tạo slug từ tên dịch vụ (VD: "Chụp ảnh cưới" -> "chup-anh-cuoi")
const generateSlug = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

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
    const data = { ...req.body }
    
    // Tự động sinh slug nếu có tên dịch vụ mà frontend không gửi slug lên
    if (data.name && !data.slug) {
      data.slug = generateSlug(data.name)
    }

    const service = await Service.create(data)
    res.status(201).json({ success: true, data: service })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const updateService = async (req, res) => {
  try {
    const data = { ...req.body }
    
    // Nếu người dùng đổi tên dịch vụ, cập nhật luôn lại slug cho chuẩn
    if (data.name && !data.slug) {
      data.slug = generateSlug(data.name)
    }

    const service = await Service.findByIdAndUpdate(req.params.id, data, { new: true })
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