import { useEffect, useMemo, useState } from 'react'
import { getConcepts } from '../api/conceptApi'
import { Link } from 'react-router-dom'

const categories = [
  'all',
  'romantic',
  'vintage',
  'minimal',
  'editorial',
  'dark',
  'outdoor',
  'studio',
]

const categoryLabels = {
  all: 'Tất cả',
  romantic: 'Romantic',
  vintage: 'Vintage',
  minimal: 'Minimal',
  editorial: 'Editorial',
  dark: 'Dark',
  outdoor: 'Outdoor',
  studio: 'Studio',
}

// Modal xem chi tiết và Grid ảnh của Concept
const ConceptDetailModal = ({ concept, onClose, openViewer }) => {
  if (!concept) return null

  // Đảm bảo lấy mảng ảnh hợp lệ
  const conceptImages = Array.isArray(concept.images) 
    ? concept.images 
    : concept.image ? [concept.image] : []

  return (
    <div className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-[5px]">
      <div className="flex min-h-screen items-center justify-center p-4 sm:p-6">
        <div className="relative w-full max-w-6xl overflow-hidden rounded-[32px] border border-white/10 bg-white shadow-2xl dark:bg-[#101216] dark:text-white">
          
          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-5 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 bg-white/90 text-xl text-neutral-700 shadow-md transition hover:scale-105 hover:bg-white dark:border-white/10 dark:bg-black/40 dark:text-white dark:hover:bg-black/60"
          >
            ✕
          </button>

          {/* KHUNG TỔNG: Ép chiều cao lg:h-[85vh] để form to và cao hơn */}
          <div className="grid h-auto max-h-[90vh] min-h-[600px] lg:h-[85vh] lg:grid-cols-[1.2fr_0.8fr] overflow-hidden">
            
            {/* CỘT TRÁI: Lưới ảnh, bật overflow-y-auto để cuộn lên xuống */}
            <div className="flex flex-col overflow-y-auto bg-neutral-50/50 p-6 sm:p-8 dark:bg-black/30 custom-scrollbar">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 content-start">
                {conceptImages.map((img, idx) => {
                  const imgUrl = img.url || img
                  return (
                    <button 
                      key={idx} 
                      type="button"
                      onClick={() => openViewer(conceptImages, idx)}
                      className="group relative block overflow-hidden rounded-2xl border border-black/5 dark:border-white/10 outline-none aspect-square"
                    >
                      <img
                        src={imgUrl}
                        alt={`Concept ${idx + 1}`}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-110 cursor-zoom-in"
                      />
                      <div className="absolute inset-0 bg-black/0 transition duration-300 group-hover:bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                        <span className="rounded-full bg-black/60 px-4 py-2 text-xs font-medium text-white backdrop-blur-md shadow-lg">Phóng to</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* CỘT PHẢI: Thông tin chi tiết */}
            <div className="flex flex-col overflow-y-auto p-6 sm:p-8 lg:p-10 bg-white dark:bg-[#101216] custom-scrollbar">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
                  {categoryLabels[concept.category] || concept.category}
                </p>
                {concept.isFeatured && (
                  <span className="rounded-full bg-yellow-100 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
                    Nổi bật
                  </span>
                )}
              </div>

              <h2 className="break-words mt-4 text-3xl font-bold text-neutral-900 dark:text-white sm:text-4xl">
                {concept.name}
              </h2>

              <p className="break-words whitespace-pre-wrap mt-5 leading-8 text-neutral-600 dark:text-neutral-300">
                {concept.description || 'Phong cách concept được thiết kế độc đáo, giúp tạo nên những bộ ảnh ấn tượng và giàu cảm xúc.'}
              </p>

              {!!concept.tags?.length && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {concept.tags.map((tag) => (
                    <span
                      key={tag}
                      className="break-words rounded-full border border-neutral-200 px-3 py-1.5 text-xs text-neutral-600 dark:border-neutral-700 dark:text-neutral-300"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-8 rounded-[24px] border border-dashed border-neutral-200 p-5 dark:border-white/10 bg-neutral-50 dark:bg-white/5">
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Dịch vụ phù hợp cho Concept này
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {concept.relatedServices?.length > 0 ? (
                    concept.relatedServices.map((service) => (
                      <span
                        key={service._id || service}
                        className="break-words rounded-full bg-white px-3 py-1.5 text-sm font-medium text-neutral-800 border border-neutral-200 dark:border-white/10 dark:bg-transparent dark:text-neutral-200 shadow-sm"
                      >
                        {service.name || service}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">
                      Chưa liên kết dịch vụ cụ thể
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-auto pt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  to="/booking"
                  className="inline-flex flex-1 items-center justify-center rounded-2xl bg-black px-6 py-4 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:shadow-lg dark:bg-primary dark:text-black"
                >
                  Đặt lịch concept này
                </Link>

                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center justify-center rounded-2xl border border-neutral-200 bg-white px-8 py-4 text-sm font-bold text-neutral-800 transition hover:-translate-y-0.5 hover:border-primary hover:text-primary dark:border-white/10 dark:bg-white/5 dark:text-white"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const ConceptPage = () => {
  const [concepts, setConcepts] = useState([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState('all')
  const [selectedConcept, setSelectedConcept] = useState(null)

  // State cho trình xem ảnh Fullscreen
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerImages, setViewerImages] = useState([])
  const [viewerIndex, setViewerIndex] = useState(0)

  useEffect(() => {
    const fetchConcepts = async () => {
      try {
        const res = await getConcepts()
        setConcepts(res.data?.data || res.data?.concepts || [])
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetchConcepts()
  }, [])

  // Xử lý phím tắt cho trình xem ảnh
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

  // Hàm mở Viewer
  const openViewer = (images, startIndex) => {
    setViewerImages(images)
    setViewerIndex(startIndex)
    setViewerOpen(true)
  }

  const filteredConcepts = useMemo(() => {
    return concepts.filter((item) => {
      const matchCategory = category === 'all' || item.category === category
      const matchKeyword =
        item.name?.toLowerCase().includes(keyword.toLowerCase()) ||
        item.description?.toLowerCase().includes(keyword.toLowerCase()) ||
        item.tags?.some((tag) => tag.toLowerCase().includes(keyword.toLowerCase()))
      return matchCategory && matchKeyword
    })
  }, [concepts, category, keyword])

  const featuredConcept = filteredConcepts[0]
  const remainingConcepts = filteredConcepts.slice(1)

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f8f5ef,transparent_35%),linear-gradient(to_bottom,#faf7f2,#f6f7fb)] dark:bg-[radial-gradient(circle_at_top,#1a1408,transparent_22%),linear-gradient(to_bottom,#09090b,#0f1117)] dark:text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {/* HERO */}
        <section className="relative overflow-hidden rounded-[36px] border border-white/60 bg-black shadow-[0_30px_80px_rgba(15,23,42,0.18)] dark:border-white/10">
          <img
            src="https://images.unsplash.com/photo-1519741497674-611481863552?w=1600&auto=format&fit=crop"
            alt="Concept hero"
            className="absolute inset-0 h-full w-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,0,0,0.86),rgba(0,0,0,0.45),rgba(201,168,76,0.18))]" />

          <div className="relative px-6 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Creative Inspirations
              </div>

              <h1 className="mt-6 text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
                Bộ sưu tập
                <span className="text-primary"> concept </span>
                cho từng phong cách riêng
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-white/75 sm:text-lg">
                Khám phá những ý tưởng chụp ảnh nổi bật, từ nhẹ nhàng lãng mạn đến
                cá tính thời trang, để tìm ra concept phù hợp nhất với cá tính và mục đích buổi chụp của bạn.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to="/booking"
                  className="inline-flex items-center justify-center rounded-2xl bg-primary px-7 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-black shadow-lg shadow-primary/20 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl"
                >
                  Đặt lịch theo concept
                </Link>

                <Link
                  to="/services"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-7 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:bg-white/15"
                >
                  Xem dịch vụ
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FILTER */}
        <section className="py-10">
          <div className="rounded-[30px] border border-black/5 bg-white/85 p-5 shadow-[0_12px_40px_rgba(15,23,42,0.05)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5 sm:p-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="max-w-xl flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
                  Find your style
                </p>
                <h2 className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">
                  Tìm concept phù hợp với bạn
                </h2>
                <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                  Tìm kiếm theo tên, mô tả hoặc tag, sau đó lọc theo phong cách để chọn concept ưng ý nhất.
                </p>
              </div>

              <div className="w-full xl:max-w-md">
                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Tìm kiếm concept, tag hoặc mô tả..."
                  className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-neutral-400 focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-white/10 dark:bg-neutral-950/70 dark:text-white"
                />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              {categories.map((item) => {
                const active = category === item

                return (
                  <button
                    key={item}
                    onClick={() => setCategory(item)}
                    className={`rounded-2xl px-4 py-2.5 text-sm font-medium transition duration-300 ${
                      active
                        ? 'bg-black text-white shadow-lg dark:bg-primary dark:text-black'
                        : 'border border-neutral-200 bg-white text-neutral-700 hover:-translate-y-0.5 hover:border-primary hover:text-primary dark:border-white/10 dark:bg-white/5 dark:text-neutral-200 dark:hover:text-primary'
                    }`}
                  >
                    {categoryLabels[item] || item}
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        {/* LOADING */}
        {loading ? (
          <section className="pb-10">
            <div className="animate-pulse space-y-6">
              <div className="h-[430px] rounded-[32px] bg-white/80 dark:bg-white/5" />
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                <div className="h-[380px] rounded-[28px] bg-white/80 dark:bg-white/5" />
                <div className="h-[380px] rounded-[28px] bg-white/80 dark:bg-white/5" />
                <div className="h-[380px] rounded-[28px] bg-white/80 dark:bg-white/5" />
              </div>
            </div>
          </section>
        ) : filteredConcepts.length === 0 ? (
          <section className="pb-10">
            <div className="rounded-[30px] border border-dashed border-neutral-200 bg-white/80 px-6 py-20 text-center shadow-sm dark:border-white/10 dark:bg-white/5">
              <div className="mx-auto max-w-xl">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl text-primary">
                  ✦
                </div>
                <h3 className="text-2xl font-bold text-neutral-900 dark:text-white">
                  Không tìm thấy concept phù hợp
                </h3>
                <p className="mt-3 text-neutral-500 dark:text-neutral-400">
                  Hãy thử đổi từ khóa tìm kiếm hoặc chọn danh mục khác để xem thêm concept phù hợp.
                </p>
                <button
                  onClick={() => {
                    setKeyword('')
                    setCategory('all')
                  }}
                  className="mt-6 inline-flex items-center justify-center rounded-2xl bg-black px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 dark:bg-primary dark:text-black"
                >
                  Xóa bộ lọc
                </button>
              </div>
            </div>
          </section>
        ) : (
          <>
            {/* FEATURED CONCEPT - ĐỒNG BỘ LAYOUT VỚI TRANG DỊCH VỤ */}
            {featuredConcept && (
              <section className="pb-10">
                <div className="overflow-hidden rounded-[32px] border border-black/5 bg-white/90 shadow-[0_12px_40px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-white/5">
                  <div className="grid lg:grid-cols-[1fr_0.9fr]">
                    
                   {/* Ảnh bên trái */}
<div className="relative overflow-hidden">
  <button
    type="button"
    onClick={() => setSelectedConcept(featuredConcept)}
    // 1. Sửa lớp bao ngoài để giới hạn chiều cao:
    className="h-[250px] sm:h-[350px] lg:h-[400px] w-full outline-none block"
  >
    <img
      src={(featuredConcept.images || [featuredConcept.image])[0]?.url || (featuredConcept.images || [featuredConcept.image])[0]}
      alt={featuredConcept.name}
      // 2. Sửa lớp ảnh: Bỏ h-[340px]... đi, dùng h-full w-full object-cover
      className="h-full w-full object-cover transition duration-700 hover:scale-105 cursor-pointer"
    />
  </button>
  
  {/* Các thẻ phụ giữ nguyên vị trí */}
  <div className="absolute top-5 left-5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-neutral-900 shadow-sm">
    Concept nổi bật
  </div>
  <div className="absolute bottom-5 right-5 rounded-lg bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
    +{(featuredConcept.images || [featuredConcept.image]).length} ảnh
  </div>
</div>

                    {/* Nội dung bên phải */}
                    <div className="p-6 sm:p-8 lg:p-10 flex flex-col">
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
                        {categoryLabels[featuredConcept.category] || featuredConcept.category}
                      </p>

                      <h2 className="break-words mt-3 text-3xl font-bold text-neutral-900 dark:text-white sm:text-4xl">
                        {featuredConcept.name}
                      </h2>

                      <p className="break-words whitespace-pre-wrap mt-5 leading-8 text-neutral-600 dark:text-neutral-300">
                        {featuredConcept.description || 'Concept nổi bật với phong cách ấn tượng, phù hợp để tạo nên những bộ ảnh tinh tế và đầy cảm xúc.'}
                      </p>

                      {!!featuredConcept.tags?.length && (
                        <div className="mt-5 flex flex-wrap gap-2">
                          {featuredConcept.tags.map((tag) => (
                            <span
                              key={tag}
                              className="break-words rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:border-white/10 dark:bg-white/5 dark:text-neutral-300"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Các nút bấm luôn nằm dưới cùng */}
                      <div className="mt-auto pt-8 flex flex-wrap gap-4">
                        <button
                          type="button"
                          onClick={() => setSelectedConcept(featuredConcept)}
                          className="inline-flex items-center justify-center rounded-2xl border border-neutral-200 bg-white px-6 py-3.5 text-sm font-semibold text-neutral-800 transition hover:-translate-y-0.5 hover:border-primary hover:text-primary dark:border-white/10 dark:bg-white/5 dark:text-white"
                        >
                          Xem bộ ảnh
                        </button>
                        
                        <Link
                          to="/booking"
                          className="inline-flex items-center justify-center rounded-2xl bg-black px-6 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 dark:bg-primary dark:text-black"
                        >
                          Đặt lịch concept này
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* GRID CONCEPTS */}
            <section className="pb-10">
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
                    Collection
                  </p>
                  <h2 className="mt-2 text-3xl font-bold text-neutral-900 dark:text-white">
                    Tất cả concept phù hợp
                  </h2>
                </div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Tìm thấy <span className="font-semibold text-neutral-900 dark:text-white">{filteredConcepts.length}</span> concept
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {remainingConcepts.map((concept) => {
                  const conceptImages = Array.isArray(concept.images) ? concept.images : concept.image ? [concept.image] : []
                  const coverImage = conceptImages[0]?.url || conceptImages[0]

                  return (
                    <div
                      key={concept._id}
                      className="group flex flex-col h-full overflow-hidden rounded-[28px] border border-black/5 bg-white/90 shadow-[0_12px_40px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_55px_rgba(15,23,42,0.1)] dark:border-white/10 dark:bg-white/5"
                    >
                      <div className="relative overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setSelectedConcept(concept)}
                          className="block w-full outline-none"
                        >
                          <img
                            src={coverImage}
                            alt={concept.name}
                            className="h-80 w-full object-cover transition duration-700 group-hover:scale-110 cursor-pointer"
                          />
                        </button>
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                        <div className="absolute bottom-4 left-4">
                          <span className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-900">
                            {categoryLabels[concept.category] || concept.category}
                          </span>
                        </div>
                        <div className="absolute bottom-4 right-4 rounded-lg bg-black/60 px-2 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
                          +{(conceptImages).length} ảnh
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col p-5">
                        <h3 className="break-words text-2xl font-bold text-neutral-900 dark:text-white">
                          {concept.name}
                        </h3>

                        <p className="break-words whitespace-pre-wrap mt-3 line-clamp-3 text-sm leading-7 text-neutral-600 dark:text-neutral-300">
                          {concept.description}
                        </p>

                        {!!concept.tags?.length && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {concept.tags.map((tag) => (
                              <span
                                key={tag}
                                className="break-words rounded-full border border-neutral-200 px-2.5 py-1 text-xs text-neutral-600 dark:border-neutral-700 dark:text-neutral-300"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="mt-auto flex items-center justify-between pt-6">
                          <button
                            type="button"
                            onClick={() => setSelectedConcept(concept)}
                            className="text-sm font-semibold text-neutral-700 transition hover:text-primary dark:text-neutral-200 dark:hover:text-primary"
                          >
                            Xem bộ ảnh
                          </button>

                          <Link
                            to="/booking"
                            className="inline-flex items-center justify-center rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 dark:bg-primary dark:text-black"
                          >
                            Đặt lịch
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          </>
        )}
      </div>

      <ConceptDetailModal
        concept={selectedConcept}
        onClose={() => setSelectedConcept(null)}
        openViewer={openViewer}
      />

      {/* TRÌNH XEM ẢNH FULLSCREEN */}
      {viewerOpen && viewerImages.length > 0 && (
        <div className="fixed inset-0 z-[9999] flex flex-col bg-black/95 backdrop-blur-xl">
          {/* Top Bar */}
          <div className="flex items-center justify-between p-4 sm:p-6">
            <div className="text-white">
              <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-bold tracking-widest text-neutral-200">
                {viewerIndex + 1} / {viewerImages.length}
              </span>
            </div>
            <button
              onClick={() => setViewerOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 hover:scale-110"
            >
              <span className="text-lg leading-none">✕</span>
            </button>
          </div>

          {/* Main Image */}
          <div className="relative flex min-h-0 flex-1 items-center justify-center p-4">
            <button
              onClick={() => setViewerIndex((prev) => (prev === 0 ? viewerImages.length - 1 : prev - 1))}
              className="absolute left-4 sm:left-8 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-black/50 text-2xl text-white backdrop-blur-md transition hover:bg-white/20 hover:scale-110 border border-white/10"
            >
              ‹
            </button>

            <img
              key={viewerIndex}
              src={viewerImages[viewerIndex]?.url || viewerImages[viewerIndex]}
              alt={`View ${viewerIndex}`}
              className="max-h-[85vh] max-w-full select-none rounded-sm object-contain shadow-2xl transition-transform duration-300 animate-in fade-in zoom-in-95"
            />

            <button
              onClick={() => setViewerIndex((prev) => (prev === viewerImages.length - 1 ? 0 : prev + 1))}
              className="absolute right-4 sm:right-8 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-black/50 text-2xl text-white backdrop-blur-md transition hover:bg-white/20 hover:scale-110 border border-white/10"
            >
              ›
            </button>
          </div>

          {/* Thumbnails */}
          <div className="flex h-24 items-center justify-center gap-2 overflow-x-auto bg-black/40 px-4 py-2 sm:gap-3">
            {viewerImages.map((img, index) => {
              const url = img.url || img
              const isActive = viewerIndex === index
              return (
                <button
                  key={index}
                  onClick={() => setViewerIndex(index)}
                  className={`group relative h-14 w-14 shrink-0 overflow-hidden rounded-lg transition-all duration-300 sm:h-16 sm:w-16 ${
                    isActive
                      ? 'scale-105 border-2 border-white opacity-100'
                      : 'opacity-40 hover:opacity-100'
                  }`}
                >
                  <img src={url} className="h-full w-full object-cover" alt="thumbnail" />
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default ConceptPage