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

const ConceptPage = () => {
  const [concepts, setConcepts] = useState([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState('all')

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
            {/* FEATURED CONCEPT */}
            {featuredConcept && (
              <section className="pb-8">
                <div className="overflow-hidden rounded-[32px] border border-black/5 bg-white/90 shadow-[0_12px_40px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-white/5">
                  <div className="grid lg:grid-cols-[1.2fr_0.9fr]">
                    <div className="relative overflow-hidden">
                      <img
                        src={featuredConcept.image}
                        alt={featuredConcept.name}
                        className="h-[340px] w-full object-cover sm:h-[420px] lg:h-full"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                      <div className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-900">
                        Concept nổi bật
                      </div>
                    </div>

                    <div className="p-6 sm:p-8 lg:p-10">
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
                        {featuredConcept.category || 'Concept'}
                      </p>

                      <h2 className="mt-3 text-3xl font-bold text-neutral-900 dark:text-white sm:text-4xl">
                        {featuredConcept.name}
                      </h2>

                      <p className="mt-5 leading-8 text-neutral-600 dark:text-neutral-300">
                        {featuredConcept.description || 'Concept nổi bật với phong cách ấn tượng, phù hợp để tạo nên những bộ ảnh tinh tế và đầy cảm xúc.'}
                      </p>

                      {!!featuredConcept.tags?.length && (
                        <div className="mt-6 flex flex-wrap gap-2">
                          {featuredConcept.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:border-white/10 dark:bg-white/5 dark:text-neutral-300"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="mt-8 flex flex-wrap gap-4">
                        <Link
                          to="/booking"
                          className="inline-flex items-center justify-center rounded-2xl bg-black px-6 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 dark:bg-primary dark:text-black"
                        >
                          Đặt lịch concept này
                        </Link>
                        <Link
                          to="/services"
                          className="inline-flex items-center justify-center rounded-2xl border border-neutral-200 bg-white px-6 py-3.5 text-sm font-semibold text-neutral-800 transition hover:-translate-y-0.5 hover:border-primary hover:text-primary dark:border-white/10 dark:bg-white/5 dark:text-white"
                        >
                          Tham khảo dịch vụ
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
                {remainingConcepts.map((concept) => (
                  <div
                    key={concept._id}
                    className="group overflow-hidden rounded-[28px] border border-black/5 bg-white/90 shadow-[0_12px_40px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_55px_rgba(15,23,42,0.1)] dark:border-white/10 dark:bg-white/5"
                  >
                    <div className="relative overflow-hidden">
                      <img
                        src={concept.image}
                        alt={concept.name}
                        className="h-80 w-full object-cover transition duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                      <div className="absolute bottom-4 left-4">
                        <span className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-900">
                          {concept.category || 'Concept'}
                        </span>
                      </div>
                    </div>

                    <div className="p-5">
                      <h3 className="text-2xl font-bold text-neutral-900 dark:text-white">
                        {concept.name}
                      </h3>

                      <p className="mt-3 line-clamp-3 text-sm leading-7 text-neutral-600 dark:text-neutral-300">
                        {concept.description}
                      </p>

                      {!!concept.tags?.length && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {concept.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:border-white/10 dark:bg-white/5 dark:text-neutral-300"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="mt-6 flex items-center justify-between">
                        <Link
                          to="/booking"
                          className="inline-flex items-center justify-center rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 dark:bg-primary dark:text-black"
                        >
                          Đặt lịch
                        </Link>

                        <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-300">
                          {categoryLabels[concept.category] || concept.category}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  )
}

export default ConceptPage