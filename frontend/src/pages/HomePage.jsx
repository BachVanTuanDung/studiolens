import { useEffect, useMemo, useState } from 'react'
import { getServices } from '../api/serviceApi'
import { getConcepts } from '../api/conceptApi'
import { Link } from 'react-router-dom'
import { formatCurrency } from '../utils/formatCurrency'

const fallbackImages = [
  'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1519741497674-611481863552?w=1400&auto=format&fit=crop',
]

const features = [
  {
    number: '01',
    title: 'Tư vấn concept',
    desc: 'Gợi ý phong cách chụp, bối cảnh, outfit và màu ảnh phù hợp với từng khách hàng.',
  },
  {
    number: '02',
    title: 'Đặt lịch tinh gọn',
    desc: 'Chọn dịch vụ, ngày chụp, buổi chụp và thanh toán trong một quy trình rõ ràng.',
  },
  {
    number: '03',
    title: 'Giao ảnh chuyên nghiệp',
    desc: 'Khách xem gallery, chọn ảnh, theo dõi ảnh đã chỉnh và tải ảnh hoàn thiện dễ dàng.',
  },
]

const stats = [
  { value: '100+', label: 'Bộ ảnh hoàn thiện' },
  { value: '4.9/5', label: 'Đánh giá trải nghiệm' },
  { value: '24/7', label: 'Hỗ trợ đặt lịch' },
]

const processSteps = [
  {
    step: 'Moodboard',
    title: 'Chọn ý tưởng',
    desc: 'Khách hàng tham khảo concept và dịch vụ phù hợp với nhu cầu chụp.',
  },
  {
    step: 'Booking',
    title: 'Khóa lịch chụp',
    desc: 'Hệ thống kiểm tra lịch theo ngày và buổi để tránh trùng slot.',
  },
  {
    step: 'Selection',
    title: 'Chọn ảnh',
    desc: 'Sau buổi chụp, khách xem album cá nhân và chọn ảnh cần chỉnh.',
  },
  {
    step: 'Delivery',
    title: 'Nhận ảnh',
    desc: 'Ảnh đã chỉnh được cập nhật trong gallery để xem, so sánh và tải về.',
  },
]

const conceptLayouts = [
  {
    wrapper: 'md:col-span-7 md:row-span-2 xl:col-span-7',
    image: 'h-[430px] md:h-full',
    title: 'text-3xl sm:text-4xl',
    tag: 'Signature frame',
  },
  {
    wrapper: 'md:col-span-5 xl:col-span-5',
    image: 'h-[270px]',
    title: 'text-2xl',
    tag: 'Soft light',
  },
  {
    wrapper: 'md:col-span-5 xl:col-span-3',
    image: 'h-[330px] xl:h-[370px]',
    title: 'text-2xl',
    tag: 'Portrait mood',
  },
  {
    wrapper: 'md:col-span-7 xl:col-span-9',
    image: 'h-[330px] xl:h-[370px]',
    title: 'text-2xl sm:text-3xl',
    tag: 'Editorial set',
  },
]

const HomePage = () => {
  const [services, setServices] = useState([])
  const [concepts, setConcepts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [serviceRes, conceptRes] = await Promise.all([
          getServices(),
          getConcepts({ featured: true }),
        ])

        setServices((serviceRes.data?.data || []).slice(0, 3))
        setConcepts((conceptRes.data?.data || []).slice(0, 4))
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchHomeData()
  }, [])

  const heroImages = useMemo(() => {
    const dynamicImages = [
      concepts[0]?.image,
      services[0]?.thumbnail,
      concepts[1]?.image,
      services[1]?.thumbnail,
    ].filter(Boolean)

    return [...dynamicImages, ...fallbackImages].slice(0, 4)
  }, [concepts, services])

  const handleImageError = (e) => {
    e.currentTarget.src = fallbackImages[0]
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f1e8] dark:bg-[#070707] dark:text-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-7">
            <div className="h-[620px] rounded-[40px] bg-white/80 shadow-sm dark:bg-white/5" />
            <div className="grid gap-5 md:grid-cols-3">
              <div className="h-[220px] rounded-[32px] bg-white/80 dark:bg-white/5" />
              <div className="h-[220px] rounded-[32px] bg-white/80 dark:bg-white/5" />
              <div className="h-[220px] rounded-[32px] bg-white/80 dark:bg-white/5" />
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="h-[420px] rounded-[32px] bg-white/80 dark:bg-white/5" />
              <div className="h-[420px] rounded-[32px] bg-white/80 dark:bg-white/5" />
              <div className="h-[420px] rounded-[32px] bg-white/80 dark:bg-white/5" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[#f6f1e8] text-neutral-950 dark:bg-[#070707] dark:text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-0 top-0 h-[420px] w-[420px] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute right-0 top-40 h-[420px] w-[420px] rounded-full bg-black/10 blur-[120px] dark:bg-primary/10" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.035)_1px,transparent_1px)] bg-[size:72px_72px] opacity-40 dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* HERO - compact height so users can see part of the next section on first screen */}
        <section className="relative overflow-hidden rounded-[40px] border border-black/5 bg-[#111] p-2 shadow-[0_32px_90px_rgba(15,23,42,0.18)] dark:border-white/10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(201,168,76,0.26),transparent_34%),linear-gradient(135deg,#050505,#121212_48%,#2a210d)]" />
          <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(90deg,#fff_1px,transparent_1px),linear-gradient(#fff_1px,transparent_1px)] [background-size:44px_44px]" />

          <div className="relative grid gap-6 rounded-[34px] border border-white/10 bg-black/20 p-4 backdrop-blur-sm lg:grid-cols-[0.9fr_1.1fr] lg:p-6">
            <div className="flex min-h-[455px] flex-col justify-between rounded-[28px] border border-white/10 bg-white/[0.04] p-5 text-white lg:p-6">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-primary">
                  <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_20px_rgba(201,168,76,0.9)]" />
                  StudioLens Creative Studio
                </div>

                <h1 className="mt-5 text-4xl font-black leading-[0.96] tracking-tight text-white sm:text-5xl xl:text-6xl">
                  Chụp ảnh
                  <span className="block text-primary">có concept</span>
                  có cảm xúc
                </h1>

                <p className="mt-5 max-w-xl text-sm leading-7 text-white/72 sm:text-base">
                  Một trải nghiệm studio hiện đại dành cho khách hàng yêu thích sự chỉn chu:
                  từ đặt lịch, chọn concept, thanh toán, xem gallery đến nhận ảnh đã chỉnh.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    to="/booking"
                    className="inline-flex items-center justify-center rounded-2xl bg-primary px-6 py-3.5 text-xs font-bold uppercase tracking-[0.18em] text-black shadow-[0_18px_35px_rgba(201,168,76,0.28)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_45px_rgba(201,168,76,0.38)]"
                  >
                    Đặt lịch ngay
                  </Link>

                  <Link
                    to="/concept"
                    className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-6 py-3.5 text-xs font-bold uppercase tracking-[0.18em] text-white backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:bg-white/15"
                  >
                    Xem concept
                  </Link>
                </div>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {stats.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-white/10 bg-white/[0.07] p-3.5 backdrop-blur-md"
                  >
                    <p className="text-xl font-black text-white">{item.value}</p>
                    <p className="mt-1 text-xs leading-5 text-white/58">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative min-h-[455px] overflow-hidden rounded-[28px]">
              <div className="grid h-full grid-cols-12 grid-rows-12 gap-3">
                <div className="group relative col-span-7 row-span-12 overflow-hidden rounded-[26px] bg-neutral-900">
                  <img
                    src={heroImages[0]}
                    alt="Studio portrait"
                    onError={handleImageError}
                    className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">
                      Main Frame
                    </p>
                    <h2 className="mt-2 text-2xl font-black text-white">
                      Visual Storytelling
                    </h2>
                  </div>
                </div>

                <div className="group relative col-span-5 row-span-5 overflow-hidden rounded-[26px] bg-neutral-900">
                  <img
                    src={heroImages[1]}
                    alt="Studio detail"
                    onError={handleImageError}
                    className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-black">
                    ISO 200
                  </div>
                </div>

                <div className="group relative col-span-5 row-span-4 overflow-hidden rounded-[26px] bg-neutral-900">
                  <img
                    src={heroImages[2]}
                    alt="Creative concept"
                    onError={handleImageError}
                    className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-3 left-3 rounded-full bg-primary px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-black">
                    f/1.8
                  </div>
                </div>

                <div className="relative col-span-5 row-span-3 overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.08] p-4 text-white backdrop-blur-md">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
                    Studio Board
                  </p>
                  <p className="mt-2 text-xl font-black">Light • Mood • Color</p>
                  <p className="mt-1 text-xs leading-5 text-white/62">
                    Thiết kế trải nghiệm như một quy trình sản xuất ảnh chuyên nghiệp.
                  </p>
                </div>
              </div>

              <div className="pointer-events-none absolute left-4 top-4 h-10 w-10 border-l-2 border-t-2 border-white/80" />
              <div className="pointer-events-none absolute bottom-4 right-4 h-10 w-10 border-b-2 border-r-2 border-white/80" />
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="py-10 sm:py-12">
          <div className="mb-9 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-primary">
                Why choose us
              </p>
              <h2 className="mt-3 max-w-2xl text-3xl font-black tracking-tight text-neutral-950 dark:text-white sm:text-5xl">
                Quy trình làm việc chuẩn studio
              </h2>
            </div>
            <p className="max-w-md text-sm leading-7 text-neutral-600 dark:text-neutral-300">
              Không chỉ là web giới thiệu, StudioLens mô phỏng một quy trình dịch vụ ảnh từ tư vấn,
              booking, chụp, chọn ảnh đến bàn giao sản phẩm.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group relative overflow-hidden rounded-[34px] border border-black/5 bg-white/82 p-6 shadow-[0_18px_55px_rgba(15,23,42,0.07)] backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-white/[0.06]"
              >
                <div className="absolute right-5 top-4 text-7xl font-black leading-none text-neutral-900/[0.04] dark:text-white/[0.06]">
                  {feature.number}
                </div>
                <div className="mb-8 inline-flex h-13 w-13 items-center justify-center rounded-2xl bg-black text-sm font-black text-primary shadow-lg dark:bg-primary dark:text-black">
                  {feature.number}
                </div>
                <h3 className="relative text-2xl font-black text-neutral-950 dark:text-white">
                  {feature.title}
                </h3>
                <p className="relative mt-4 leading-7 text-neutral-600 dark:text-neutral-300">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* SERVICES */}
        <section className="pb-14 sm:pb-16">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-primary">
                Featured services
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-neutral-950 dark:text-white sm:text-4xl">
                Gói dịch vụ nổi bật
              </h2>
              <p className="mt-3 max-w-2xl leading-7 text-neutral-600 dark:text-neutral-300">
                Các gói chụp được trình bày như portfolio card, giúp khách nhìn nhanh phong cách,
                mức giá và hành động đặt lịch.
              </p>
            </div>

            <Link
              to="/services"
              className="inline-flex items-center text-sm font-bold uppercase tracking-[0.18em] text-primary transition hover:translate-x-1"
            >
              Xem tất cả →
            </Link>
          </div>

          <div className="grid items-stretch gap-6 md:grid-cols-2 xl:grid-cols-3">
            {services.map((service, index) => (
              <div
                key={service._id}
                className="group relative flex h-full flex-col overflow-hidden rounded-[34px] border border-black/5 bg-white/88 p-2 shadow-[0_18px_55px_rgba(15,23,42,0.08)] transition duration-500 hover:-translate-y-1 hover:shadow-[0_30px_80px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-white/[0.06]"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-[28px] bg-neutral-200 dark:bg-neutral-800">
                  <img
                    src={service.thumbnail || fallbackImages[index % fallbackImages.length]}
                    alt={service.name}
                    onError={handleImageError}
                    className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                  <div className="absolute left-4 top-4 rounded-full border border-white/15 bg-black/35 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-white backdrop-blur-md">
                    Service 0{index + 1}
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
                      Studio Package
                    </p>
                    <h3 className="mt-2 line-clamp-2 text-2xl font-black leading-tight text-white">
                      {service.name}
                    </h3>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-primary px-4 py-2 text-sm font-black text-black shadow-lg">
                      {formatCurrency(service.price)}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">
                      Premium
                    </span>
                  </div>

                  <p className="mt-4 line-clamp-3 text-sm leading-7 text-neutral-600 dark:text-neutral-300">
                    {service.description}
                  </p>

                  <div className="mt-auto flex items-center justify-between gap-3 pt-6">
                    <Link
                      to="/booking"
                      className="inline-flex items-center justify-center rounded-2xl bg-black px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 dark:bg-primary dark:text-black"
                    >
                      Đặt lịch
                    </Link>

                    <Link
                      to="/services"
                      className="text-sm font-bold text-neutral-700 transition hover:text-primary dark:text-neutral-200 dark:hover:text-primary"
                    >
                      Xem chi tiết
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CONCEPTS */}
        <section className="pb-14 sm:pb-16">
          <div className="mb-8 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-primary">
              Creative inspirations
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-neutral-950 dark:text-white sm:text-5xl">
              Concept nổi bật
            </h2>
            <p className="mx-auto mt-4 max-w-2xl leading-7 text-neutral-600 dark:text-neutral-300">
              Bố cục kiểu bento/magazine giúp trang chủ có cảm giác như portfolio nhiếp ảnh,
              không bị giống một web quản trị thông thường.
            </p>
          </div>

          {concepts.length > 0 ? (
            <div className="relative">
              <div className="pointer-events-none absolute -left-10 top-20 hidden h-40 w-40 rounded-full bg-primary/20 blur-3xl lg:block" />
              <div className="pointer-events-none absolute -right-10 bottom-10 hidden h-52 w-52 rounded-full bg-black/10 blur-3xl dark:bg-primary/10 lg:block" />

              <div className="grid auto-rows-[minmax(240px,auto)] gap-5 md:grid-cols-12">
                {concepts.map((concept, index) => {
                  const layout = conceptLayouts[index] || conceptLayouts[conceptLayouts.length - 1]

                  return (
                    <Link
                      key={concept._id}
                      to="/concept"
                      className={`group relative overflow-hidden rounded-[34px] border border-white/70 bg-white/80 p-2 shadow-[0_18px_55px_rgba(15,23,42,0.08)] transition duration-500 hover:-translate-y-1 hover:shadow-[0_28px_75px_rgba(15,23,42,0.16)] dark:border-white/10 dark:bg-white/[0.06] ${layout.wrapper}`}
                    >
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(201,168,76,0.22),transparent_34%)] opacity-0 transition duration-500 group-hover:opacity-100" />

                      <div className={`relative overflow-hidden rounded-[28px] bg-neutral-200 dark:bg-neutral-800 ${layout.image}`}>
                        <img
                          src={concept.image || fallbackImages[index % fallbackImages.length]}
                          alt={concept.name}
                          onError={handleImageError}
                          className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(201,168,76,0.12),transparent_42%,rgba(0,0,0,0.18))]" />

                        <div className="absolute left-5 top-5 flex items-center gap-2">
                          <span className="rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-900 shadow-lg">
                            {concept.category || 'Concept'}
                          </span>
                          <span className="hidden rounded-full border border-white/20 bg-black/35 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-md sm:inline-flex">
                            {layout.tag}
                          </span>
                        </div>

                        <div className="absolute bottom-4 left-4 right-4">
                          <div className="mb-3 flex items-center gap-3">
                            <span className="h-px w-10 bg-primary" />
                            <span className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
                              0{index + 1}
                            </span>
                          </div>

                          <h3 className={`max-w-xl font-black leading-tight text-white ${layout.title}`}>
                            {concept.name}
                          </h3>

                          <p className="mt-3 line-clamp-2 max-w-xl text-sm leading-6 text-white/75">
                            {concept.description ||
                              'Một concept được StudioLens chọn lọc để tạo nên bộ ảnh có cảm xúc và dấu ấn riêng.'}
                          </p>
                        </div>

                        <div className="absolute bottom-5 right-5 hidden h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/15 text-xl text-white backdrop-blur-md transition duration-500 group-hover:translate-x-1 group-hover:bg-primary group-hover:text-black md:flex">
                          →
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="rounded-[30px] border border-black/5 bg-white/85 p-10 text-center shadow-sm dark:border-white/10 dark:bg-white/5">
              <p className="text-neutral-500 dark:text-neutral-400">
                Chưa có concept nổi bật để hiển thị.
              </p>
            </div>
          )}
        </section>

        {/* PROCESS */}
        <section className="pb-14 sm:pb-16">
          <div className="overflow-hidden rounded-[40px] border border-black/5 bg-neutral-950 p-6 text-white shadow-[0_30px_90px_rgba(0,0,0,0.22)] dark:border-white/10 lg:p-8">
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.35em] text-primary">
                  Production workflow
                </p>
                <h2 className="mt-4 text-3xl font-black leading-tight sm:text-5xl">
                  Từ ý tưởng đến bộ ảnh hoàn thiện
                </h2>
                <p className="mt-5 leading-8 text-white/65">
                  Phần này giúp trang chủ nhìn đúng chất studio: có quy trình sản xuất,
                  có tư duy hình ảnh và có trải nghiệm hậu kỳ rõ ràng.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {processSteps.map((item, index) => (
                  <div
                    key={item.title}
                    className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-md"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
                        {item.step}
                      </span>
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-sm font-black">
                        {index + 1}
                      </span>
                    </div>
                    <h3 className="mt-5 text-xl font-black">{item.title}</h3>
                    <p className="mt-1 text-xs leading-5 text-white/62">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="pb-10">
          <div className="relative overflow-hidden rounded-[44px] border border-black/5 bg-[linear-gradient(135deg,#111111,#1f1f1f,#2b210a)] px-6 py-16 text-center text-white shadow-[0_25px_70px_rgba(0,0,0,0.2)] dark:border-white/10 sm:px-10 sm:py-20">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(201,168,76,0.22),transparent_35%)]" />
            <div className="absolute left-8 top-8 h-14 w-14 border-l-2 border-t-2 border-primary/70" />
            <div className="absolute bottom-8 right-8 h-14 w-14 border-b-2 border-r-2 border-primary/70" />

            <div className="relative mx-auto max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-primary">
                Let’s create something beautiful
              </p>

              <h2 className="mt-4 text-3xl font-black leading-tight sm:text-6xl">
                Sẵn sàng tạo nên bộ ảnh thật ấn tượng?
              </h2>

              <p className="mt-6 text-base leading-8 text-white/75 sm:text-lg">
                Mỗi concept là một câu chuyện riêng. Hãy để StudioLens đồng hành cùng bạn
                để biến ý tưởng thành những khung hình tinh tế và đáng nhớ.
              </p>

              <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
                <Link
                  to="/booking"
                  className="inline-flex items-center justify-center rounded-2xl bg-primary px-8 py-4 text-sm font-bold uppercase tracking-[0.18em] text-black shadow-lg shadow-primary/20 transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  Đặt lịch ngay
                </Link>

                <Link
                  to="/concept"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-8 py-4 text-sm font-bold uppercase tracking-[0.18em] text-white backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:bg-white/15"
                >
                  Xem concept
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default HomePage
