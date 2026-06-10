import { useEffect, useMemo, useState } from 'react'
import { getServices } from '../api/serviceApi'
import { Link } from 'react-router-dom'
import { formatCurrency } from '../utils/formatCurrency'

const categories = ['all', 'wedding', 'portrait', 'fashion', 'family', 'event', 'editorial']

const categoryLabels = {
  all: 'Tất cả',
  wedding: 'Wedding',
  portrait: 'Portrait',
  fashion: 'Fashion',
  family: 'Family',
  event: 'Event',
  editorial: 'Editorial',
}

const ServiceDetailModal = ({ service, onClose }) => {
  if (!service) return null

  return (
    <div className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-[3px]">
      <div className="flex min-h-screen items-center justify-center p-4 md:p-6">
        <div className="relative w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/10 bg-white shadow-2xl dark:bg-[#101216] dark:text-white">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 bg-white/90 text-xl text-neutral-700 shadow-md transition hover:scale-105 hover:bg-white dark:border-white/10 dark:bg-black/40 dark:text-white dark:hover:bg-black/60"
          >
            ✕
          </button>

          <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
            <div className="relative overflow-hidden bg-black">
              <img
                src={service.thumbnail}
                alt={service.name}
                className="h-[320px] w-full object-cover sm:h-[420px] lg:h-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

              <div className="absolute bottom-5 left-5 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-900">
                  {categoryLabels[service.category] || service.category || 'Service'}
                </span>

                <span className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-black shadow-lg">
                  {formatCurrency(service.price)}
                </span>
              </div>
            </div>

            <div className="p-6 sm:p-8 lg:p-10">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
                Chi tiết dịch vụ
              </p>

              <h2 className="break-words mt-3 text-3xl font-bold text-neutral-900 dark:text-white sm:text-4xl">
                {service.name}
              </h2>

              <p className="break-words whitespace-pre-wrap mt-5 leading-8 text-neutral-600 dark:text-neutral-300">
                {service.description || 'Dịch vụ được thiết kế chỉn chu, phù hợp cho những buổi chụp chuyên nghiệp và giàu cảm xúc.'}
              </p>

              {service.features && service.features.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {service.features.map((feature) => (
                    <span
                      key={feature}
                      className="break-words rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-600 dark:border-neutral-700 dark:text-neutral-300"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-neutral-50 px-4 py-4 dark:bg-white/5">
                  <p className="text-xs uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">
                    Danh mục
                  </p>
                  <p className="mt-2 text-lg font-bold text-neutral-900 dark:text-white">
                    {categoryLabels[service.category] || service.category || '--'}
                  </p>
                </div>

                <div className="rounded-2xl bg-neutral-50 px-4 py-4 dark:bg-white/5">
                  <p className="text-xs uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">
                    Giá dịch vụ
                  </p>
                  <p className="mt-2 text-lg font-bold text-neutral-900 dark:text-white">
                    {formatCurrency(service.price)}
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-[24px] border border-dashed border-neutral-200 p-4 dark:border-white/10">
                <p className="text-sm leading-7 text-neutral-600 dark:text-neutral-300">
                  Gói dịch vụ này phù hợp cho khách hàng muốn có trải nghiệm chụp ảnh chỉn chu,
                  hình ảnh đẹp, bố cục tốt và hậu kỳ chất lượng hơn theo phong cách StudioLens.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to="/booking"
                  className="inline-flex items-center justify-center rounded-2xl bg-black px-6 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 dark:bg-primary dark:text-black"
                >
                  Đặt lịch ngay
                </Link>

                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center justify-center rounded-2xl border border-neutral-200 bg-white px-6 py-3.5 text-sm font-semibold text-neutral-800 transition hover:-translate-y-0.5 hover:border-primary hover:text-primary dark:border-white/10 dark:bg-white/5 dark:text-white"
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

const DiscoverPage = () => {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState('all')
  const [selectedService, setSelectedService] = useState(null)

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await getServices()
        setServices(res.data?.data || [])
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchServices()
  }, [])

  const filteredServices = useMemo(() => {
    return services.filter((item) => {
      const matchCategory = category === 'all' || item.category === category
      const q = keyword.toLowerCase()

      const matchKeyword =
        item.name?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q)

      return matchCategory && matchKeyword
    })
  }, [services, keyword, category])

  const featuredService = filteredServices[0]
  const remainingServices = filteredServices.slice(1)

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f8f5ef,transparent_35%),linear-gradient(to_bottom,#faf7f2,#f6f7fb)] dark:bg-[radial-gradient(circle_at_top,#1a1408,transparent_22%),linear-gradient(to_bottom,#09090b,#0f1117)] dark:text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {/* HERO */}
        <section className="relative overflow-hidden rounded-[36px] border border-white/60 bg-black shadow-[0_30px_80px_rgba(15,23,42,0.18)] dark:border-white/10">
          <img
            src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=1600&auto=format&fit=crop"
            alt="Discover services hero"
            className="absolute inset-0 h-full w-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,0,0,0.86),rgba(0,0,0,0.45),rgba(201,168,76,0.18))]" />

          <div className="relative px-6 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Signature Services
              </div>

              <h1 className="mt-6 text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
                Khám phá những
                <span className="text-primary"> dịch vụ chụp ảnh </span>
                được thiết kế tinh tế
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-white/75 sm:text-lg">
                Từ chân dung cá nhân đến ảnh cưới, family hay fashion lookbook,
                StudioLens mang đến những gói dịch vụ hiện đại, chuyên nghiệp và giàu cảm xúc.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to="/booking"
                  className="inline-flex items-center justify-center rounded-2xl bg-primary px-7 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-black shadow-lg shadow-primary/20 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl"
                >
                  Đặt lịch ngay
                </Link>

                <Link
                  to="/concept"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-7 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:bg-white/15"
                >
                  Xem concept
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
                  Filter services
                </p>
                <h2 className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">
                  Tìm dịch vụ phù hợp với nhu cầu của bạn
                </h2>
                <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                  Tìm theo tên hoặc mô tả dịch vụ, sau đó lọc theo danh mục để chọn gói chụp phù hợp nhất.
                </p>
              </div>

              <div className="w-full xl:max-w-md">
                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Tìm kiếm dịch vụ..."
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
                <div className="h-[420px] rounded-[28px] bg-white/80 dark:bg-white/5" />
                <div className="h-[420px] rounded-[28px] bg-white/80 dark:bg-white/5" />
                <div className="h-[420px] rounded-[28px] bg-white/80 dark:bg-white/5" />
              </div>
            </div>
          </section>
        ) : filteredServices.length === 0 ? (
          <section className="pb-10">
            <div className="rounded-[30px] border border-dashed border-neutral-200 bg-white/80 px-6 py-20 text-center shadow-sm dark:border-white/10 dark:bg-white/5">
              <div className="mx-auto max-w-xl">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl text-primary">
                  ✦
                </div>
                <h3 className="text-2xl font-bold text-neutral-900 dark:text-white">
                  Không tìm thấy dịch vụ phù hợp
                </h3>
                <p className="mt-3 text-neutral-500 dark:text-neutral-400">
                  Hãy thử đổi từ khóa hoặc chọn danh mục khác để khám phá thêm các gói dịch vụ phù hợp.
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
            {/* FEATURED SERVICE */}
            {featuredService && (
              <section className="pb-8">
                <div className="overflow-hidden rounded-[32px] border border-black/5 bg-white/90 shadow-[0_12px_40px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-white/5">
                  <div className="grid lg:grid-cols-[1.2fr_0.9fr]">
                    <div className="relative overflow-hidden">
                      <img
                        src={featuredService.thumbnail}
                        alt={featuredService.name}
                        className="h-[340px] w-full object-cover sm:h-[420px] lg:h-full"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                      <div className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-900">
                        Dịch vụ nổi bật
                      </div>
                      <div className="absolute bottom-5 left-5 rounded-full bg-primary px-4 py-2 text-sm font-bold text-black shadow-lg">
                        {formatCurrency(featuredService.price)}
                      </div>
                    </div>

                    <div className="p-6 sm:p-8 lg:p-10">
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
                        {featuredService.category || 'Service'}
                      </p>

                      <h2 className="break-words mt-3 text-3xl font-bold text-neutral-900 dark:text-white sm:text-4xl">
                        {featuredService.name}
                      </h2>

                      <p className="break-words whitespace-pre-wrap mt-5 leading-8 text-neutral-600 dark:text-neutral-300">
                        {featuredService.description || 'Gói dịch vụ được thiết kế chỉn chu, phù hợp để tạo nên bộ ảnh chuyên nghiệp và giàu cảm xúc.'}
                      </p>

                      {featuredService.features && featuredService.features.length > 0 && (
                        <div className="mt-5 flex flex-wrap gap-2">
                          {featuredService.features.map((feature) => (
                            <span
                              key={feature}
                              className="break-words rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-600 dark:border-neutral-700 dark:text-neutral-300"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="mt-8 flex flex-wrap gap-4">
                        <button
                          type="button"
                          onClick={() => setSelectedService(featuredService)}
                          className="inline-flex items-center justify-center rounded-2xl border border-neutral-200 bg-white px-6 py-3.5 text-sm font-semibold text-neutral-800 transition hover:-translate-y-0.5 hover:border-primary hover:text-primary dark:border-white/10 dark:bg-white/5 dark:text-white"
                        >
                          Xem chi tiết
                        </button>

                        <Link
                          to="/booking"
                          className="inline-flex items-center justify-center rounded-2xl bg-black px-6 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 dark:bg-primary dark:text-black"
                        >
                          Đặt lịch ngay
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* GRID SERVICES */}
            <section className="pb-10">
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
                    Service collection
                  </p>
                  <h2 className="mt-2 text-3xl font-bold text-neutral-900 dark:text-white">
                    Tất cả dịch vụ phù hợp
                  </h2>
                </div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Tìm thấy <span className="font-semibold text-neutral-900 dark:text-white">{filteredServices.length}</span> dịch vụ
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {remainingServices.map((service) => (
                  <div
                    key={service._id}
                    className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-black/5 bg-white/90 shadow-[0_12px_40px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_55px_rgba(15,23,42,0.1)] dark:border-white/10 dark:bg-white/5"
                  >
                    <div className="relative overflow-hidden">
                      <img
                        src={service.thumbnail}
                        alt={service.name}
                        className="h-80 w-full object-cover transition duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                        <span className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-900">
                          {categoryLabels[service.category] || service.category || 'Service'}
                        </span>
                        <span className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-black shadow-lg">
                          {formatCurrency(service.price)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="break-words text-2xl font-bold text-neutral-900 dark:text-white">
                        {service.name}
                      </h3>

                      <p className="break-words whitespace-pre-wrap mt-3 line-clamp-3 text-sm leading-7 text-neutral-600 dark:text-neutral-300">
                        {service.description}
                      </p>

                      {service.features && service.features.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {service.features.map((feature) => (
                            <span
                              key={feature}
                              className="break-words rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-600 dark:border-neutral-700 dark:text-neutral-300"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="mt-auto flex items-center justify-between pt-6">
                        <button
                          type="button"
                          onClick={() => setSelectedService(service)}
                          className="text-sm font-semibold text-neutral-700 transition hover:text-primary dark:text-neutral-200 dark:hover:text-primary"
                        >
                          Xem chi tiết
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
                ))}
              </div>
            </section>
          </>
        )}
      </div>

      <ServiceDetailModal
        service={selectedService}
        onClose={() => setSelectedService(null)}
      />
    </div>
  )
}

export default DiscoverPage