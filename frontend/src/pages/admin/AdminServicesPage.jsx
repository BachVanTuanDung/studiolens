import { useEffect, useMemo, useRef, useState } from 'react'
import imageCompression from 'browser-image-compression'
import toast from 'react-hot-toast'
import {
  createService,
  deleteService,
  getServices,
  updateService,
} from '../../api/serviceApi'

const initialForm = {
  name: '',
  price: '',
  description: '',
  category: 'portrait',
  features: '',
  isFeatured: false,
}

const CATEGORY_OPTIONS = [
  { value: 'wedding', label: 'Wedding' },
  { value: 'portrait', label: 'Portrait' },
  { value: 'fashion', label: 'Fashion' },
  { value: 'family', label: 'Family' },
  { value: 'event', label: 'Event' },
  { value: 'editorial', label: 'Editorial' },
]

const CLOUD_NAME = 'dzhjqp5hh'
const UPLOAD_PRESET = 'anh_test'
const MAX_FILE_SIZE_MB = 10

const formatCurrency = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`

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

const AdminServicesPage = () => {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [editingId, setEditingId] = useState('')
  const [formData, setFormData] = useState(initialForm)

  const [selectedFile, setSelectedFile] = useState(null)
  const [thumbnailPreview, setThumbnailPreview] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [featuredFilter, setFeaturedFilter] = useState('all')
  const [previewService, setPreviewService] = useState(null)

  const fileInputRef = useRef(null)

  const fetchServices = async () => {
    try {
      setLoading(true)
      const res = await getServices()
      setServices(res.data?.data || [])
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.message || 'Không thể tải danh sách dịch vụ')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchServices()
  }, [])

  const stats = useMemo(() => {
    return {
      total: services.length,
      featured: services.filter((item) => item.isFeatured).length,
      categories: new Set(services.map((item) => item.category).filter(Boolean)).size,
      avgPrice:
        services.length > 0
          ? Math.round(
              services.reduce((sum, item) => sum + Number(item.price || 0), 0) / services.length
            )
          : 0,
    }
  }, [services])

  const filteredServices = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase()

    return services.filter((service) => {
      const matchesKeyword =
        !keyword ||
        service.name?.toLowerCase().includes(keyword) ||
        service.category?.toLowerCase().includes(keyword) ||
        service.description?.toLowerCase().includes(keyword)

      const matchesFeatured =
        featuredFilter === 'all'
          ? true
          : featuredFilter === 'featured'
          ? service.isFeatured
          : !service.isFeatured

      return matchesKeyword && matchesFeatured
    })
  }, [services, searchKeyword, featuredFilter])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const resetForm = () => {
    setFormData(initialForm)
    setEditingId('')
    setSelectedFile(null)
    setThumbnailPreview('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const maxBytes = MAX_FILE_SIZE_MB * 1024 * 1024

    if (file.size > maxBytes) {
      toast.error(`Ảnh vượt quá ${MAX_FILE_SIZE_MB}MB, vui lòng chọn ảnh nhỏ hơn`)
      return
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh hợp lệ')
      return
    }

    setSelectedFile(file)
    setThumbnailPreview(URL.createObjectURL(file))
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

  const uploadThumbnailToCloudinary = async () => {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      toast.error('Thiếu cấu hình Cloudinary')
      return thumbnailPreview
    }

    if (!selectedFile) {
      return thumbnailPreview
    }

    setUploading(true)

    try {
      const file = await compressFile(selectedFile)

      const body = new FormData()
      body.append('file', file)
      body.append('upload_preset', UPLOAD_PRESET)
      body.append('folder', 'studiolens/services')

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

      toast.success('Upload ảnh thumbnail thành công')
      return data.secure_url
    } catch (error) {
      console.error(error)
      toast.error(error.message || 'Upload ảnh thất bại')
      return thumbnailPreview
    } finally {
      setUploading(false)
    }
  }

  const handleEdit = (service) => {
    setEditingId(service._id)
    setFormData({
      name: service.name || '',
      price: service.price || '',
      description: service.description || '',
      category: service.category || 'portrait',
      features: Array.isArray(service.features) ? service.features.join(', ') : '',
      isFeatured: !!service.isFeatured,
    })

    setSelectedFile(null)
    setThumbnailPreview(service.thumbnail || '')
    if (fileInputRef.current) fileInputRef.current.value = ''

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name || !formData.category || !formData.price) {
      toast.error('Vui lòng nhập đầy đủ Tên, Giá và Danh mục')
      return
    }

    try {
      setSaving(true)

      let finalThumbnail = thumbnailPreview || ''

      if (selectedFile) {
        finalThumbnail = await uploadThumbnailToCloudinary()
      }

      const payload = {
        name: formData.name,
        price: Number(formData.price),
        description: formData.description,
        category: formData.category,
        thumbnail: finalThumbnail,
        features: formData.features
          ? formData.features.split(',').map((item) => item.trim()).filter(Boolean)
          : [],
        isFeatured: !!formData.isFeatured,
      }

      if (editingId) {
        const res = await updateService(editingId, payload)
        const updated = res.data?.data
        setServices((prev) => prev.map((item) => (item._id === editingId ? updated : item)))
        toast.success('Cập nhật dịch vụ thành công')
      } else {
        const res = await createService(payload)
        const created = res.data?.data
        setServices((prev) => [created, ...prev])
        toast.success('Thêm dịch vụ thành công')
      }

      resetForm()
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.message || 'Lưu dịch vụ thất bại')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    const confirmed = window.confirm('Bạn có chắc muốn xóa dịch vụ này không?')
    if (!confirmed) return

    try {
      await deleteService(id)
      setServices((prev) => prev.filter((item) => item._id !== id))
      toast.success('Đã xóa dịch vụ')
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.message || 'Xóa dịch vụ thất bại')
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 dark:text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-yellow-700 dark:text-yellow-400">
            Quản lý dịch vụ
          </p>
          <div className="mt-3 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h1 className="text-5xl font-bold tracking-tight">Dịch vụ studio</h1>
              <p className="mt-3 max-w-3xl text-neutral-600 dark:text-neutral-300">
                Thêm, chỉnh sửa và quản lý các gói dịch vụ với thumbnail upload trực tiếp
                từ máy tính, preview đẹp mắt và trải nghiệm quản trị hiện đại hơn.
              </p>
            </div>

            <div className="inline-flex rounded-full border border-yellow-200 bg-yellow-50 px-4 py-2 text-sm font-medium text-yellow-800 dark:border-yellow-900/40 dark:bg-yellow-900/20 dark:text-yellow-300">
              Service control panel
            </div>
          </div>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Tổng dịch vụ" value={stats.total} tone="neutral" />
          <StatCard title="Dịch vụ nổi bật" value={stats.featured} tone="yellow" />
          <StatCard title="Danh mục đang có" value={stats.categories} tone="blue" />
          <StatCard title="Giá trung bình" value={formatCurrency(stats.avgPrice)} tone="green" />
        </div>

        <div className="grid gap-8 xl:grid-cols-[460px_1fr]">
          <div className="flex h-full flex-col rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm transition duration-300 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-yellow-700 dark:text-yellow-400">
                  Service Editor
                </p>
                <h2 className="mt-2 text-2xl font-semibold">
                  {editingId ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ mới'}
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
                <InputField label="Tên dịch vụ" required>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Ví dụ: Chụp ảnh cưới ngoại cảnh"
                    className="w-full rounded-2xl border border-neutral-200 px-4 py-3 transition focus:border-yellow-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950"
                  />
                </InputField>

                <div className="grid gap-4 md:grid-cols-2">
                  <InputField label="Giá" required>
                    <input
                      name="price"
                      type="number"
                      value={formData.price}
                      onChange={handleChange}
                      placeholder="3000000"
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
                      {CATEGORY_OPTIONS.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </InputField>
                </div>

                <InputField label="Thumbnail từ máy tính">
                  <div className="rounded-2xl border border-dashed border-neutral-300 p-4 dark:border-neutral-700">
                    <p className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-200">
                      Chọn 1 ảnh thumbnail
                    </p>
                    <p className="mb-3 text-xs text-neutral-500 dark:text-neutral-400">
                      Ảnh sẽ được nén và upload lên Cloudinary, giống flow gallery.
                    </p>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="w-full text-sm"
                    />

                    <div className="mt-4 overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950">
                      {thumbnailPreview ? (
                        <img
                          src={thumbnailPreview}
                          alt="Thumbnail preview"
                          className="h-56 w-full object-cover transition duration-500 hover:scale-[1.02]"
                        />
                      ) : (
                        <div className="flex h-56 items-center justify-center text-sm text-neutral-400">
                          Chưa chọn ảnh thumbnail
                        </div>
                      )}
                    </div>
                  </div>
                </InputField>

                <InputField label="Mô tả dịch vụ">
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Mô tả ngắn gọn về dịch vụ..."
                    className="min-h-[120px] w-full break-words whitespace-pre-wrap rounded-2xl border border-neutral-200 px-4 py-3 transition focus:border-yellow-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950"
                  />
                </InputField>

                <InputField label="Tính năng nổi bật">
                  <textarea
                    name="features"
                    value={formData.features}
                    onChange={handleChange}
                    placeholder="Makeup, Chỉnh màu, In ảnh... (cách nhau bởi dấu phẩy)"
                    className="min-h-[100px] w-full break-words whitespace-pre-wrap rounded-2xl border border-neutral-200 px-4 py-3 transition focus:border-yellow-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950"
                  />
                </InputField>

                <label className="flex items-center gap-3 rounded-2xl border border-neutral-200 px-4 py-4 text-sm text-neutral-700 dark:border-neutral-700 dark:text-neutral-300">
                  <input
                    type="checkbox"
                    name="isFeatured"
                    checked={formData.isFeatured}
                    onChange={handleChange}
                    className="h-4 w-4 rounded"
                  />
                  Đánh dấu là dịch vụ nổi bật
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
                    ? 'Cập nhật dịch vụ'
                    : 'Thêm dịch vụ'}
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
                  Service Library
                </p>
                <h2 className="mt-2 text-2xl font-semibold">Danh sách dịch vụ</h2>
                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
                  Quản lý, tìm kiếm và chỉnh sửa nhanh các gói dịch vụ hiện có.
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
                  <option value="all">Tất cả dịch vụ</option>
                  <option value="featured">Chỉ dịch vụ nổi bật</option>
                  <option value="normal">Chỉ dịch vụ thường</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="py-16 text-center text-neutral-500 dark:text-neutral-400">
                Đang tải dịch vụ...
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="py-16 text-center text-neutral-500 dark:text-neutral-400">
                Không có dịch vụ nào phù hợp.
              </div>
            ) : (
              <div className="mt-6 grid gap-5 lg:grid-cols-2">
                {filteredServices.map((service) => (
                  <div
                    key={service._id}
                    className="group flex h-full flex-col overflow-hidden rounded-[24px] border border-neutral-200 bg-gradient-to-br from-white to-neutral-50 p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-neutral-800 dark:from-neutral-900 dark:to-neutral-950"
                  >
                    <button
                      type="button"
                      onClick={() => setPreviewService(service)}
                      className="block w-full overflow-hidden rounded-2xl"
                    >
                      <img
                        src={service.thumbnail}
                        alt={service.name}
                        className="h-52 w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    </button>

                    <div className="mt-4 flex flex-1 flex-col">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="break-words text-xl font-semibold">{service.name}</h3>
                        {service.isFeatured && (
                          <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-800 ring-1 ring-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:ring-yellow-500/30">
                            Nổi bật
                          </span>
                        )}
                      </div>

                      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                        {service.category}
                      </p>

                      <p className="mt-3 line-clamp-3 break-words whitespace-pre-wrap text-sm text-neutral-600 dark:text-neutral-300">
                        {service.description}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {service.features?.map((feature) => (
                          <span
                            key={feature}
                            className="break-words rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-600 dark:border-neutral-700 dark:text-neutral-300"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>

                      {/* Phần footer được đẩy xuống đáy nhờ mt-auto */}
                      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                        <div>
                          <p className="text-lg font-bold text-yellow-700 dark:text-yellow-400">
                            {formatCurrency(service.price)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(service)}
                            className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                          >
                            Sửa
                          </button>

                          <button
                            onClick={() => handleDelete(service._id)}
                            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {previewService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-4xl overflow-hidden rounded-3xl bg-white dark:bg-neutral-900">
            <div className="flex items-center justify-between border-b p-5 dark:border-neutral-800">
              <div>
                <h2 className="break-words text-2xl font-bold dark:text-white">
                  {previewService.name}
                </h2>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  {previewService.category} • {formatCurrency(previewService.price)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPreviewService(null)}
                className="rounded-xl border px-4 py-2 text-sm font-medium dark:border-neutral-700 dark:text-white"
              >
                Đóng
              </button>
            </div>

            <div className="grid gap-0 lg:grid-cols-[1fr_0.95fr]">
              <div className="bg-neutral-100 dark:bg-neutral-950">
                <img
                  src={previewService.thumbnail}
                  alt={previewService.name}
                  className="h-full max-h-[520px] w-full object-cover"
                />
              </div>

              <div className="p-6">
                <div className="flex flex-wrap items-center gap-2">
                  {previewService.isFeatured && (
                    <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800 ring-1 ring-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:ring-yellow-500/30">
                      Dịch vụ nổi bật
                    </span>
                  )}
                </div>

                <p className="mt-4 break-words whitespace-pre-wrap text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                  {previewService.description || 'Không có mô tả'}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {previewService.features?.map((feature) => (
                    <span
                      key={feature}
                      className="break-words rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-600 dark:border-neutral-700 dark:text-neutral-300"
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewService(null)
                      handleEdit(previewService)
                    }}
                    className="rounded-2xl bg-yellow-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-yellow-800"
                  >
                    Chỉnh sửa dịch vụ này
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminServicesPage