import Gallery from '../models/Gallery.js'
import { createNotification } from '../utils/createNotification.js'

const buildImagePayload = (img = {}) => {
  const filename = (img.filename || img.caption || '').trim()
  const code = img.code?.trim() || filename.replace(/\.[^.]+$/, '')

  return {
    url: img.url,
    publicId: img.publicId || '',
    caption: img.caption || filename || '',
    filename,
    code,
  }
}

export const getAllGalleries = async (req, res) => {
  try {
    const galleries = await Gallery.find()
      .populate('customerId', 'name email')
      .populate('bookingId', 'bookingCode date time')
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      data: galleries,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách gallery',
      error: error.message,
    })
  }
}

export const getMyGalleries = async (req, res) => {
  try {
    const galleries = await Gallery.find({
      customerId: req.user._id,
      status: { $in: ['published', 'selected'] },
    }).sort({ createdAt: -1 })

    res.json({
      success: true,
      galleries,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Không thể lấy gallery của bạn',
      error: error.message,
    })
  }
}

export const createGallery = async (req, res) => {
  try {
    const {
      customerId,
      bookingId,
      title,
      description,
      status,
      images = [],
    } = req.body

    const gallery = await Gallery.create({
      customerId,
      bookingId: bookingId || null,
      title,
      description,
      status,
      images: images.map(buildImagePayload),
    })

    await createNotification({
      userId: customerId,
      title: 'Gallery mới đã được cập nhật',
      message: `Studio vừa tạo gallery "${title}" cho bạn.`,
      type: 'gallery_created',
      category: 'gallery',
      priority: 'normal',
      senderRole: 'admin',
      link: '/gallery',
      meta: {
        galleryId: gallery._id,
        bookingId: gallery.bookingId || null,
        title: gallery.title,
        status: gallery.status,
        totalImages: gallery.images?.length || 0,
      },
    })

    res.status(201).json({
      success: true,
      message: 'Tạo gallery thành công',
      data: gallery,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Tạo gallery thất bại',
      error: error.message,
    })
  }
}

export const updateGallery = async (req, res) => {
  try {
    const {
      customerId,
      bookingId,
      title,
      description,
      status,
      images = [],
    } = req.body

    const gallery = await Gallery.findById(req.params.id)

    if (!gallery) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy gallery',
      })
    }

    const oldTitle = gallery.title
    const oldStatus = gallery.status
    const oldImagesCount = gallery.images?.length || 0

    gallery.customerId = customerId
    gallery.bookingId = bookingId || null
    gallery.title = title
    gallery.description = description
    gallery.status = status
    gallery.images = images.map(buildImagePayload)

    await gallery.save()

    await createNotification({
      userId: customerId,
      title: 'Gallery đã được cập nhật',
      message: `Studio vừa cập nhật gallery "${title}".`,
      type: 'gallery_updated',
      category: 'gallery',
      priority: 'normal',
      senderRole: 'admin',
      link: '/gallery',
      meta: {
        galleryId: gallery._id,
        bookingId: gallery.bookingId || null,
        oldTitle,
        newTitle: gallery.title,
        oldStatus,
        newStatus: gallery.status,
        oldImagesCount,
        newImagesCount: gallery.images?.length || 0,
      },
    })

    res.json({
      success: true,
      message: 'Cập nhật gallery thành công',
      data: gallery,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Cập nhật gallery thất bại',
      error: error.message,
    })
  }
}

export const deleteGallery = async (req, res) => {
  try {
    const gallery = await Gallery.findById(req.params.id)

    if (!gallery) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy gallery',
      })
    }

    await gallery.deleteOne()

    res.json({
      success: true,
      message: 'Xóa gallery thành công',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Xóa gallery thất bại',
      error: error.message,
    })
  }
}

export const getGalleryById = async (req, res) => {
  try {
    const gallery = await Gallery.findById(req.params.id)
      .populate('customerId', 'name email')
      .populate('bookingId', 'bookingCode date time')

    if (!gallery) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy gallery',
      })
    }

    res.json({
      success: true,
      data: gallery,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Không thể lấy chi tiết gallery',
      error: error.message,
    })
  }
}