import { useEffect, useMemo, useRef, useState } from 'react'
import imageCompression from 'browser-image-compression'
import toast from 'react-hot-toast'
import {
  createConcept,
  deleteConcept,
  getConcepts,
  updateConcept,
} from '../../api/conceptApi'
import { getServices } from '../../api/serviceApi'

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
};

const categories = [
  { value: 'romantic', label: 'Romantic' },
  { value: 'vintage', label: 'Vintage' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'editorial', label: 'Editorial' },
  { value: 'dark', label: 'Dark' },
  { value: 'outdoor', label: 'Outdoor' },
  { value: 'studio', label: 'Studio' },
]

const initialForm = {
  name: '',
  description: '',
  category: 'studio',
  tags: '',
  relatedServices: [],
  isFeatured: false,
}

const CLOUD_NAME = 'dzhjqp5hh'
const UPLOAD_PRESET = 'anh_test'
const MAX_FILE_SIZE_MB = 10

const StatCard = ({ title, value, tone = 'neutral' }) => {
  const toneMap = {
    neutral: 'from-neutral-950 via-neutral-900 to-neutral-800 text-white',
    yellow: 'from-yellow-600 via-amber-500 to-orange-500 text-white',
    blue: 'from-blue-700 via-sky-600 to-cyan-500 text-white',
    green: 'from-green-700 via-emerald-600 to-teal-500 text-white',
  }

  return (
    <div
      className={`rounded-[28px] bg-gradient-to-br p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg ${toneMap[tone]}`}
    >
      <p className="text-xs uppercase tracking-[0.25em] opacity-80">{title}</p>
      <p className="mt-3 text-3xl font-bold">{value}</p>
    </div>
  )
}

const InputField = ({ label, required = false, children }) => (
  <div>
    <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
)

const AdminConceptsPage = () => {
  const [concepts, setConcepts] = useState([])
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [editingId, setEditingId] = useState('')
  const [formData, setFormData] = useState(initialForm)

  // Đổi từ 1 ảnh sang nhiều ảnh
  const [images, setImages] = useState([])
  const [selectedFiles, setSelectedFiles] = useState([])

  const [searchKeyword, setSearchKeyword] = useState('')
  const [featuredFilter, setFeaturedFilter] = useState('all')
  
  // Trình xem ảnh giống Gallery
  const [previewConcept, setPreviewConcept] = useState(null)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerImages, setViewerImages] = useState([])
  const [viewerIndex, setViewerIndex] = useState(0)
  const [viewerSource, setViewerSource] = useState('concept')

  const fetchData = async () => {
    try {
      setLoading(true)
      const [conceptRes, serviceRes] = await Promise.all([getConcepts(), getServices()])

      setConcepts(conceptRes.data?.data || [])
      setServices(serviceRes.data?.data || [])
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.message || 'Không thể tải dữ liệu concept')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!viewerOpen) return
      if (e.key === 'Escape') setViewerOpen(false)
      if (e.key === 'ArrowLeft') {
        setViewerIndex((prev) => (prev === 0 ? viewerImages.length - 1 : prev - 1))
      }
      if (e.key === 'ArrowRight') {
        setViewerIndex((prev) => (prev === viewerImages.length - 1 ? 0 : prev + 1))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [viewerOpen, viewerImages.length])

  const stats = useMemo(() => {
    return {
      total: concepts.length,
      featured: concepts.filter((item) => item.isFeatured).length,
      categories: new Set(concepts.map((item) => item.category).filter(Boolean)).size,
      linkedServices: concepts.filter((item) => item.relatedServices?.length > 0).length,
    }
  }, [concepts])

  const filteredConcepts = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase()

    return concepts.filter((concept) => {
      const matchesKeyword =
        !keyword ||
        concept.name?.toLowerCase().includes(keyword) ||
        concept.category?.toLowerCase().includes(keyword) ||
        concept.description?.toLowerCase().includes(keyword)

      const matchesFeatured =
        featuredFilter === 'all'
          ? true
          : featuredFilter === 'featured'
          ? concept.isFeatured
          : !concept.isFeatured

      return matchesKeyword && matchesFeatured
    })
  }, [concepts, searchKeyword, featuredFilter])

  const normalizeImage = (img, index) => {
    const imageUrl = typeof img === 'string' ? img : img.url
    const caption = typeof img === 'string' ? `Ảnh ${index + 1}` : img.caption || `Ảnh ${index + 1}`
    return { ...(typeof img === 'string' ? {} : img), url: imageUrl, caption }
  }

  const resetForm = () => {
    setFormData(initialForm)
    setEditingId('')
    setImages([])
    setSelectedFiles([])
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleServiceToggle = (serviceId) => {
    setFormData((prev) => {
      const exists = prev.relatedServices.includes(serviceId)
      return {
        ...prev,
        relatedServices: exists
          ? prev.relatedServices.filter((id) => id !== serviceId)
          : [...prev.relatedServices, serviceId],
      }
    })
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || [])
    const maxBytes = MAX_FILE_SIZE_MB * 1024 * 1024

    const oversizedFiles = files.filter((file) => file.size > maxBytes)
    const validFiles = files.filter((file) => file.size <= maxBytes)

    if (oversizedFiles.length > 0) {
      toast.error(`${oversizedFiles.length} ảnh vượt quá ${MAX_FILE_SIZE_MB}MB. Hệ thống sẽ bỏ qua các ảnh này.`)
    }

    setSelectedFiles(validFiles)
  }

  const compressFile = async (file) => {
    try {
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      })
      return new File([compressedFile], file.name, { type: compressedFile.type })
    } catch (error) {
      console.error('Compress error:', error)
      return file
    }
  }

  const uploadFilesToCloudinary = async () => {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      toast.error('Thiếu cấu hình Cloudinary')
      return images
    }

    if (selectedFiles.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 ảnh')
      return images
    }

    setUploading(true)

    try {
      const uploaded = []

      for (let i = 0; i < selectedFiles.length; i += 1) {
        const originalFile = selectedFiles[i]
        const file = await compressFile(originalFile)

        const body = new FormData()
        body.append('file', file)
        body.append('upload_preset', UPLOAD_PRESET)
        body.append('folder', 'studiolens/concepts')

        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
          method: 'POST',
          body,
        })

        const data = await res.json()

        if (!res.ok) throw new Error(data?.error?.message || 'Upload ảnh thất bại')

        uploaded.push({
          url: data.secure_url,
          publicId: data.public_id,
          caption: originalFile.name,
        })
      }

      const merged = [...images, ...uploaded]
      setImages(merged)
      setSelectedFiles([])
      toast.success(`Đã upload ${uploaded.length} ảnh`)
      return merged
    } catch (error) {
      console.error(error)
      toast.error(error.message || 'Upload ảnh thất bại')
      return images
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (indexToRemove) => {
    setImages((prev) => prev.filter((_, index) => index !== indexToRemove))
  }

  const handleEdit = (concept) => {
    setEditingId(concept._id)
    setFormData({
      name: concept.name || '',
      description: concept.description || '',
      category: concept.category || 'studio',
      tags: Array.isArray(concept.tags) ? concept.tags.join(', ') : '',
      relatedServices: Array.isArray(concept.relatedServices)
        ? concept.relatedServices.map((item) => item._id || item)
        : [],
      isFeatured: !!concept.isFeatured,
    })
    
    // Nếu dữ liệu cũ là string (1 ảnh), chuyển thành mảng
    const conceptImages = Array.isArray(concept.images) 
      ? concept.images 
      : concept.image ? [concept.image] : [];

    setImages(conceptImages)
    setSelectedFiles([])
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name || !formData.category) {
      toast.error('Vui lòng nhập đầy đủ các trường bắt buộc')
      return
    }

    try {
      setSaving(true)
      let finalImages = images

      if (selectedFiles.length > 0) {
        finalImages = await uploadFilesToCloudinary()
      }

      if (!finalImages.length) {
        toast.error('Vui lòng upload ít nhất 1 ảnh concept')
        return
      }

      const payload = {
        ...formData,
        slug: generateSlug(formData.name), // Tự động sinh slug từ tên Concept
        image: finalImages[0]?.url || finalImages[0], // Truyền ảnh đầu tiên vào biến 'image' để backend không báo lỗi
        images: finalImages, // Vẫn gửi mảng nhiều ảnh lên cho tính năng mới
        tags: formData.tags
          ? formData.tags.split(',').map((item) => item.trim()).filter(Boolean)
          : [],
      }

      if (editingId) {
        const res = await updateConcept(editingId, payload)
        const updated = res.data?.data
        setConcepts((prev) => prev.map((item) => (item._id === editingId ? updated : item)))
        toast.success('Cập nhật concept thành công')
      } else {
        const res = await createConcept(payload)
        const created = res.data?.data
        setConcepts((prev) => [created, ...prev])
        toast.success('Thêm concept thành công')
      }

      resetForm()
      await fetchData()
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.message || 'Lưu concept thất bại')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    const confirmed = window.confirm('Bạn có chắc muốn ẩn concept này không?')
    if (!confirmed) return
    try {
      await deleteConcept(id)
      setConcepts((prev) => prev.filter((item) => item._id !== id))
      toast.success('Đã ẩn concept')
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.message || 'Ẩn concept thất bại')
    }
  }

  // Chức năng Image Viewer
  const openImageViewer = (imageList = [], startIndex = 0, source = 'concept') => {
    const normalized = imageList.map((img, index) => normalizeImage(img, index))
    setViewerImages(normalized)
    setViewerIndex(startIndex)
    setViewerSource(source)
    setViewerOpen(true)
  }

  const closeImageViewer = () => setViewerOpen(false)
  const showPrevImage = () => setViewerIndex((prev) => (prev === 0 ? viewerImages.length - 1 : prev - 1))
  const showNextImage = () => setViewerIndex((prev) => (prev === viewerImages.length - 1 ? 0 : prev + 1))

  const handleDeleteViewerImage = async () => {
    if (!viewerImages.length) return
    const confirmed = window.confirm('Bạn có chắc muốn xóa ảnh này không?')
    if (!confirmed) return

    const current = viewerImages[viewerIndex]

    if (viewerSource === 'form') {
      setImages((prev) => prev.filter((img, index) => normalizeImage(img, index).url !== current.url))
      const nextImages = viewerImages.filter((_, index) => index !== viewerIndex)
      setViewerImages(nextImages)
      if (nextImages.length === 0) setViewerOpen(false)
      else if (viewerIndex >= nextImages.length) setViewerIndex(nextImages.length - 1)
      toast.success('Đã xóa ảnh khỏi form hiện tại')
      return
    }

    if (viewerSource === 'concept' && previewConcept?._id) {
      try {
        const previewImages = previewConcept.images || (previewConcept.image ? [previewConcept.image] : [])
        const nextConceptImages = previewImages.filter((img, index) => normalizeImage(img, index).url !== current.url)

        await updateConcept(previewConcept._id, {
          ...previewConcept,
          images: nextConceptImages,
        })

        const updatedPreview = { ...previewConcept, images: nextConceptImages }
        setPreviewConcept(updatedPreview)
        setConcepts((prev) => prev.map((c) => (c._id === previewConcept._id ? updatedPreview : c)))

        const nextImages = viewerImages.filter((_, index) => index !== viewerIndex)
        setViewerImages(nextImages)
        if (nextImages.length === 0) setViewerOpen(false)
        else if (viewerIndex >= nextImages.length) setViewerIndex(nextImages.length - 1)

        toast.success('Đã xóa ảnh khỏi concept')
      } catch (error) {
        console.error(error)
        toast.error(error.response?.data?.message || 'Xóa ảnh thất bại')
      }
    }
  }

  const currentViewerImage = viewerImages[viewerIndex]

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 dark:text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-yellow-700 dark:text-yellow-400">
            Quản lý concept
          </p>
          <div className="mt-3 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h1 className="text-5xl font-bold tracking-tight">Concept chụp ảnh</h1>
              <p className="mt-3 max-w-3xl text-neutral-600 dark:text-neutral-300">
                Thêm, chỉnh sửa và quản lý các concept với upload nhiều ảnh trực tiếp từ máy tính,
                giao diện đồng bộ với gallery và trải nghiệm quản trị hiện đại.
              </p>
            </div>

            <div className="inline-flex rounded-full border border-yellow-200 bg-yellow-50 px-4 py-2 text-sm font-medium text-yellow-800 dark:border-yellow-900/40 dark:bg-yellow-900/20 dark:text-yellow-300">
              Concept control panel
            </div>
          </div>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Tổng concept" value={stats.total} tone="neutral" />
          <StatCard title="Concept nổi bật" value={stats.featured} tone="yellow" />
          <StatCard title="Danh mục đang có" value={stats.categories} tone="blue" />
          <StatCard title="Đã liên kết dịch vụ" value={stats.linkedServices} tone="green" />
        </div>

        <div className="grid gap-8 xl:grid-cols-[460px_1fr]">
          <div className="flex h-full flex-col rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm transition duration-300 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-yellow-700 dark:text-yellow-400">
                  Concept Editor
                </p>
                <h2 className="mt-2 text-2xl font-semibold">
                  {editingId ? 'Chỉnh sửa concept' : 'Thêm concept mới'}
                </h2>
              </div>

              {editingId ? (
                <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800 ring-1 ring-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:ring-yellow-500/30">
                  Editing
                </span>
              ) : null}
            </div>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-1 flex-col space-y-4">
              <div className="space-y-4">
                <InputField label="Tên concept" required>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Ví dụ: Romantic Outdoor"
                    className="w-full rounded-2xl border border-neutral-200 px-4 py-3 transition focus:border-yellow-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950"
                  />
                </InputField>

                <InputField label="Danh mục" required>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-neutral-200 px-4 py-3 transition focus:border-yellow-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950"
                  >
                    {categories.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </InputField>

                <div className="rounded-2xl border border-dashed border-neutral-300 p-4 dark:border-neutral-700">
                  <p className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-200">
                    Chọn nhiều ảnh từ máy
                  </p>
                  <p className="mb-3 text-xs text-neutral-500 dark:text-neutral-400">
                    Bạn có thể chọn và upload nhiều ảnh cho một concept để khách hàng dễ hình dung.
                  </p>

                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full text-sm"
                  />

                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={uploadFilesToCloudinary}
                      disabled={uploading || selectedFiles.length === 0}
                      className="rounded-2xl border border-neutral-200 px-4 py-2.5 text-sm font-semibold transition hover:bg-neutral-100 disabled:opacity-60 dark:border-neutral-700 dark:hover:bg-neutral-800"
                    >
                      {uploading ? 'Đang upload...' : 'Upload ảnh'}
                    </button>

                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      Đã chọn {selectedFiles.length} file
                    </span>
                  </div>
                </div>

                {images.length > 0 && (
                  <div className="rounded-2xl border border-neutral-200 p-4 dark:border-neutral-700">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                          Ảnh đã upload: {images.length}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-4 rounded-2xl bg-neutral-50 p-3 dark:bg-neutral-950">
                      <button
                        type="button"
                        onClick={() => openImageViewer(images, 0, 'form')}
                        className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border dark:border-neutral-700"
                      >
                        <img
                          src={images[0]?.url || images[0]}
                          alt="Cover"
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute bottom-1 right-1 rounded bg-black/70 px-2 py-1 text-[10px] text-white">
                          {images.length} ảnh
                        </div>
                      </button>

                      <div className="flex-1">
                        <p className="font-medium dark:text-white">
                          {formData.name || 'Concept chưa đặt tên'}
                        </p>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                          Ảnh đầu tiên đang được dùng làm ảnh đại diện.
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 max-h-52 space-y-2 overflow-y-auto pr-1">
                      {images.map((img, index) => {
                        const imgObj = normalizeImage(img, index)
                        return (
                          <div
                            key={imgObj.publicId || imgObj.url || index}
                            className="flex items-center justify-between rounded-xl border border-neutral-200 p-2 dark:border-neutral-700"
                          >
                            <button
                              type="button"
                              onClick={() => openImageViewer(images, index, 'form')}
                              className="line-clamp-1 pr-3 text-left text-sm text-neutral-700 hover:underline dark:text-neutral-200"
                            >
                              {imgObj.caption}
                            </button>

                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="text-xs font-semibold text-red-600"
                            >
                              Xóa
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                <InputField label="Mô tả concept">
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Mô tả ngắn gọn về concept..."
                    className="min-h-[120px] w-full break-words whitespace-pre-wrap rounded-2xl border border-neutral-200 px-4 py-3 transition focus:border-yellow-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950"
                  />
                </InputField>

                <InputField label="Tags">
                  <input
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    placeholder="romantic, outdoor, sunset..."
                    className="w-full break-words rounded-2xl border border-neutral-200 px-4 py-3 transition focus:border-yellow-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950"
                  />
                </InputField>

                <div>
                  <p className="mb-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Liên kết dịch vụ
                  </p>

                  <div className="max-h-60 space-y-2 overflow-y-auto rounded-2xl border border-neutral-200 p-4 dark:border-neutral-700 dark:bg-neutral-950">
                    {services.map((service) => (
                      <label
                        key={service._id}
                        className="flex items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-sm transition hover:border-neutral-200 hover:bg-neutral-50 dark:hover:border-neutral-700 dark:hover:bg-neutral-900"
                      >
                        <input
                          type="checkbox"
                          checked={formData.relatedServices.includes(service._id)}
                          onChange={() => handleServiceToggle(service._id)}
                          className="h-4 w-4 rounded"
                        />
                        <span>{service.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <label className="flex items-center gap-3 rounded-2xl border border-neutral-200 px-4 py-4 text-sm text-neutral-700 dark:border-neutral-700 dark:text-neutral-300">
                  <input
                    type="checkbox"
                    name="isFeatured"
                    checked={formData.isFeatured}
                    onChange={handleChange}
                    className="h-4 w-4 rounded"
                  />
                  Đánh dấu là concept nổi bật
                </label>
              </div>

              <div className="mt-auto flex gap-3 pt-6">
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-60 dark:bg-yellow-700 dark:hover:bg-yellow-800"
                >
                  {saving
                    ? 'Đang lưu...'
                    : editingId
                    ? 'Cập nhật concept'
                    : 'Thêm concept'}
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-2xl border border-neutral-200 px-5 py-3 text-sm font-semibold transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                >
                  Làm mới
                </button>
              </div>
            </form>
          </div>

          <div className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm transition duration-300 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-neutral-500 dark:text-neutral-400">
                  Concept Library
                </p>
                <h2 className="mt-2 text-2xl font-semibold">Danh sách concept</h2>
                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
                  Quản lý, tìm kiếm và chỉnh sửa nhanh các concept hiện có.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="Tìm theo tên, category..."
                  className="rounded-2xl border border-neutral-200 px-4 py-3 text-sm transition focus:border-yellow-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950"
                />

                <select
                  value={featuredFilter}
                  onChange={(e) => setFeaturedFilter(e.target.value)}
                  className="rounded-2xl border border-neutral-200 px-4 py-3 text-sm transition focus:border-yellow-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950"
                >
                  <option value="all">Tất cả concept</option>
                  <option value="featured">Chỉ concept nổi bật</option>
                  <option value="normal">Chỉ concept thường</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="py-16 text-center text-neutral-500 dark:text-neutral-400">
                Đang tải concept...
              </div>
            ) : filteredConcepts.length === 0 ? (
              <div className="py-16 text-center text-neutral-500 dark:text-neutral-400">
                Không có concept nào phù hợp.
              </div>
            ) : (
              <div className="mt-6 grid gap-5 lg:grid-cols-2 xl:grid-cols-2">
                {filteredConcepts.map((concept) => {
                  // Đảm bảo tương thích ngược nếu data cũ chỉ có 1 ảnh string
                  const conceptImages = Array.isArray(concept.images) ? concept.images : concept.image ? [concept.image] : []
                  const coverImage = conceptImages[0]?.url || conceptImages[0]

                  return (
                    <div
                      key={concept._id}
                      className="group flex h-full flex-col overflow-hidden rounded-[24px] border border-neutral-200 bg-gradient-to-br from-white to-neutral-50 p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-neutral-800 dark:from-neutral-900 dark:to-neutral-950"
                    >
                      <button
                        type="button"
                        onClick={() => setPreviewConcept(concept)}
                        className="relative block w-full overflow-hidden rounded-2xl"
                      >
                        <img
                          src={coverImage}
                          alt={concept.name}
                          className="h-56 w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                        <div className="absolute bottom-2 right-2 rounded-lg bg-black/70 px-2 py-1 text-xs font-semibold text-white backdrop-blur-md">
                          {conceptImages.length} ảnh
                        </div>
                      </button>

                      <div className="mt-4 flex flex-1 flex-col">
                        <div className="flex items-center gap-2">
                          <p className="text-xs uppercase tracking-widest text-yellow-700 dark:text-yellow-400">
                            {concept.category}
                          </p>
                          {concept.isFeatured && (
                            <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:ring-yellow-500/30">
                              Nổi bật
                            </span>
                          )}
                        </div>

                        <h3 className="break-words mt-2 text-lg font-semibold">{concept.name}</h3>

                        <p className="mt-2 line-clamp-3 break-words whitespace-pre-wrap text-sm text-neutral-600 dark:text-neutral-300">
                          {concept.description}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {concept.tags?.map((tag) => (
                            <span
                              key={tag}
                              className="break-words rounded-full border border-neutral-200 px-2.5 py-1 text-xs text-neutral-600 dark:border-neutral-700 dark:text-neutral-300"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>

                        <div className="mt-4">
                          <p className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                            Dịch vụ liên kết
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {concept.relatedServices?.length > 0 ? (
                              concept.relatedServices.map((service) => (
                                <span
                                  key={service._id || service}
                                  className="break-words rounded-full bg-neutral-100 px-2.5 py-1 text-xs text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
                                >
                                  {service.name || service}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                Chưa liên kết dịch vụ
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mt-auto flex justify-end gap-2 pt-5">
                          <button
                            onClick={() => handleEdit(concept)}
                            className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                          >
                            Sửa
                          </button>

                          <button
                            onClick={() => handleDelete(concept._id)}
                            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                          >
                            Ẩn
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {previewConcept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-3xl bg-white dark:bg-neutral-900">
            <div className="flex items-center justify-between border-b p-5 dark:border-neutral-800">
              <div>
                <h2 className="text-2xl font-bold dark:text-white">
                  {previewConcept.name}
                </h2>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  {previewConcept.category} • Tổng ảnh: {(previewConcept.images || (previewConcept.image ? [previewConcept.image] : [])).length}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPreviewConcept(null)}
                className="rounded-2xl border px-4 py-2 text-sm font-medium dark:border-neutral-700 dark:text-white"
              >
                Đóng
              </button>
            </div>

            {/* Render Grid Ảnh của Concept */}
            <div className="grid max-h-[75vh] grid-cols-2 gap-3 overflow-y-auto p-4 sm:grid-cols-3 lg:grid-cols-5">
              {(previewConcept.images || (previewConcept.image ? [previewConcept.image] : [])).map((img, index) => {
                const imgObj = normalizeImage(img, index)
                return (
                  <button
                    type="button"
                    key={imgObj.publicId || imgObj.url || index}
                    onClick={() => openImageViewer(previewConcept.images || [previewConcept.image], index, 'concept')}
                    className="overflow-hidden rounded-2xl border text-left transition hover:shadow-md dark:border-neutral-700"
                  >
                    <img
                      src={imgObj.url}
                      alt={imgObj.caption}
                      className="h-40 w-full object-cover"
                    />
                    <div className="p-2">
                      <p className="line-clamp-1 text-xs text-neutral-600 dark:text-neutral-300">
                        {imgObj.caption}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Trình xem ảnh Fullscreen */}
      {viewerOpen && viewerImages.length > 0 && (
        <div className="fixed inset-0 z-[60] bg-black/90 p-4">
          <div className="mx-auto flex h-full max-w-6xl flex-col">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="text-white">
                <p className="text-sm text-neutral-300">
                  {viewerIndex + 1} / {viewerImages.length}
                </p>
                <h3 className="text-lg font-semibold">
                  {currentViewerImage?.caption || 'Xem ảnh'}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDeleteViewerImage}
                  className="rounded-2xl bg-red-600 px-4 py-2 text-sm font-medium text-white"
                >
                  Xóa ảnh
                </button>

                <button
                  type="button"
                  onClick={closeImageViewer}
                  className="rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white"
                >
                  Đóng
                </button>
              </div>
            </div>

            <div className="relative flex flex-1 items-center justify-center">
              <button
                type="button"
                onClick={showPrevImage}
                className="absolute left-2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/20"
              >
                ←
              </button>

              <img
                src={currentViewerImage?.url}
                alt={currentViewerImage?.caption || 'preview'}
                className="max-h-[75vh] max-w-full rounded-xl object-contain"
              />

              <button
                type="button"
                onClick={showNextImage}
                className="absolute right-2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/20"
              >
                →
              </button>
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
              {viewerImages.map((img, index) => (
                <button
                  key={`${img.url}-${index}`}
                  type="button"
                  onClick={() => setViewerIndex(index)}
                  className={`overflow-hidden rounded-lg border ${
                    viewerIndex === index
                      ? 'border-yellow-500 ring-2 ring-yellow-500'
                      : 'border-white/20'
                  }`}
                >
                  <img src={img.url} alt={img.caption} className="h-16 w-16 object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminConceptsPage