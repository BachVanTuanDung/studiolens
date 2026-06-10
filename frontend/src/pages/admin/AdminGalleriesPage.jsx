import { useEffect, useMemo, useState } from 'react'
import imageCompression from 'browser-image-compression'
import toast from 'react-hot-toast'
import {
  createGallery,
  deleteGallery,
  getAllGalleries,
  updateGallery,
} from '../../api/galleryApi'
import { searchUsers } from '../../api/userApi'

const initialForm = {
  customerId: '',
  title: '',
  description: '',
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

const InputField = ({ label, children }) => (
  <div>
    <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
      {label}
    </label>
    {children}
  </div>
)

const AdminGalleriesPage = () => {
  const [galleries, setGalleries] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [editingId, setEditingId] = useState('')
  const [formData, setFormData] = useState(initialForm)
  const [images, setImages] = useState([])
  const [selectedFiles, setSelectedFiles] = useState([])

  const [previewGallery, setPreviewGallery] = useState(null)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerImages, setViewerImages] = useState([])
  const [viewerIndex, setViewerIndex] = useState(0)
  const [viewerSource, setViewerSource] = useState('gallery')

  const [searchKeyword, setSearchKeyword] = useState('')

  const fetchData = async () => {
    try {
      setLoading(true)

      const [galleryRes, userRes] = await Promise.all([
        getAllGalleries(),
        searchUsers(),
      ])

      setGalleries(galleryRes.data?.data || galleryRes.data?.galleries || [])
      setUsers(userRes.data?.data || userRes.data?.users || [])
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.message || 'Không thể tải dữ liệu gallery')
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
    const total = galleries.length
    const totalImages = galleries.reduce(
      (sum, item) => sum + (Array.isArray(item.images) ? item.images.length : 0),
      0
    )

    return { total, totalImages }
  }, [galleries])

  const filteredGalleries = useMemo(() => {
    return galleries.filter((gallery) => {
      const keyword = searchKeyword.trim().toLowerCase()

      return (
        !keyword ||
        gallery.title?.toLowerCase().includes(keyword) ||
        gallery.description?.toLowerCase().includes(keyword) ||
        gallery.customerId?.name?.toLowerCase().includes(keyword) ||
        gallery.customerId?.email?.toLowerCase().includes(keyword)
      )
    })
  }, [galleries, searchKeyword])

  const normalizeImage = (img, index) => {
    const imageUrl = typeof img === 'string' ? img : img.url
    const caption =
      typeof img === 'string' ? `Ảnh ${index + 1}` : img.caption || `Ảnh ${index + 1}`

    return {
      ...(typeof img === 'string' ? {} : img),
      url: imageUrl,
      caption,
    }
  }

  const resetForm = () => {
    setFormData(initialForm)
    setEditingId('')
    setImages([])
    setSelectedFiles([])
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || [])
    const maxBytes = MAX_FILE_SIZE_MB * 1024 * 1024

    const oversizedFiles = files.filter((file) => file.size > maxBytes)
    const validFiles = files.filter((file) => file.size <= maxBytes)

    if (oversizedFiles.length > 0) {
      toast.error(
        `${oversizedFiles.length} ảnh vượt quá ${MAX_FILE_SIZE_MB}MB. Hệ thống sẽ bỏ qua các ảnh này.`
      )
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

      return new File([compressedFile], file.name, {
        type: compressedFile.type,
      })
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
        body.append('folder', 'studiolens/galleries')

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
          {
            method: 'POST',
            body,
          }
        )

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data?.error?.message || 'Upload ảnh thất bại')
        }

        uploaded.push({
          url: data.secure_url,
          publicId: data.public_id,
          caption: originalFile.name,
          filename: originalFile.name,
          code: originalFile.name.replace(/\.[^.]+$/, ''),
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

  const handleEdit = (gallery) => {
    setEditingId(gallery._id)
    setFormData({
      customerId: gallery.customerId?._id || gallery.customerId || '',
      title: gallery.title || '',
      description: gallery.description || '',
    })
    setImages(gallery.images || [])
    setSelectedFiles([])
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.customerId || !formData.title) {
      toast.error('Vui lòng nhập khách hàng và tiêu đề album')
      return
    }

    let finalImages = images

    if (selectedFiles.length > 0) {
      finalImages = await uploadFilesToCloudinary()
    }

    if (!finalImages.length) {
      toast.error('Vui lòng upload ít nhất 1 ảnh')
      return
    }

    try {
      setSaving(true)

      const payload = {
        customerId: formData.customerId,
        title: formData.title,
        description: formData.description,
        images: finalImages,
      }

      if (editingId) {
        await updateGallery(editingId, payload)
        toast.success('Cập nhật gallery thành công')
      } else {
        await createGallery(payload)
        toast.success('Tạo gallery thành công')
      }

      resetForm()
      await fetchData()
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.message || 'Lưu gallery thất bại')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    const confirmed = window.confirm('Bạn có chắc muốn xóa gallery này không?')
    if (!confirmed) return

    try {
      await deleteGallery(id)
      setGalleries((prev) => prev.filter((item) => item._id !== id))
      toast.success('Xóa gallery thành công')
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.message || 'Xóa gallery thất bại')
    }
  }

  const openImageViewer = (imageList = [], startIndex = 0, source = 'gallery') => {
    const normalized = imageList.map((img, index) => normalizeImage(img, index))
    setViewerImages(normalized)
    setViewerIndex(startIndex)
    setViewerSource(source)
    setViewerOpen(true)
  }

  const closeImageViewer = () => setViewerOpen(false)

  const showPrevImage = () => {
    setViewerIndex((prev) => (prev === 0 ? viewerImages.length - 1 : prev - 1))
  }

  const showNextImage = () => {
    setViewerIndex((prev) => (prev === viewerImages.length - 1 ? 0 : prev + 1))
  }

  const handleDeleteViewerImage = async () => {
    if (!viewerImages.length) return

    const confirmed = window.confirm('Bạn có chắc muốn xóa ảnh này không?')
    if (!confirmed) return

    const current = viewerImages[viewerIndex]

    if (viewerSource === 'form') {
      setImages((prev) =>
        prev.filter((img, index) => normalizeImage(img, index).url !== current.url)
      )

      const nextImages = viewerImages.filter((_, index) => index !== viewerIndex)
      setViewerImages(nextImages)

      if (nextImages.length === 0) {
        setViewerOpen(false)
      } else if (viewerIndex >= nextImages.length) {
        setViewerIndex(nextImages.length - 1)
      }

      toast.success('Đã xóa ảnh khỏi form hiện tại')
      return
    }

    if (viewerSource === 'gallery' && previewGallery?._id) {
      try {
        const nextGalleryImages = (previewGallery.images || []).filter((img, index) => {
          return normalizeImage(img, index).url !== current.url
        })

        await updateGallery(previewGallery._id, {
          customerId: previewGallery.customerId?._id || previewGallery.customerId,
          title: previewGallery.title,
          description: previewGallery.description,
          images: nextGalleryImages,
        })

        const updatedPreview = {
          ...previewGallery,
          images: nextGalleryImages,
        }

        setPreviewGallery(updatedPreview)
        setGalleries((prev) =>
          prev.map((gallery) =>
            gallery._id === previewGallery._id ? updatedPreview : gallery
          )
        )

        const nextImages = viewerImages.filter((_, index) => index !== viewerIndex)
        setViewerImages(nextImages)

        if (nextImages.length === 0) {
          setViewerOpen(false)
        } else if (viewerIndex >= nextImages.length) {
          setViewerIndex(nextImages.length - 1)
        }

        toast.success('Đã xóa ảnh khỏi gallery')
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
            Quản lý gallery
          </p>
          <div className="mt-3 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h1 className="text-5xl font-bold tracking-tight">Gallery khách hàng</h1>
              <p className="mt-3 max-w-3xl text-neutral-600 dark:text-neutral-300">
                Tạo album ảnh cho khách, upload nhiều ảnh, xem nhanh, xem lớn và quản lý
                gallery theo giao diện hiện đại, trực quan hơn.
              </p>
            </div>

            <div className="inline-flex rounded-full border border-yellow-200 bg-yellow-50 px-4 py-2 text-sm font-medium text-yellow-800 dark:border-yellow-900/40 dark:bg-yellow-900/20 dark:text-yellow-300">
              Gallery control panel
            </div>
          </div>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-2">
          <StatCard title="Tổng gallery" value={stats.total} tone="neutral" />
          <StatCard title="Tổng số ảnh" value={stats.totalImages} tone="yellow" />
        </div>

        <div className="grid gap-8 xl:grid-cols-[460px_1fr]">
          <div className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm transition duration-300 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-yellow-700 dark:text-yellow-400">
                  Gallery Editor
                </p>
                <h2 className="mt-2 text-2xl font-semibold">
                  {editingId ? 'Chỉnh sửa gallery' : 'Tạo gallery mới'}
                </h2>
              </div>

              {editingId ? (
                <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800 ring-1 ring-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:ring-yellow-500/30">
                  Editing
                </span>
              ) : null}
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <InputField label="Khách hàng">
                <select
                  name="customerId"
                  value={formData.customerId}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-neutral-200 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-950"
                >
                  <option value="">Chọn khách hàng</option>
                  {users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name} - {user.email}
                    </option>
                  ))}
                </select>
              </InputField>

              <InputField label="Tên album">
                <input
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Tên album"
                  className="w-full rounded-2xl border border-neutral-200 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-950"
                />
              </InputField>

              <InputField label="Mô tả">
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Mô tả album"
                  className="min-h-[100px] w-full rounded-2xl border border-neutral-200 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-950"
                />
              </InputField>

              <div className="rounded-2xl border border-dashed border-neutral-300 p-4 dark:border-neutral-700">
                <p className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-200">
                  Chọn nhiều ảnh từ máy
                </p>
                <p className="mb-3 text-xs text-neutral-500 dark:text-neutral-400">
                  Khuyên dùng ảnh JPG dưới 10MB. Hệ thống sẽ tự nén ảnh trước khi upload.
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
                      <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                        Click ảnh đại diện để xem lớn.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setPreviewGallery({
                          title: formData.title || 'Ảnh đang chuẩn bị upload',
                          images,
                        })
                      }
                      className="rounded-2xl border border-neutral-200 px-4 py-2 text-sm font-medium dark:border-neutral-700"
                    >
                      Xem ảnh
                    </button>
                  </div>

                  <div className="mt-4 flex items-center gap-4 rounded-2xl bg-neutral-50 p-3 dark:bg-neutral-950">
                    <button
                      type="button"
                      onClick={() => openImageViewer(images, 0, 'form')}
                      className="relative h-24 w-24 overflow-hidden rounded-xl border dark:border-neutral-700"
                    >
                      <img
                        src={images[0]?.url}
                        alt={images[0]?.caption || 'Ảnh đại diện'}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute bottom-1 right-1 rounded bg-black/70 px-2 py-1 text-[10px] text-white">
                        {images.length} ảnh
                      </div>
                    </button>

                    <div className="flex-1">
                      <p className="font-medium dark:text-white">
                        {formData.title || 'Album chưa đặt tên'}
                      </p>
                      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                        Ảnh đầu tiên đang được dùng làm ảnh đại diện tạm thời.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 max-h-52 space-y-2 overflow-y-auto pr-1">
                    {images.map((img, index) => (
                      <div
                        key={img.publicId || img.url || index}
                        className="flex items-center justify-between rounded-xl border border-neutral-200 p-2 dark:border-neutral-700"
                      >
                        <button
                          type="button"
                          onClick={() => openImageViewer(images, index, 'form')}
                          className="line-clamp-1 pr-3 text-left text-sm text-neutral-700 hover:underline dark:text-neutral-200"
                        >
                          {img.caption || `Ảnh ${index + 1}`}
                        </button>

                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="text-xs font-semibold text-red-600"
                        >
                          Xóa
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white disabled:opacity-60 dark:bg-yellow-700"
                >
                  {saving ? 'Đang lưu...' : editingId ? 'Cập nhật gallery' : 'Tạo gallery'}
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-2xl border border-neutral-200 px-5 py-3 text-sm font-semibold dark:border-neutral-700"
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
                  Gallery Library
                </p>
                <h2 className="mt-2 text-2xl font-semibold">Danh sách gallery</h2>
                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
                  Tìm kiếm, xem nhanh và quản lý các album ảnh của khách hàng.
                </p>
              </div>

              <div className="w-full max-w-sm">
                <input
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="Tìm theo tên album, khách hàng, email..."
                  className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                />
              </div>
            </div>

            {loading ? (
              <div className="py-16 text-center text-neutral-500 dark:text-neutral-400">
                Đang tải gallery...
              </div>
            ) : filteredGalleries.length === 0 ? (
              <div className="py-16 text-center text-neutral-500 dark:text-neutral-400">
                Không có gallery phù hợp.
              </div>
            ) : (
              <div className="mt-6 space-y-5">
                {filteredGalleries.map((gallery) => {
                  const coverImage = gallery.images?.[0]?.url || gallery.images?.[0]

                  return (
                    <div
                      key={gallery._id}
                      className="overflow-hidden rounded-[24px] border border-neutral-200 bg-gradient-to-r from-white to-neutral-50 p-4 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:border-neutral-800 dark:from-neutral-900 dark:to-neutral-950"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex gap-4">
                          <button
                            type="button"
                            onClick={() => setPreviewGallery(gallery)}
                            className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl border bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-950"
                          >
                            {coverImage ? (
                              <>
                                <img
                                  src={coverImage}
                                  alt={gallery.title}
                                  className="h-full w-full object-cover"
                                />
                                <div className="absolute bottom-1 right-1 rounded bg-black/70 px-2 py-1 text-[10px] text-white">
                                  {gallery.images?.length || 0} ảnh
                                </div>
                              </>
                            ) : (
                              <div className="flex h-full items-center justify-center text-xs text-neutral-400">
                                No image
                              </div>
                            )}
                          </button>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-xl font-semibold dark:text-white">
                                {gallery.title}
                              </h3>
                            </div>

                            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
                              {gallery.description || 'Không có mô tả'}
                            </p>

                            <div className="mt-3 flex flex-col gap-1 text-sm text-neutral-500 dark:text-neutral-400">
                              <p>
                                Khách hàng:{' '}
                                <span className="font-medium text-neutral-700 dark:text-neutral-200">
                                  {gallery.customerId?.name || '--'}
                                </span>
                              </p>
                              <p>
                                Email:{' '}
                                <span className="font-medium text-neutral-700 dark:text-neutral-200">
                                  {gallery.customerId?.email || '--'}
                                </span>
                              </p>
                              <p>
                                Số ảnh:{' '}
                                <span className="font-medium text-neutral-700 dark:text-neutral-200">
                                  {gallery.images?.length || 0}
                                </span>
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setPreviewGallery(gallery)}
                            className="rounded-2xl border border-neutral-200 px-4 py-2.5 text-sm font-medium dark:border-neutral-700"
                          >
                            Xem ảnh
                          </button>

                          <button
                            type="button"
                            onClick={() => handleEdit(gallery)}
                            className="rounded-2xl border border-neutral-200 px-4 py-2.5 text-sm font-medium dark:border-neutral-700"
                          >
                            Sửa
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(gallery._id)}
                            className="rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white"
                          >
                            Xóa
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

        {previewGallery && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-3xl bg-white dark:bg-neutral-900">
              <div className="flex items-center justify-between border-b p-5 dark:border-neutral-800">
                <div>
                  <h2 className="text-2xl font-bold dark:text-white">
                    {previewGallery.title || 'Gallery'}
                  </h2>
                  <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                    Tổng ảnh: {previewGallery.images?.length || 0}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setPreviewGallery(null)}
                  className="rounded-2xl border px-4 py-2 text-sm font-medium dark:border-neutral-700 dark:text-white"
                >
                  Đóng
                </button>
              </div>

              <div className="grid max-h-[75vh] grid-cols-2 gap-3 overflow-y-auto p-4 sm:grid-cols-3 lg:grid-cols-5">
                {previewGallery.images?.map((img, index) => {
                  const imageUrl = typeof img === 'string' ? img : img.url
                  const caption =
                    typeof img === 'string' ? `Ảnh ${index + 1}` : img.caption || `Ảnh ${index + 1}`

                  return (
                    <button
                      type="button"
                      key={img.publicId || imageUrl || index}
                      onClick={() => openImageViewer(previewGallery.images, index, 'gallery')}
                      className="overflow-hidden rounded-2xl border text-left transition hover:shadow-md dark:border-neutral-700"
                    >
                      <img
                        src={imageUrl}
                        alt={caption}
                        className="h-40 w-full object-cover"
                      />
                      <div className="p-2">
                        <p className="line-clamp-1 text-xs text-neutral-600 dark:text-neutral-300">
                          {caption}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

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
    </div>
  )
}

export default AdminGalleriesPage