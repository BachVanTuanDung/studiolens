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
  slug: '',
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

  const [selectedFile, setSelectedFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [featuredFilter, setFeaturedFilter] = useState('all')
  const [previewConcept, setPreviewConcept] = useState(null)

  const fileInputRef = useRef(null)

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
        concept.slug?.toLowerCase().includes(keyword) ||
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

  const resetForm = () => {
    setFormData(initialForm)
    setEditingId('')
    setSelectedFile(null)
    setImagePreview('')
    if (fileInputRef.current) fileInputRef.current.value = ''
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
    setImagePreview(URL.createObjectURL(file))
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

  const uploadImageToCloudinary = async () => {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      toast.error('Thiếu cấu hình Cloudinary')
      return imagePreview
    }

    if (!selectedFile) {
      return imagePreview
    }

    setUploading(true)

    try {
      const file = await compressFile(selectedFile)

      const body = new FormData()
      body.append('file', file)
      body.append('upload_preset', UPLOAD_PRESET)
      body.append('folder', 'studiolens/concepts')

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

      toast.success('Upload ảnh concept thành công')
      return data.secure_url
    } catch (error) {
      console.error(error)
      toast.error(error.message || 'Upload ảnh thất bại')
      return imagePreview
    } finally {
      setUploading(false)
    }
  }

  const handleEdit = (concept) => {
    setEditingId(concept._id)
    setFormData({
      name: concept.name || '',
      slug: concept.slug || '',
      description: concept.description || '',
      category: concept.category || 'studio',
      tags: Array.isArray(concept.tags) ? concept.tags.join(', ') : '',
      relatedServices: Array.isArray(concept.relatedServices)
        ? concept.relatedServices.map((item) => item._id || item)
        : [],
      isFeatured: !!concept.isFeatured,
    })

    setSelectedFile(null)
    setImagePreview(concept.image || '')
    if (fileInputRef.current) fileInputRef.current.value = ''

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name || !formData.slug || !formData.category) {
      toast.error('Vui lòng nhập đầy đủ các trường bắt buộc')
      return
    }

    try {
      setSaving(true)

      let finalImage = imagePreview || ''

      if (selectedFile) {
        finalImage = await uploadImageToCloudinary()
      }

      if (!finalImage) {
        toast.error('Vui lòng chọn ảnh concept')
        return
      }

      const payload = {
        ...formData,
        image: finalImage,
        tags: formData.tags
          ? formData.tags.split(',').map((item) => item.trim()).filter(Boolean)
          : [],
      }

      if (editingId) {
        const res = await updateConcept(editingId, payload)
        const updated = res.data?.data

        setConcepts((prev) =>
          prev.map((item) => (item._id === editingId ? updated : item))
        )
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
                Thêm, chỉnh sửa và quản lý các concept với ảnh upload trực tiếp từ máy tính,
                giao diện đồng bộ với phần dịch vụ và trải nghiệm quản trị hiện đại hơn.
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
          <div className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm transition duration-300 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
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

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <InputField label="Tên concept" required>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ví dụ: Romantic Outdoor"
                  className="w-full rounded-2xl border border-neutral-200 px-4 py-3 transition focus:border-yellow-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950"
                />
              </InputField>

              <InputField label="Slug" required>
                <input
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  placeholder="romantic-outdoor"
                  className="w-full rounded-2xl border border-neutral-200 px-4 py-3 transition focus:border-yellow-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950"
                />
              </InputField>

              <InputField label="Ảnh concept từ máy tính">
                <div className="rounded-2xl border border-dashed border-neutral-300 p-4 dark:border-neutral-700">
                  <p className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-200">
                    Chọn 1 ảnh concept
                  </p>
                  <p className="mb-3 text-xs text-neutral-500 dark:text-neutral-400">
                    Ảnh sẽ được nén và upload lên Cloudinary giống flow gallery và dịch vụ.
                  </p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full text-sm"
                  />

                  <div className="mt-4 overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Concept preview"
                        className="h-56 w-full object-cover transition duration-500 hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="flex h-56 items-center justify-center text-sm text-neutral-400">
                        Chưa chọn ảnh concept
                      </div>
                    )}
                  </div>
                </div>
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

              <InputField label="Mô tả concept">
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Mô tả ngắn gọn về concept..."
                  className="min-h-[120px] w-full rounded-2xl border border-neutral-200 px-4 py-3 transition focus:border-yellow-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950"
                />
              </InputField>

              <InputField label="Tags">
                <input
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="romantic, outdoor, sunset..."
                  className="w-full rounded-2xl border border-neutral-200 px-4 py-3 transition focus:border-yellow-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950"
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

              <div className="flex gap-3 pt-2">
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
                  placeholder="Tìm theo tên, slug, category..."
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
              <div className="mt-6 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
                {filteredConcepts.map((concept) => (
                  <div
                    key={concept._id}
                    className="group overflow-hidden rounded-[24px] border border-neutral-200 bg-gradient-to-br from-white to-neutral-50 p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-neutral-800 dark:from-neutral-900 dark:to-neutral-950"
                  >
                    <button
                      type="button"
                      onClick={() => setPreviewConcept(concept)}
                      className="block w-full overflow-hidden rounded-2xl"
                    >
                      <img
                        src={concept.image}
                        alt={concept.name}
                        className="h-56 w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    </button>

                    <div className="mt-4">
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

                      <h3 className="mt-2 text-lg font-semibold">{concept.name}</h3>

                      <p className="mt-2 line-clamp-3 text-sm text-neutral-600 dark:text-neutral-300">
                        {concept.description}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {concept.tags?.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-neutral-200 px-2.5 py-1 text-xs text-neutral-600 dark:border-neutral-700 dark:text-neutral-300"
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
                                className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
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

                      <div className="mt-5 flex gap-2">
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
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {previewConcept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-5xl overflow-hidden rounded-3xl bg-white dark:bg-neutral-900">
            <div className="flex items-center justify-between border-b p-5 dark:border-neutral-800">
              <div>
                <h2 className="text-2xl font-bold dark:text-white">{previewConcept.name}</h2>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  {previewConcept.category}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPreviewConcept(null)}
                className="rounded-xl border px-4 py-2 text-sm font-medium dark:border-neutral-700 dark:text-white"
              >
                Đóng
              </button>
            </div>

            <div className="grid gap-0 lg:grid-cols-[1fr_0.95fr]">
              <div className="bg-neutral-100 dark:bg-neutral-950">
                <img
                  src={previewConcept.image}
                  alt={previewConcept.name}
                  className="h-full max-h-[560px] w-full object-cover"
                />
              </div>

              <div className="p-6">
                <div className="flex flex-wrap items-center gap-2">
                  {previewConcept.isFeatured && (
                    <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800 ring-1 ring-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:ring-yellow-500/30">
                      Concept nổi bật
                    </span>
                  )}
                </div>

                <p className="mt-4 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                  {previewConcept.description || 'Không có mô tả'}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {previewConcept.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-600 dark:border-neutral-700 dark:text-neutral-300"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="mt-6">
                  <p className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    Dịch vụ liên kết
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {previewConcept.relatedServices?.length > 0 ? (
                      previewConcept.relatedServices.map((service) => (
                        <span
                          key={service._id || service}
                          className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
                        >
                          {service.name || service}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-neutral-500 dark:text-neutral-400">
                        Chưa liên kết dịch vụ
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewConcept(null)
                      handleEdit(previewConcept)
                    }}
                    className="rounded-2xl bg-yellow-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-yellow-800"
                  >
                    Chỉnh sửa concept này
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

export default AdminConceptsPage