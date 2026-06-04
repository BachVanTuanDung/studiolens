import { useEffect, useMemo, useState } from 'react'
import imageCompression from 'browser-image-compression'
import toast from 'react-hot-toast'
import {
  getAllSelectedImages,
  updateSelectedImagesRecord,
} from '../../api/selectedImageApi'

const CLOUD_NAME = 'dzhjqp5hh'
const UPLOAD_PRESET = 'anh_test'

const normalizeSelectedRecord = (record) => {
  const rawImages = record.selectedImages || []

  const images = rawImages.map((img, index) => {
    const url = typeof img === 'string' ? img : img.url
    const filename =
      typeof img === 'string'
        ? `image-${index + 1}.jpg`
        : img.filename || img.caption || `image-${index + 1}.jpg`

    const code =
      typeof img === 'string'
        ? filename.replace(/\.[^.]+$/, '')
        : img.code || filename.replace(/\.[^.]+$/, '')

    return {
      id: img.publicId || img._id || `${url}-${index}`,
      url,
      filename,
      code,
      note: img.note || '',
      editedUrl: img.editedUrl || '',
      editedPublicId: img.editedPublicId || '',
      status: img.editedUrl ? 'done' : 'pending',
    }
  })

  return {
    ...record,
    images,
  }
}

const statusBadgeMap = {
  pending:
    'bg-yellow-100 text-yellow-800 ring-1 ring-inset ring-yellow-200 dark:bg-yellow-500/15 dark:text-yellow-300 dark:ring-yellow-500/30',
  done:
    'bg-green-100 text-green-800 ring-1 ring-inset ring-green-200 dark:bg-green-500/15 dark:text-green-300 dark:ring-green-500/30',
}

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

const SectionCard = ({ children, className = '' }) => (
  <div
    className={`rounded-[28px] border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900 ${className}`}
  >
    {children}
  </div>
)

const FieldLabel = ({ children }) => (
  <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
    {children}
  </label>
)

const AdminSelectedImagesPage = () => {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  const [searchKeyword, setSearchKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [activeRecordId, setActiveRecordId] = useState('')
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  const [saving, setSaving] = useState(false)
  const [uploadingEdited, setUploadingEdited] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const res = await getAllSelectedImages()

        const rawData =
          res.data?.data ||
          res.data?.selectedImages ||
          res.data?.records ||
          []

        const normalized = Array.isArray(rawData)
          ? rawData.map(normalizeSelectedRecord)
          : []

        setRecords(normalized)

        if (normalized.length > 0) {
          setActiveRecordId(normalized[0]._id)
          setActiveImageIndex(0)
        }
      } catch (error) {
        console.error(error)
        toast.error(
          error.response?.data?.message || 'Không thể tải ảnh khách đã chọn'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const filteredRecords = useMemo(() => {
    return records
      .map((record) => {
        const keyword = searchKeyword.trim().toLowerCase()

        const filteredImages = record.images.filter((image) => {
          const matchesKeyword =
            !keyword ||
            record.customerId?.name?.toLowerCase().includes(keyword) ||
            record.customerId?.email?.toLowerCase().includes(keyword) ||
            record.galleryId?.title?.toLowerCase().includes(keyword) ||
            image.code.toLowerCase().includes(keyword)

          const matchesStatus =
            statusFilter === 'all' || image.status === statusFilter

          return matchesKeyword && matchesStatus
        })

        return {
          ...record,
          images: filteredImages,
        }
      })
      .filter((record) => record.images.length > 0)
  }, [records, searchKeyword, statusFilter])

  const activeRecord = useMemo(() => {
    return filteredRecords.find((item) => item._id === activeRecordId) || null
  }, [filteredRecords, activeRecordId])

  const activeImage = activeRecord?.images?.[activeImageIndex] || null

  useEffect(() => {
    if (!filteredRecords.length) {
      setActiveRecordId('')
      setActiveImageIndex(0)
      return
    }

    const stillExists = filteredRecords.some((item) => item._id === activeRecordId)

    if (!stillExists) {
      setActiveRecordId(filteredRecords[0]._id)
      setActiveImageIndex(0)
    }
  }, [filteredRecords, activeRecordId])

  useEffect(() => {
    if (!activeRecord) return
    if (activeImageIndex > activeRecord.images.length - 1) {
      setActiveImageIndex(0)
    }
  }, [activeRecord, activeImageIndex])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!activeRecord || !activeImage) return

      if (e.key === 'ArrowLeft') {
        setActiveImageIndex((prev) =>
          prev === 0 ? activeRecord.images.length - 1 : prev - 1
        )
      }

      if (e.key === 'ArrowRight') {
        setActiveImageIndex((prev) =>
          prev === activeRecord.images.length - 1 ? 0 : prev + 1
        )
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeRecord, activeImage])

  const updateImageInState = (recordId, imageCode, patch) => {
    setRecords((prev) =>
      prev.map((record) => {
        if (record._id !== recordId) return record

        return {
          ...record,
          images: record.images.map((image) =>
            image.code === imageCode ? { ...image, ...patch } : image
          ),
        }
      })
    )
  }

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code)
      toast.success(`Đã copy mã ${code}`)
    } catch (error) {
      console.error(error)
      toast.error('Không thể copy mã ảnh')
    }
  }

  const copyAllCodes = async (record) => {
    try {
      const codes = record.images.map((img) => img.code).join(', ')
      await navigator.clipboard.writeText(codes)
      toast.success('Đã copy toàn bộ mã ảnh')
    } catch (error) {
      console.error(error)
      toast.error('Không thể copy danh sách mã ảnh')
    }
  }

  const handleChangeImageNote = (value) => {
    if (!activeRecord || !activeImage) return

    updateImageInState(activeRecord._id, activeImage.code, {
      note: value,
    })
  }

  const compressFile = async (file) => {
    try {
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 1.5,
        maxWidthOrHeight: 2200,
        useWebWorker: true,
      })

      return new File([compressedFile], file.name, {
        type: compressedFile.type,
      })
    } catch (error) {
      console.error(error)
      return file
    }
  }

  const uploadEditedImageToCloudinary = async (file) => {
    const compressedFile = await compressFile(file)

    const body = new FormData()
    body.append('file', compressedFile)
    body.append('upload_preset', UPLOAD_PRESET)
    body.append('folder', 'studiolens/retouched')

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body,
      }
    )

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data?.error?.message || 'Upload ảnh chỉnh sửa thất bại')
    }

    return data.secure_url
  }

  const handleUploadEditedImage = async (file) => {
    if (!activeRecord || !activeImage || !file) return

    try {
      setUploadingEdited(true)

      const editedUrl = await uploadEditedImageToCloudinary(file)

      updateImageInState(activeRecord._id, activeImage.code, {
        editedUrl,
        status: 'done',
      })

      toast.success('Đã upload ảnh chỉnh sửa')
    } catch (error) {
      console.error(error)
      toast.error(error.message || 'Upload ảnh chỉnh sửa thất bại')
    } finally {
      setUploadingEdited(false)
    }
  }

  const handleSaveCurrentRecord = async () => {
    if (!activeRecord) return

    try {
      setSaving(true)

      const payload = {
        selectedImages: activeRecord.images.map((img) => ({
          url: img.url,
          code: img.code,
          note: img.note,
          editedUrl: img.editedUrl,
        })),
      }

      await updateSelectedImagesRecord(activeRecord._id, payload)
      toast.success('Đã lưu cập nhật ảnh chỉnh sửa')
    } catch (error) {
      console.error(error)
      toast.error(
        error.response?.data?.message ||
          'Chưa lưu được vào database. Kiểm tra API selected-images'
      )
    } finally {
      setSaving(false)
    }
  }

  const totalImages = useMemo(() => {
    return records.reduce((sum, record) => sum + record.images.length, 0)
  }, [records])

  const totalDone = useMemo(() => {
    return records.reduce(
      (sum, record) => sum + record.images.filter((img) => img.status === 'done').length,
      0
    )
  }, [records])

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 p-8 dark:bg-neutral-950 dark:text-white">
        Đang tải ảnh khách đã chọn...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 dark:text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-yellow-700 dark:text-yellow-400">
            Quản lý hậu kỳ
          </p>
          <div className="mt-3 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h1 className="text-5xl font-bold tracking-tight">Ảnh khách đã chọn</h1>
              <p className="mt-3 max-w-3xl text-neutral-600 dark:text-neutral-300">
                Theo dõi mã ảnh retouch, tiến độ hậu kỳ và upload lại ảnh đã chỉnh sửa
                theo giao diện trực quan, rõ ràng và đồng bộ với các trang admin khác.
              </p>
            </div>

            <div className="inline-flex rounded-full border border-yellow-200 bg-yellow-50 px-4 py-2 text-sm font-medium text-yellow-800 dark:border-yellow-900/40 dark:bg-yellow-900/20 dark:text-yellow-300">
              Retouch workflow panel
            </div>
          </div>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Tổng khách / album" value={records.length} tone="neutral" />
          <StatCard title="Tổng ảnh đã chọn" value={totalImages} tone="blue" />
          <StatCard title="Đã chỉnh sửa" value={totalDone} tone="green" />
          <StatCard title="Còn chờ retouch" value={totalImages - totalDone} tone="yellow" />
        </div>

        <SectionCard className="mb-6 p-5">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                Bộ lọc nhanh
              </h2>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                Tìm theo khách hàng, email, album hoặc mã ảnh; lọc theo trạng thái retouch.
              </p>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="Tìm theo khách hàng, email, album, mã ảnh..."
                  className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm dark:border-neutral-700 dark:bg-neutral-950 sm:w-96"
                />

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-2xl border border-neutral-200 px-4 py-3 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="pending">Chưa chỉnh sửa</option>
                  <option value="done">Đã có ảnh chỉnh sửa</option>
                </select>
              </div>

              {activeRecord && (
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => copyAllCodes(activeRecord)}
                    className="rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-medium dark:border-neutral-700"
                  >
                    Copy toàn bộ mã ảnh
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveCurrentRecord}
                    disabled={saving}
                    className="rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white disabled:opacity-60 dark:bg-yellow-700"
                  >
                    {saving ? 'Đang lưu...' : 'Lưu cập nhật'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </SectionCard>

        {!filteredRecords.length ? (
          <SectionCard className="p-10 text-center">
            <p className="text-neutral-500 dark:text-neutral-400">
              Không có dữ liệu phù hợp.
            </p>
          </SectionCard>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
            <div className="space-y-5">
              {filteredRecords.map((record) => {
                const doneCount = record.images.filter((img) => img.status === 'done').length
                const pendingCount = record.images.length - doneCount
                const isActive = activeRecordId === record._id

                return (
                  <SectionCard
                    key={record._id}
                    className={`p-5 transition duration-300 hover:shadow-lg ${
                      isActive ? 'ring-2 ring-yellow-500' : ''
                    }`}
                  >
                    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">
                          {record.customerId?.name || 'Khách hàng'}
                        </h2>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                          {record.customerId?.email || '--'}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full bg-neutral-100 px-3 py-1 dark:bg-neutral-800">
                            Album: {record.galleryId?.title || record.galleryTitle || '--'}
                          </span>
                          <span className="rounded-full bg-neutral-100 px-3 py-1 dark:bg-neutral-800">
                            Tổng ảnh: {record.images.length}
                          </span>
                          <span className="rounded-full bg-green-100 px-3 py-1 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            Đã chỉnh: {doneCount}
                          </span>
                          <span className="rounded-full bg-yellow-100 px-3 py-1 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                            Chờ: {pendingCount}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveRecordId(record._id)
                          setActiveImageIndex(0)
                        }}
                        className="rounded-2xl border border-neutral-200 px-4 py-2.5 text-sm font-medium dark:border-neutral-700"
                      >
                        {isActive ? 'Đang xem' : 'Mở làm việc'}
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12">
                      {record.images.map((image, index) => {
                        const globalActive =
                          activeRecordId === record._id && activeImageIndex === index

                        return (
                          <button
                            key={image.id}
                            type="button"
                            onClick={() => {
                              setActiveRecordId(record._id)
                              setActiveImageIndex(index)
                            }}
                            className={`group relative overflow-hidden rounded-xl border bg-neutral-50 transition hover:scale-[1.02] dark:border-neutral-700 dark:bg-neutral-950 ${
                              globalActive ? 'ring-2 ring-yellow-500' : ''
                            }`}
                          >
                            <img
                              src={image.url}
                              alt={image.code}
                              className="aspect-square w-full object-cover"
                            />

                            <div className="absolute inset-x-0 top-0 bg-black/75 px-1 py-1 text-center text-[10px] font-bold text-white">
                              {image.code}
                            </div>

                            <div className="absolute bottom-1 right-1">
                              <span
                                className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                  image.status === 'done'
                                    ? 'bg-green-500 text-white'
                                    : 'bg-yellow-500 text-black'
                                }`}
                              >
                                {image.status === 'done' ? 'OK' : 'CHỜ'}
                              </span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </SectionCard>
                )
              })}
            </div>

            <SectionCard className="sticky top-6 h-fit p-5">
              {!activeRecord || !activeImage ? (
                <div className="py-10 text-center text-neutral-500 dark:text-neutral-400">
                  Chọn một ảnh để xem chi tiết.
                </div>
              ) : (
                <>
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-yellow-700 dark:text-yellow-400">
                        Ảnh đang xử lý
                      </p>
                      <h3 className="mt-2 text-2xl font-bold">{activeImage.code}</h3>
                      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                        {activeRecord.customerId?.name || 'Khách hàng'} •{' '}
                        {activeRecord.galleryId?.title || activeRecord.galleryTitle || '--'}
                      </p>
                    </div>

                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        statusBadgeMap[activeImage.status] || statusBadgeMap.pending
                      }`}
                    >
                      {activeImage.status === 'done' ? 'Đã chỉnh sửa' : 'Chờ chỉnh sửa'}
                    </span>
                  </div>

                  <div className="relative overflow-hidden rounded-3xl border bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-950">
                    <img
                      src={activeImage.url}
                      alt={activeImage.code}
                      className="aspect-square w-full object-contain"
                    />
                    <div className="absolute left-3 top-3 rounded-xl bg-black/80 px-3 py-2 text-sm font-bold text-white">
                      {activeImage.code}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => copyCode(activeImage.code)}
                      className="rounded-2xl border border-neutral-200 px-4 py-2.5 text-sm font-medium dark:border-neutral-700"
                    >
                      Copy mã ảnh
                    </button>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveImageIndex((prev) =>
                            prev === 0 ? activeRecord.images.length - 1 : prev - 1
                          )
                        }
                        className="rounded-2xl border border-neutral-200 px-4 py-2.5 text-sm font-medium dark:border-neutral-700"
                      >
                        ← Ảnh trước
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setActiveImageIndex((prev) =>
                            prev === activeRecord.images.length - 1 ? 0 : prev + 1
                          )
                        }
                        className="rounded-2xl border border-neutral-200 px-4 py-2.5 text-sm font-medium dark:border-neutral-700"
                      >
                        Ảnh sau →
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 rounded-3xl border p-4 dark:border-neutral-700">
                    <FieldLabel>Ghi chú chỉnh sửa</FieldLabel>
                    <textarea
                      value={activeImage.note}
                      onChange={(e) => handleChangeImageNote(e.target.value)}
                      placeholder="Ví dụ: làm sáng da nhẹ, xóa mụn, chỉnh tone ấm, crop 4:5..."
                      className="min-h-[110px] w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                    />
                  </div>

                  <div className="mt-5 rounded-3xl border p-4 dark:border-neutral-700">
                    <FieldLabel>Upload ảnh đã chỉnh sửa</FieldLabel>

                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUploadEditedImage(e.target.files?.[0])}
                      className="w-full text-sm"
                    />

                    <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                      Hệ thống sẽ nén ảnh trước khi upload để tránh lỗi dung lượng.
                    </p>

                    {uploadingEdited && (
                      <p className="mt-3 text-sm text-yellow-600">
                        Đang upload ảnh chỉnh sửa...
                      </p>
                    )}
                  </div>

                  {activeImage.editedUrl && (
                    <div className="mt-5 rounded-3xl border p-4 dark:border-neutral-700">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <h4 className="font-semibold text-green-600">Ảnh đã chỉnh sửa</h4>
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          Hoàn thành
                        </span>
                      </div>

                      <div className="overflow-hidden rounded-2xl border dark:border-neutral-700">
                        <img
                          src={activeImage.editedUrl}
                          alt={`${activeImage.code}-edited`}
                          className="aspect-square w-full object-contain"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </SectionCard>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminSelectedImagesPage