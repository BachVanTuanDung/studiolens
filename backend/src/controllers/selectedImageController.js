import SelectedImages from '../models/SelectedImages.js'
import Gallery from '../models/Gallery.js'
import { createNotification } from '../utils/createNotification.js'

const normalizeSelectedItem = (img = {}) => {
  const filename = (img.filename || img.caption || '').trim()
  const code = img.code?.trim() || filename.replace(/\.[^.]+$/, '')

  return {
    url: img.url,
    publicId: img.publicId || '',
    filename,
    code,
    note: img.note || '',
    editedUrl: img.editedUrl || '',
    editedPublicId: img.editedPublicId || '',
    editedAt: img.editedAt || null,
  }
}

export const submitSelectedImages = async (req, res) => {
  try {
    const { galleryId, selectedImages = [], note = '' } = req.body

    if (!galleryId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu galleryId',
      })
    }

    if (!Array.isArray(selectedImages) || selectedImages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn ít nhất 1 ảnh',
      })
    }

    const gallery = await Gallery.findById(galleryId)

    if (!gallery) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy gallery',
      })
    }

    const normalizedImages = selectedImages.map(normalizeSelectedItem)

    let record = await SelectedImages.findOne({
      customerId: req.user._id,
      galleryId,
    })

    if (record) {
      record.selectedImages = normalizedImages
      record.note = note
      await record.save()
    } else {
      record = await SelectedImages.create({
        customerId: req.user._id,
        galleryId,
        selectedImages: normalizedImages,
        note,
      })
    }

    await createNotification({
      userId: req.user._id,
      title: 'Đã gửi danh sách ảnh đã chọn',
      message: `Bạn đã gửi ${normalizedImages.length} ảnh đã chọn thành công cho studio.`,
      type: 'selected_images_submitted',
      category: 'gallery',
      priority: 'normal',
      senderRole: 'user',
      link: '/gallery',
      meta: {
        galleryId,
        totalImages: normalizedImages.length,
      },
    })

    res.status(201).json({
      success: true,
      message: 'Đã gửi danh sách ảnh đã chọn',
      data: record,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gửi ảnh đã chọn thất bại',
      error: error.message,
    })
  }
}

export const getAllSelectedImages = async (req, res) => {
  try {
    const records = await SelectedImages.find()
      .populate('customerId', 'name email')
      .populate('galleryId', 'title')
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      data: records,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách ảnh khách đã chọn',
      error: error.message,
    })
  }
}

export const getMySelectedImages = async (req, res) => {
  try {
    const records = await SelectedImages.find({
      customerId: req.user._id,
    }).populate('galleryId', 'title')

    res.json({
      success: true,
      data: records,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Không thể lấy ảnh đã chọn của bạn',
      error: error.message,
    })
  }
}

export const updateSelectedImagesRecord = async (req, res) => {
  try {
    const { selectedImages = [], note = '' } = req.body

    const record = await SelectedImages.findById(req.params.id)

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy record ảnh đã chọn',
      })
    }

    record.selectedImages = selectedImages.map(normalizeSelectedItem)
    record.note = note

    await record.save()

    const editedImagesCount = record.selectedImages.filter((img) => img.editedUrl).length

    if (editedImagesCount > 0) {
      await createNotification({
        userId: record.customerId,
        title: 'Ảnh đã chỉnh sửa xong',
        message: `Studio đã hoàn tất chỉnh sửa ${editedImagesCount} ảnh trong gallery của bạn.`,
        type: 'edited_images_ready',
        category: 'gallery',
        priority: 'high',
        senderRole: 'admin',
        link: '/gallery',
        meta: {
          recordId: record._id,
          editedImagesCount,
        },
      })
    }

    res.json({
      success: true,
      message: 'Cập nhật record ảnh đã chọn thành công',
      data: record,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Cập nhật record thất bại',
      error: error.message,
    })
  }
}