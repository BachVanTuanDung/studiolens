import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
    getMyGalleries,
    getMySelectedImages,
    submitSelectedImages,
} from '../api/galleryApi'

const MIN_ZOOM = 1
const MAX_ZOOM = 4
const ZOOM_STEP = 0.25

const clampZoom = (value) => {
    return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(value.toFixed(2))))
}

const GalleryPage = () => {
    const [galleries, setGalleries] = useState([])
    const [selectedRecords, setSelectedRecords] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedGalleryId, setSelectedGalleryId] = useState('')
    const [selectedImages, setSelectedImages] = useState([])
    const [submittingSelection, setSubmittingSelection] = useState(false)

    const [compareMode, setCompareMode] = useState(false)
    const [comparePosition, setComparePosition] = useState(50)
    const [isDraggingCompare, setIsDraggingCompare] = useState(false)
    const [activeTab, setActiveTab] = useState('all') // all | selected | edited

    const [viewerOpen, setViewerOpen] = useState(false)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [viewMode, setViewMode] = useState('original') // original | edited

    const [zoom, setZoom] = useState(MIN_ZOOM)
    const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 })
    const [isDraggingImage, setIsDraggingImage] = useState(false)
    const [dragStart, setDragStart] = useState(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [galleryRes, selectedRes] = await Promise.all([
                    getMyGalleries(),
                    getMySelectedImages(),
                ])

                const galleryData =
                    galleryRes.data?.galleries ||
                    galleryRes.data?.data ||
                    galleryRes.data?.gallery ||
                    []

                const selectedData =
                    selectedRes.data?.data ||
                    selectedRes.data?.selectedImages ||
                    selectedRes.data?.records ||
                    []

                const normalizedGalleries = Array.isArray(galleryData)
                    ? galleryData
                    : [galleryData]

                setGalleries(normalizedGalleries)
                setSelectedRecords(Array.isArray(selectedData) ? selectedData : [])

                if (normalizedGalleries.length > 0) {
                    setSelectedGalleryId(normalizedGalleries[0]._id)
                }
            } catch (error) {
                console.error(error)
                toast.error(error.response?.data?.message || 'Không thể tải gallery')
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    const activeGallery = useMemo(() => {
        return galleries.find((item) => item._id === selectedGalleryId) || null
    }, [galleries, selectedGalleryId])

    const activeSelectedRecord = useMemo(() => {
        return (
            selectedRecords.find((item) => {
                const galleryId =
                    item.galleryId?._id || item.galleryId || item.gallery?._id || item.gallery
                return galleryId === selectedGalleryId
            }) || null
        )
    }, [selectedRecords, selectedGalleryId])

    const editedMap = useMemo(() => {
        const map = new Map()
        const items = activeSelectedRecord?.selectedImages || []

        items.forEach((img) => {
            const url = typeof img === 'string' ? img : img.url
            const code = typeof img === 'string' ? '' : img.code || ''
            const filename = typeof img === 'string' ? '' : img.filename || ''
            const editedUrl = typeof img === 'string' ? '' : img.editedUrl || ''

            if (url) {
                map.set(`url:${url}`, {
                    editedUrl,
                    code,
                    filename,
                })
            }

            if (code) {
                map.set(`code:${code}`, {
                    editedUrl,
                    code,
                    filename,
                })
            }
        })

        return map
    }, [activeSelectedRecord])

    const normalizedImages = useMemo(() => {
        if (!activeGallery?.images) return []

        return activeGallery.images.map((image, index) => {
            const imageUrl = typeof image === 'string' ? image : image.url
            const filename =
                typeof image === 'string'
                    ? `image-${index + 1}.jpg`
                    : image.filename || image.caption || `image-${index + 1}.jpg`

            const code =
                typeof image === 'string'
                    ? filename.replace(/\.[^.]+$/, '')
                    : image.code || filename.replace(/\.[^.]+$/, '')

            const fromSelectedByCode = editedMap.get(`code:${code}`)
            const fromSelectedByUrl = editedMap.get(`url:${imageUrl}`)
            const matchedSelected = fromSelectedByCode || fromSelectedByUrl

            return {
                id:
                    typeof image === 'string'
                        ? `${imageUrl}-${index}`
                        : image.publicId || image.url || index,
                url: imageUrl,
                publicId: typeof image === 'string' ? '' : image.publicId || '',
                filename,
                code,
                caption: typeof image === 'string' ? filename : image.caption || filename,
                editedUrl: matchedSelected?.editedUrl || '',
                hasEdited: Boolean(matchedSelected?.editedUrl),
            }
        })
    }, [activeGallery, editedMap])

    const displayedImages = useMemo(() => {
        if (activeTab === 'edited') {
            return normalizedImages.filter((img) => img.hasEdited)
        }

        if (activeTab === 'selected') {
            return normalizedImages.filter((img) =>
                selectedImages.some((item) => item.url === img.url)
            )
        }

        return normalizedImages
    }, [normalizedImages, activeTab, selectedImages])

    useEffect(() => {
        setCurrentIndex(0)
        setViewerOpen(false)
    }, [activeTab, selectedGalleryId])

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!viewerOpen || displayedImages.length === 0) return

            if (e.key === 'Escape') {
                setViewerOpen(false)
            }

            if (e.key === 'ArrowLeft') {
                setCurrentIndex((prev) =>
                    prev === 0 ? displayedImages.length - 1 : prev - 1
                )
                setZoom(MIN_ZOOM)
                setImagePosition({ x: 0, y: 0 })
            }

            if (e.key === 'ArrowRight') {
                setCurrentIndex((prev) =>
                    prev === displayedImages.length - 1 ? 0 : prev + 1
                )
                setZoom(MIN_ZOOM)
                setImagePosition({ x: 0, y: 0 })
            }

            if (e.key === '+' || e.key === '=') {
                if (compareMode) return
                e.preventDefault()
                setZoom((prev) => clampZoom(prev + ZOOM_STEP))
            }

            if (e.key === '-' || e.key === '_') {
                if (compareMode) return
                e.preventDefault()
                setZoom((prev) => {
                    const nextZoom = clampZoom(prev - ZOOM_STEP)

                    if (nextZoom === MIN_ZOOM) {
                        setImagePosition({ x: 0, y: 0 })
                    }

                    return nextZoom
                })
            }

            if (e.key === '0') {
                if (compareMode) return
                e.preventDefault()
                setZoom(MIN_ZOOM)
                setImagePosition({ x: 0, y: 0 })
                setIsDraggingImage(false)
                setDragStart(null)
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [viewerOpen, displayedImages.length, compareMode])

    useEffect(() => {
        if (currentIndex > displayedImages.length - 1) {
            setCurrentIndex(0)
        }
    }, [displayedImages, currentIndex])

    useEffect(() => {
        if (!viewerOpen) return

        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'

        return () => {
            document.body.style.overflow = previousOverflow
        }
    }, [viewerOpen])

    const toggleImage = (imageObj) => {
        setSelectedImages((prev) => {
            const exists = prev.some((item) => item.url === imageObj.url)

            if (exists) {
                return prev.filter((item) => item.url !== imageObj.url)
            }

            return [...prev, imageObj]
        })
    }

    const clearSelectedImages = () => {
        setSelectedImages([])
    }

    const resetZoom = () => {
        setZoom(MIN_ZOOM)
        setImagePosition({ x: 0, y: 0 })
        setIsDraggingImage(false)
        setDragStart(null)
    }

    const zoomIn = () => {
        if (compareMode) return
        setZoom((prev) => clampZoom(prev + ZOOM_STEP))
    }

    const zoomOut = () => {
        if (compareMode) return
        setZoom((prev) => {
            const nextZoom = clampZoom(prev - ZOOM_STEP)

            if (nextZoom === MIN_ZOOM) {
                setImagePosition({ x: 0, y: 0 })
            }

            return nextZoom
        })
    }

    const handleWheelZoom = (e) => {
        if (!viewerOpen || compareMode) return

        e.preventDefault()

        const direction = e.deltaY > 0 ? -1 : 1

        setZoom((prev) => {
            const nextZoom = clampZoom(prev + direction * ZOOM_STEP)

            if (nextZoom === MIN_ZOOM) {
                setImagePosition({ x: 0, y: 0 })
                setIsDraggingImage(false)
                setDragStart(null)
            }

            return nextZoom
        })
    }

    const handleImagePointerDown = (e) => {
        if (zoom <= MIN_ZOOM || e.button !== 0) return

        e.preventDefault()
        e.currentTarget.setPointerCapture?.(e.pointerId)
        setIsDraggingImage(true)
        setDragStart({
            x: e.clientX - imagePosition.x,
            y: e.clientY - imagePosition.y,
        })
    }

    const handleImagePointerMove = (e) => {
        if (!isDraggingImage || !dragStart || zoom <= MIN_ZOOM) return

        setImagePosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y,
        })
    }

    const handleImagePointerUp = () => {
        setIsDraggingImage(false)
        setDragStart(null)
    }

    const handleDoubleClickZoom = () => {
        if (compareMode) return

        setZoom((prev) => {
            if (prev > MIN_ZOOM) {
                setImagePosition({ x: 0, y: 0 })
                return MIN_ZOOM
            }

            return 2
        })
    }

    const openViewer = (index) => {
        setCurrentIndex(index)
        setViewMode('original')
        setCompareMode(false)
        setComparePosition(50)
        resetZoom()
        setViewerOpen(true)
    }

    const closeViewer = () => {
        resetZoom()
        setViewerOpen(false)
    }

    const goPrevImage = () => {
        setCurrentIndex((prev) =>
            prev === 0 ? displayedImages.length - 1 : prev - 1
        )
        setViewMode('original')
        setCompareMode(false)
        setComparePosition(50)
        resetZoom()
    }

    const goNextImage = () => {
        setCurrentIndex((prev) =>
            prev === displayedImages.length - 1 ? 0 : prev + 1
        )
        setViewMode('original')
        setCompareMode(false)
        setComparePosition(50)
        resetZoom()
    }

    const handleSubmitSelection = async () => {
        if (!activeGallery) return

        if (selectedImages.length === 0) {
            toast.error('Vui lòng chọn ít nhất 1 ảnh')
            return
        }

        try {
            setSubmittingSelection(true)

            await submitSelectedImages({
                galleryId: activeGallery._id,
                selectedImages: selectedImages.map((img) => ({
                    url: img.url,
                    publicId: img.publicId || '',
                    filename: img.filename || '',
                    code: img.code || '',
                })),
                note: '',
            })

            toast.success(`Đã gửi ${selectedImages.length} ảnh đã chọn`)
        } catch (error) {
            console.error(error)
            toast.error(error.response?.data?.message || 'Gửi ảnh đã chọn thất bại')
        } finally {
            setSubmittingSelection(false)
        }
    }

    const handleDownload = async (fileUrl, filename) => {
        try {
            const response = await fetch(fileUrl)
            const blob = await response.blob()
            const objectUrl = window.URL.createObjectURL(blob)

            const link = document.createElement('a')
            link.href = objectUrl
            link.download = filename || 'edited-image.jpg'
            document.body.appendChild(link)
            link.click()
            link.remove()

            window.URL.revokeObjectURL(objectUrl)
        } catch (error) {
            console.error(error)
            window.open(fileUrl, '_blank', 'noopener,noreferrer')
        }
    }

    const handleDownloadAllEdited = async () => {
        const editedImages = normalizedImages.filter((img) => img.hasEdited)

        if (editedImages.length === 0) {
            toast.error('Chưa có ảnh đã chỉnh sửa để tải')
            return
        }

        try {
            for (const image of editedImages) {
                await handleDownload(
                    image.editedUrl,
                    `edited-${image.filename || image.code}.jpg`
                )
            }

            toast.success(`Đang tải ${editedImages.length} ảnh đã chỉnh`)
        } catch (error) {
            console.error(error)
            toast.error('Tải ảnh hàng loạt thất bại')
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f8f5ef,transparent_35%),linear-gradient(to_bottom,#faf7f2,#f6f7fb)] dark:bg-[radial-gradient(circle_at_top,#1a1408,transparent_22%),linear-gradient(to_bottom,#09090b,#0f1117)]">
                <div className="mx-auto max-w-7xl px-6 py-12">
                    <div className="animate-pulse space-y-6">
                        <div className="h-56 rounded-[32px] bg-white/80 dark:bg-white/5" />
                        <div className="h-28 rounded-[28px] bg-white/80 dark:bg-white/5" />
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
                            {Array.from({ length: 10 }).map((_, index) => (
                                <div
                                    key={index}
                                    className="aspect-square rounded-[24px] bg-white/80 dark:bg-white/5"
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (!galleries.length) {
        return (
            <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f8f5ef,transparent_35%),linear-gradient(to_bottom,#faf7f2,#f6f7fb)] dark:bg-[radial-gradient(circle_at_top,#1a1408,transparent_22%),linear-gradient(to_bottom,#09090b,#0f1117)]">
                <div className="mx-auto max-w-7xl px-6 py-14">
                    <div className="rounded-[32px] border border-black/5 bg-white/85 p-10 text-center shadow-sm dark:border-white/10 dark:bg-white/5">
                        <p className="text-sm uppercase tracking-[0.3em] text-primary">
                            Gallery cá nhân
                        </p>
                        <h1 className="mt-3 text-4xl font-bold text-neutral-900 dark:text-white">
                            Chưa có album nào
                        </h1>
                        <p className="mx-auto mt-4 max-w-2xl text-neutral-600 dark:text-neutral-300">
                            Hiện tại bạn chưa có gallery ảnh. Vui lòng chờ admin cập nhật bộ ảnh
                            sau buổi chụp.
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    const currentImage = displayedImages[currentIndex]
    const currentImageSelected = currentImage
        ? selectedImages.some((item) => item.url === currentImage.url)
        : false

    const currentDisplayUrl =
        viewMode === 'edited' && currentImage?.editedUrl
            ? currentImage.editedUrl
            : currentImage?.url

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f8f5ef,transparent_35%),linear-gradient(to_bottom,#faf7f2,#f6f7fb)] dark:bg-[radial-gradient(circle_at_top,#1a1408,transparent_22%),linear-gradient(to_bottom,#09090b,#0f1117)]">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
                {/* HERO */}
                <section className="relative overflow-hidden rounded-[36px] border border-white/60 bg-black shadow-[0_30px_80px_rgba(15,23,42,0.18)] dark:border-white/10">
                    <img
                        src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1600&auto=format&fit=crop"
                        alt="Gallery hero"
                        className="absolute inset-0 h-full w-full object-cover opacity-25"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,0,0,0.86),rgba(0,0,0,0.45),rgba(201,168,76,0.18))]" />

                    <div className="relative px-6 py-14 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
                        <div className="max-w-3xl">
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary backdrop-blur-md">
                                <span className="h-2 w-2 rounded-full bg-primary" />
                                StudioLens Personal Gallery
                            </div>

                            <h1 className="mt-6 text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
                                Chọn ảnh,
                                <span className="text-primary"> xem ảnh đã chỉnh </span>
                                và tải về dễ dàng
                            </h1>

                            <p className="mt-6 max-w-2xl text-base leading-8 text-white/75 sm:text-lg">
                                Quản lý gallery cá nhân của bạn trong một giao diện trực quan hơn,
                                chuyên nghiệp hơn và thuận tiện hơn cho việc chọn ảnh cũng như xem bản chỉnh sửa.
                            </p>
                        </div>
                    </div>
                </section>

                {/* ALBUM SWITCHER */}
                <div className="mt-8 rounded-[30px] border border-black/5 bg-white/85 p-5 shadow-[0_12px_40px_rgba(15,23,42,0.05)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                    <div className="mb-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
                            Album selector
                        </p>
                        <h2 className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">
                            Chọn album của bạn
                        </h2>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {galleries.map((gallery) => (
                            <button
                                key={gallery._id}
                                onClick={() => {
                                    setSelectedGalleryId(gallery._id)
                                    setSelectedImages([])
                                    setViewerOpen(false)
                                    setCurrentIndex(0)
                                    setActiveTab('all')
                                }}
                                className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${selectedGalleryId === gallery._id
                                        ? 'bg-black text-white shadow-lg dark:bg-primary dark:text-black'
                                        : 'border border-neutral-200 bg-white text-neutral-700 hover:-translate-y-0.5 hover:border-primary hover:text-primary dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-200'
                                    }`}
                            >
                                {gallery.title}
                            </button>
                        ))}
                    </div>
                </div>

                {activeGallery && (
                    <>
                        {/* GALLERY INFO */}
                        <div className="mt-6 rounded-[30px] border border-black/5 bg-white/85 p-6 shadow-[0_12px_40px_rgba(15,23,42,0.05)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
                                        Album details
                                    </p>
                                    <h2 className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">
                                        {activeGallery.title}
                                    </h2>
                                    <p className="mt-3 max-w-3xl text-neutral-600 dark:text-neutral-300">
                                        {activeGallery.description || 'Album ảnh dành riêng cho bạn.'}
                                    </p>

                                    <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-neutral-600 dark:text-neutral-400">
                                        <span>Tổng ảnh: {normalizedImages.length}</span>
                                        <span>•</span>
                                        <span>Đã chọn: {selectedImages.length}</span>
                                        <span>•</span>
                                        <span>Đã chỉnh sửa: {normalizedImages.filter((img) => img.hasEdited).length}</span>
                                        <span>•</span>
                                        <span>
                                            Đang xem:{' '}
                                            {activeTab === 'all'
                                                ? 'Tất cả ảnh'
                                                : activeTab === 'selected'
                                                    ? 'Ảnh đã chọn'
                                                    : 'Ảnh đã chỉnh sửa'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('all')}
                                        className={`rounded-2xl px-4 py-2.5 text-sm font-medium transition ${activeTab === 'all'
                                                ? 'bg-black text-white dark:bg-primary dark:text-black'
                                                : 'border border-neutral-200 bg-white text-neutral-700 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-200'
                                            }`}
                                    >
                                        Tất cả ảnh
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('selected')}
                                        className={`rounded-2xl px-4 py-2.5 text-sm font-medium transition ${activeTab === 'selected'
                                                ? 'bg-primary text-black'
                                                : 'border border-neutral-200 bg-white text-neutral-700 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-200'
                                            }`}
                                    >
                                        Ảnh đã chọn
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('edited')}
                                        className={`rounded-2xl px-4 py-2.5 text-sm font-medium transition ${activeTab === 'edited'
                                                ? 'bg-green-600 text-white'
                                                : 'border border-neutral-200 bg-white text-neutral-700 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-200'
                                            }`}
                                    >
                                        Ảnh đã chỉnh sửa
                                    </button>

                                    {activeTab === 'edited' && (
                                        <button
                                            type="button"
                                            onClick={handleDownloadAllEdited}
                                            className="rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                                        >
                                            Tải tất cả ảnh đã chỉnh
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* EMPTY STATE */}
                        {displayedImages.length === 0 ? (
                            <div className="mt-6 rounded-[30px] border border-black/5 bg-white/85 p-10 text-center shadow-sm dark:border-white/10 dark:bg-white/5">
                                <p className="text-neutral-500 dark:text-neutral-400">
                                    {activeTab === 'edited'
                                        ? 'Chưa có ảnh đã chỉnh sửa trong album này.'
                                        : activeTab === 'selected'
                                            ? 'Bạn chưa chọn ảnh nào trong album này.'
                                            : 'Album này chưa có ảnh.'}
                                </p>
                            </div>
                        ) : (
                            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
                                {displayedImages.map((image, index) => {
                                    const isSelected = selectedImages.some((item) => item.url === image.url)

                                    return (
                                        <button
                                            key={image.id}
                                            type="button"
                                            onClick={() => openViewer(index)}
                                            className={`group relative overflow-hidden rounded-[24px] border bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-white/10 dark:bg-neutral-900 ${isSelected ? 'ring-2 ring-primary shadow-lg shadow-primary/10' : ''
                                                }`}
                                        >
                                            <img
                                                src={image.hasEdited ? image.editedUrl || image.url : image.url}
                                                alt={image.caption}
                                                className="aspect-square w-full object-cover transition duration-500 group-hover:scale-110"
                                            />

                                            <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/10" />

                                            <div className="absolute left-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-md">
                                                {image.code}
                                            </div>

                                            <div className="absolute right-3 top-3">
                                                <div
                                                    className={`flex min-h-8 min-w-8 items-center justify-center rounded-full border px-2 text-xs font-bold ${isSelected
                                                            ? 'border-primary bg-primary text-black'
                                                            : 'border-white/50 bg-black/50 text-white backdrop-blur-sm'
                                                        }`}
                                                >
                                                    {isSelected ? '✓' : index + 1}
                                                </div>
                                            </div>

                                            {image.hasEdited && (
                                                <div className="absolute bottom-3 left-3 rounded-full bg-green-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                                                    Đã chỉnh
                                                </div>
                                            )}

                                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-3 text-left">
                                                <p className="line-clamp-1 text-sm font-semibold text-white">
                                                    {image.caption}
                                                </p>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        )}

                        {/* VIEWER */}
                        {viewerOpen && currentImage && (
                            <div className="fixed inset-0 z-[999] overflow-hidden bg-[#030303] text-white">
                                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(201,168,76,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.10),transparent_28%)]" />
                                <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black via-black/70 to-transparent" />

                                <div className="relative mx-auto flex h-full max-w-[1500px] flex-col gap-3 px-3 py-3 sm:px-5 sm:py-5">
                                    {/* Header */}
                                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-white/10 bg-white/[0.07] px-4 py-3 shadow-2xl backdrop-blur-2xl">
                                        <div className="min-w-0">
                                            <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-white/55">
                                                <span className="rounded-full bg-white/10 px-2.5 py-1 font-semibold text-white/80">
                                                    {currentIndex + 1} / {displayedImages.length}
                                                </span>
                                                <span className="rounded-full bg-primary/20 px-2.5 py-1 font-semibold text-primary">
                                                    {currentImage.code}
                                                </span>
                                                {currentImage.hasEdited && (
                                                    <span className="rounded-full bg-green-500/20 px-2.5 py-1 font-semibold text-green-300">
                                                        Có ảnh đã chỉnh
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="truncate text-base font-bold text-white sm:text-xl">
                                                {currentImage.caption}
                                            </h3>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2">
                                            <div className="hidden items-center gap-2 rounded-2xl border border-white/10 bg-black/35 px-3 py-2 text-xs font-medium text-white/60 lg:flex">
                                                <span>Lăn chuột để zoom</span>
                                                <span className="text-white/25">•</span>
                                                <span>Double click phóng/thu</span>
                                                <span className="text-white/25">•</span>
                                                <span>+ / - / 0</span>
                                            </div>

                                            <div className="flex items-center gap-1 rounded-2xl border border-white/10 bg-black/45 p-1 shadow-lg backdrop-blur-md">
                                                <button
                                                    type="button"
                                                    onClick={zoomOut}
                                                    disabled={compareMode || zoom <= MIN_ZOOM}
                                                    className="flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-35"
                                                    title="Thu nhỏ (-)"
                                                >
                                                    −
                                                </button>

                                                <div className="min-w-16 rounded-xl bg-white/10 px-3 py-2 text-center text-sm font-bold text-white">
                                                    {Math.round(zoom * 100)}%
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={zoomIn}
                                                    disabled={compareMode || zoom >= MAX_ZOOM}
                                                    className="flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-35"
                                                    title="Phóng to (+)"
                                                >
                                                    +
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={resetZoom}
                                                    disabled={compareMode}
                                                    className="rounded-xl px-3 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
                                                    title="Reset zoom (0)"
                                                >
                                                    Reset
                                                </button>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={closeViewer}
                                                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-xl font-bold text-white transition hover:bg-red-500 hover:text-white"
                                                title="Đóng"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </div>

                                    {/* Main image stage */}
                                    <div className="relative min-h-0 flex-1 overflow-hidden rounded-[34px] border border-white/10 bg-white/[0.045] p-2 shadow-[0_28px_90px_rgba(0,0,0,0.65)] backdrop-blur-xl sm:p-3">
                                        <button
                                            type="button"
                                            onClick={goPrevImage}
                                            className="absolute left-4 top-1/2 z-30 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/55 text-2xl text-white shadow-2xl backdrop-blur-md transition hover:scale-105 hover:bg-white hover:text-black sm:h-14 sm:w-14"
                                            title="Ảnh trước"
                                        >
                                            ←
                                        </button>

                                        <button
                                            type="button"
                                            onClick={goNextImage}
                                            className="absolute right-4 top-1/2 z-30 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/55 text-2xl text-white shadow-2xl backdrop-blur-md transition hover:scale-105 hover:bg-white hover:text-black sm:h-14 sm:w-14"
                                            title="Ảnh tiếp theo"
                                        >
                                            →
                                        </button>

                                        <div className="absolute left-4 top-4 z-20 flex flex-wrap gap-2">
                                            <span className="rounded-full border border-white/10 bg-black/55 px-3 py-1.5 text-xs font-semibold text-white/85 backdrop-blur-md">
                                                {viewMode === 'edited' && currentImage.editedUrl ? 'Đang xem: ảnh đã chỉnh' : 'Đang xem: ảnh gốc'}
                                            </span>
                                            {compareMode && (
                                                <span className="rounded-full bg-blue-500/25 px-3 py-1.5 text-xs font-semibold text-blue-200">
                                                    Chế độ so sánh
                                                </span>
                                            )}
                                        </div>

                                        <div
                                            className="relative flex h-full w-full select-none items-center justify-center overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_34%),#050505]"
                                            onWheel={handleWheelZoom}
                                            onPointerDown={handleImagePointerDown}
                                            onPointerMove={handleImagePointerMove}
                                            onPointerUp={handleImagePointerUp}
                                            onPointerLeave={handleImagePointerUp}
                                            onDoubleClick={handleDoubleClickZoom}
                                        >
                                            <div
                                                className={`flex h-full w-full items-center justify-center ${zoom > MIN_ZOOM ? 'cursor-grab active:cursor-grabbing' : compareMode ? 'cursor-ew-resize' : 'cursor-zoom-in'}`}
                                                style={{
                                                    transform: compareMode
                                                        ? 'translate3d(0, 0, 0) scale(1)'
                                                        : `translate3d(${imagePosition.x}px, ${imagePosition.y}px, 0) scale(${zoom})`,
                                                    transformOrigin: 'center center',
                                                    willChange: 'transform',
                                                    backfaceVisibility: 'hidden',
                                                }}
                                            >
                                                {compareMode && currentImage?.hasEdited ? (
                                                    <BeforeAfterSlider
                                                        originalSrc={currentImage.url}
                                                        editedSrc={currentImage.editedUrl}
                                                        position={comparePosition}
                                                        setPosition={setComparePosition}
                                                        isDragging={isDraggingCompare}
                                                        setIsDragging={setIsDraggingCompare}
                                                    />
                                                ) : (
                                                    <img
                                                        src={currentDisplayUrl}
                                                        alt={currentImage.caption}
                                                        className="block max-h-full max-w-full select-none object-contain"
                                                        style={{
                                                            transform: 'translateZ(0)',
                                                            backfaceVisibility: 'hidden',
                                                            WebkitUserDrag: 'none',
                                                        }}
                                                        draggable={false}
                                                    />
                                                )}
                                            </div>

                                            <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 hidden -translate-x-1/2 rounded-full border border-white/10 bg-black/65 px-4 py-2 text-center text-xs font-medium text-white/75 shadow-xl backdrop-blur-md md:block">
                                                {compareMode
                                                    ? 'Kéo thanh giữa để so sánh ảnh gốc và ảnh đã chỉnh'
                                                    : zoom > MIN_ZOOM
                                                        ? 'Giữ chuột trái và kéo để xem chi tiết ảnh'
                                                        : 'Lăn chuột hoặc double click để zoom ảnh'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bottom action bar */}
                                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-white/10 bg-white/[0.07] p-3 text-white shadow-2xl backdrop-blur-2xl sm:p-4">
                                        <div className="flex flex-wrap gap-2 sm:gap-3">
                                            <button
                                                type="button"
                                                onClick={() => toggleImage(currentImage)}
                                                className={`rounded-2xl px-4 py-2.5 text-sm font-bold shadow-lg transition sm:px-5 sm:py-3 ${currentImageSelected
                                                        ? 'bg-red-500 text-white hover:bg-red-600'
                                                        : 'bg-primary text-black hover:-translate-y-0.5 hover:opacity-95'
                                                    }`}
                                            >
                                                {currentImageSelected ? 'Bỏ chọn ảnh này' : 'Chọn ảnh này'}
                                            </button>

                                            {currentImage.hasEdited && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setCompareMode((prev) => !prev)
                                                            setViewMode('original')
                                                            resetZoom()
                                                        }}
                                                        className={`rounded-2xl px-4 py-2.5 text-sm font-bold shadow-lg transition sm:px-5 sm:py-3 ${compareMode
                                                                ? 'bg-white text-black hover:bg-white/90'
                                                                : 'bg-blue-600 text-white hover:bg-blue-500'
                                                            }`}
                                                    >
                                                        {compareMode ? 'Tắt so sánh' : 'So sánh trước / sau'}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setCompareMode(false)
                                                            setViewMode((prev) => (prev === 'original' ? 'edited' : 'original'))
                                                            resetZoom()
                                                        }}
                                                        className="rounded-2xl bg-green-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-green-500 sm:px-5 sm:py-3"
                                                    >
                                                        {viewMode === 'edited' ? 'Xem ảnh gốc' : 'Xem ảnh đã chỉnh'}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleDownload(
                                                                currentImage.editedUrl,
                                                                `edited-${currentImage.filename || currentImage.code}.jpg`
                                                            )
                                                        }
                                                        className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white hover:text-black sm:px-5 sm:py-3"
                                                    >
                                                        Tải ảnh đã chỉnh
                                                    </button>
                                                </>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 text-xs text-white/60 sm:text-sm">
                                            {compareMode ? (
                                                <span className="rounded-full bg-blue-500/20 px-3 py-2 font-semibold text-blue-200">
                                                    Zoom tạm tắt khi đang so sánh
                                                </span>
                                            ) : (
                                                <span className="rounded-full bg-white/10 px-3 py-2 font-semibold text-white/75">
                                                    Zoom tối đa {MAX_ZOOM}x
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STICKY ACTION BAR */}
                        <div className="sticky bottom-4 z-30 mt-10">
                            <div className="mx-auto flex max-w-4xl flex-col gap-4 rounded-[28px] bg-[linear-gradient(135deg,#09090b,#171717,#2a210d)] p-5 text-white shadow-2xl ring-1 ring-white/10 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <p className="text-sm uppercase tracking-[0.3em] text-primary">
                                        Xác nhận lựa chọn
                                    </p>
                                    <h3 className="mt-2 text-xl font-semibold">
                                        Bạn đã chọn {selectedImages.length} ảnh
                                    </h3>
                                    <p className="mt-1 text-sm text-white/70">
                                        Chọn các ảnh bạn muốn giữ lại hoặc gửi cho studio chỉnh sửa.
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    <button
                                        type="button"
                                        onClick={clearSelectedImages}
                                        className="rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                                    >
                                        Bỏ chọn tất cả
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleSubmitSelection}
                                        disabled={submittingSelection}
                                        className="rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-60"
                                    >
                                        {submittingSelection ? 'Đang gửi...' : 'Xác nhận ảnh đã chọn'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

const BeforeAfterSlider = ({
    originalSrc,
    editedSrc,
    position,
    setPosition,
    isDragging,
    setIsDragging,
}) => {
    const updatePosition = (clientX, rect) => {
        const x = clientX - rect.left
        const next = Math.min(100, Math.max(0, (x / rect.width) * 100))
        setPosition(next)
    }

    const handlePointerDown = (e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        updatePosition(e.clientX, rect)
        setIsDragging(true)
    }

    const handlePointerMove = (e) => {
        if (!isDragging) return
        const rect = e.currentTarget.getBoundingClientRect()
        updatePosition(e.clientX, rect)
    }

    const handlePointerUp = () => {
        setIsDragging(false)
    }

    return (
        <div
            className="relative mx-auto flex h-full w-full select-none items-center justify-center overflow-hidden bg-black"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
        >
            <img
                src={originalSrc}
                alt="Ảnh gốc"
                className="absolute inset-0 h-full w-full object-contain"
                draggable={false}
            />

            <img
                src={editedSrc}
                alt="Ảnh đã chỉnh"
                className="absolute inset-0 h-full w-full object-contain"
                style={{
                    clipPath: `inset(0 ${100 - position}% 0 0)`,
                }}
                draggable={false}
            />

            <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/75 px-3 py-2 text-xs font-semibold text-white backdrop-blur-md">
                Gốc
            </div>

            <div className="pointer-events-none absolute right-3 top-3 rounded-full bg-green-600 px-3 py-2 text-xs font-semibold text-white">
                Đã chỉnh
            </div>

            <div
                className="pointer-events-none absolute inset-y-0 z-20"
                style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
            >
                <div className="h-full w-1 bg-white shadow-lg" />
                <div className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-black/85 text-white shadow-xl">
                    ↔
                </div>
            </div>
        </div>
    )
}

export default GalleryPage