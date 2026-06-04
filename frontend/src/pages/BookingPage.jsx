import { useEffect, useMemo, useState } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { getServices } from '../api/serviceApi'
import { getSuggestedConcepts } from '../api/conceptApi'
import {
  createBooking,
  getBookedSlotsByDate,
  getMonthlyAvailability,
} from '../api/bookingApi'
import { BOOKING_SESSIONS } from '../utils/bookingSessions.js'
import { formatCurrency } from '../utils/formatCurrency'
import toast from 'react-hot-toast'

const formatDateLocal = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatMonthKey = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

const normalizeSessions = (value) => {
  const raw = Array.isArray(value) ? value : value ? [value] : []
  return [...new Set(raw)].filter((item) =>
    BOOKING_SESSIONS.some((session) => session.key === item)
  )
}

const formatSessionLabels = (sessions) => {
  const labels = normalizeSessions(sessions)
    .map((sessionKey) => BOOKING_SESSIONS.find((item) => item.key === sessionKey)?.label)
    .filter(Boolean)

  return labels.length ? labels.join(', ') : '--'
}

const getServiceExtraSessionRate = (service) => {
  const rate = Number(service?.extraSessionRate)
  return Number.isFinite(rate) ? rate : 0.5
}

const calculateBookingPrice = (service, sessions) => {
  const basePrice = Number(service?.price || 0)
  const selectedSessions = normalizeSessions(sessions)
  const sessionCount = selectedSessions.length
  const extraSessionRate = getServiceExtraSessionRate(service)

  if (!service || sessionCount <= 0) {
    return {
      basePrice,
      sessionCount: 0,
      extraSessionCount: 0,
      extraSessionRate,
      extraSessionPrice: 0,
      totalPrice: 0,
    }
  }

  const extraSessionCount = Math.max(sessionCount - 1, 0)
  const extraSessionPrice = Math.round(extraSessionCount * basePrice * extraSessionRate)

  return {
    basePrice,
    sessionCount,
    extraSessionCount,
    extraSessionRate,
    extraSessionPrice,
    totalPrice: Math.round(basePrice + extraSessionPrice),
  }
}

const FeatureChip = ({ children }) => (
  <span className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
    {children}
  </span>
)

const SectionBadge = ({ children }) => (
  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
    {children}
  </p>
)

const PaymentActionModal = ({ paymentData, onClose }) => {
  if (!paymentData) return null

  const paymentStatusLabel =
    paymentData.paymentStatus === 'paid'
      ? 'Đã thanh toán'
      : paymentData.paymentStatus === 'pending'
        ? 'Đang xử lý'
        : 'Chưa thanh toán'

  return (
    <div className="fixed inset-0 z-50 bg-black/70 p-4 backdrop-blur-md">
      <div className="mx-auto mt-2 max-w-5xl overflow-hidden rounded-[34px] border border-white/10 bg-white shadow-2xl dark:bg-[#0F1117] dark:text-white">
        <div className="grid min-h-[560px] lg:grid-cols-[1.02fr_1fr]">
          <div className="relative overflow-hidden bg-[linear-gradient(135deg,#09090b,#171717,#2a210d)] p-8 text-white lg:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(201,168,76,0.18),transparent_35%)]" />
            <div className="relative">
              <p className="text-xs uppercase tracking-[0.35em] text-primary">
                Booking thành công
              </p>

              <h3 className="mt-4 text-3xl font-bold leading-tight lg:text-4xl">
                {paymentData.paymentMethod === 'bank_qr'
                  ? 'Sẵn sàng thanh toán qua payOS'
                  : 'Thanh toán tiền mặt tại studio'}
              </h3>

              <p className="mt-3 text-sm leading-7 text-white/70">
                Booking của bạn đã được tạo thành công. Bạn có thể tiếp tục thanh toán ngay
                hoặc quay lại sau trong mục booking của tôi.
              </p>

              <div className="mt-8 space-y-4 text-sm">
                <div className="rounded-3xl border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                  <p className="text-white/60">Mã booking</p>
                  <p className="mt-2 text-lg font-semibold">{paymentData.bookingCode}</p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                  <p className="text-white/60">Dịch vụ</p>
                  <p className="mt-2 text-lg font-semibold">{paymentData.serviceName}</p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                  <p className="text-white/60">Ngày & buổi chụp</p>
                  <p className="mt-2 text-lg font-semibold">
                    {paymentData.date} • {paymentData.sessionLabel}
                  </p>
                </div>

                <div className="rounded-3xl bg-primary/15 p-4 ring-1 ring-primary/30">
                  <p className="text-primary/80">Tổng thanh toán</p>
                  <p className="mt-2 text-3xl font-bold text-primary">
                    {formatCurrency(paymentData.amount)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center p-8 lg:p-10">
            {paymentData.paymentMethod === 'bank_qr' ? (
              <div className="w-full">
                <div className="mb-6">
                  <p className="text-xs uppercase tracking-[0.25em] text-neutral-500 dark:text-neutral-400">
                    Thanh toán online
                  </p>
                  <h4 className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">
                    Tiếp tục qua payOS
                  </h4>
                  <p className="mt-3 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                    Để hệ thống xác nhận tự động dễ nhất, bạn nên thanh toán trực tiếp trên
                    trang payOS. Sau khi giao dịch xong, website sẽ tự đưa bạn về trang xác nhận.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-5 dark:border-neutral-800 dark:bg-neutral-950">
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      Trạng thái hiện tại
                    </p>
                    <p className="mt-2 text-lg font-semibold">{paymentStatusLabel}</p>
                  </div>

                  <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-5 dark:border-neutral-800 dark:bg-neutral-950">
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      Mã đơn thanh toán
                    </p>
                    <p className="mt-2 break-all text-lg font-semibold">
                      {paymentData.paymentOrderCode || '--'}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-dashed border-neutral-300 bg-neutral-50 p-5 text-sm leading-6 text-neutral-600 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-300">
                    Nếu bạn chọn thanh toán sau, booking vẫn được lưu lại. Bạn có thể mở lại
                    trang thanh toán bất cứ lúc nào trong mục <strong>Booking của tôi</strong>.
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <a
                      href={paymentData.checkoutUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center rounded-2xl bg-primary px-5 py-4 text-sm font-semibold text-black transition hover:opacity-90"
                    >
                      Thanh toán ngay
                    </a>

                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-2xl border border-neutral-300 px-5 py-4 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-100 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-800"
                    >
                      Thanh toán sau
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full rounded-[30px] border border-neutral-200 bg-neutral-50 p-6 dark:border-neutral-800 dark:bg-neutral-950">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-2xl dark:bg-green-900/20">
                  💵
                </div>
                <h4 className="text-2xl font-bold text-neutral-900 dark:text-white">
                  Thanh toán tiền mặt
                </h4>
                <p className="mt-3 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                  Bạn đã chọn thanh toán tiền mặt. Vui lòng thanh toán trực tiếp tại studio
                  vào ngày chụp hoặc theo hướng dẫn từ studio.
                </p>

                <div className="mt-5 rounded-3xl bg-white p-4 shadow-sm dark:bg-neutral-900">
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    Trạng thái thanh toán
                  </p>
                  <p className="mt-2 text-lg font-semibold">Chưa thanh toán</p>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="mt-6 w-full rounded-2xl bg-neutral-900 px-5 py-4 text-sm font-semibold text-white transition hover:bg-black dark:bg-primary dark:text-black dark:hover:opacity-90"
                >
                  Đóng
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const BookingPage = () => {
  const [services, setServices] = useState([])
  const [concepts, setConcepts] = useState([])
  const [bookedSlots, setBookedSlots] = useState([])
  const [monthlyAvailability, setMonthlyAvailability] = useState([])

  const [loading, setLoading] = useState(true)
  const [slotLoading, setSlotLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [selectedService, setSelectedService] = useState(null)
  const [selectedConcept, setSelectedConcept] = useState(null)
  const [selectedDateObj, setSelectedDateObj] = useState(new Date())
  const [selectedSessions, setSelectedSessions] = useState([])
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cash')
  const [note, setNote] = useState('')
  const [calendarMonth, setCalendarMonth] = useState(new Date())
  const [paymentModalData, setPaymentModalData] = useState(null)

  const todayObj = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today
  }, [])

  const selectedDate = useMemo(() => formatDateLocal(selectedDateObj), [selectedDateObj])

  const priceSummary = useMemo(
    () => calculateBookingPrice(selectedService, selectedSessions),
    [selectedService, selectedSessions]
  )

  const selectedSessionLabel = useMemo(
    () => formatSessionLabels(selectedSessions),
    [selectedSessions]
  )

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await getServices()
        const serviceData = res.data?.data || []
        setServices(serviceData)

        if (serviceData.length > 0) {
          setSelectedService(serviceData[0])
        }
      } catch (error) {
        console.error(error)
        toast.error('Không thể tải danh sách dịch vụ')
      } finally {
        setLoading(false)
      }
    }

    fetchServices()
  }, [])

  useEffect(() => {
    const fetchSuggestedConcepts = async () => {
      if (!selectedService?._id) return

      try {
        const res = await getSuggestedConcepts(selectedService._id)
        const conceptData = res.data?.data || []
        setConcepts(conceptData)
        setSelectedConcept(conceptData[0] || null)
      } catch (error) {
        console.error(error)
        setConcepts([])
        setSelectedConcept(null)
      }
    }

    fetchSuggestedConcepts()

    if (selectedService?.allowMultiSession === false && selectedSessions.length > 1) {
      setSelectedSessions((prev) => prev.slice(0, 1))
    }
  }, [selectedService, selectedSessions.length])

  useEffect(() => {
    const fetchBookedSlots = async () => {
      if (!selectedDate) return

      try {
        setSlotLoading(true)
        const res = await getBookedSlotsByDate(selectedDate)
        setBookedSlots(res.data?.bookedSlots || [])
      } catch (error) {
        console.error(error)
        toast.error('Không thể tải buổi đã đặt')
      } finally {
        setSlotLoading(false)
      }
    }

    fetchBookedSlots()
    setSelectedSessions([])
  }, [selectedDate])

  useEffect(() => {
    const fetchMonthlyData = async () => {
      try {
        const monthKey = formatMonthKey(calendarMonth)
        const res = await getMonthlyAvailability(monthKey)
        setMonthlyAvailability(res.data?.data || [])
      } catch (error) {
        console.error(error)
        toast.error('Không thể tải trạng thái lịch theo tháng')
      }
    }

    fetchMonthlyData()
  }, [calendarMonth])

  const bookedSessionList = useMemo(() => {
    const booked = bookedSlots.flatMap((item) => {
      if (Array.isArray(item.sessions) && item.sessions.length > 0) return item.sessions
      return item.session ? [item.session] : []
    })

    return [...new Set(booked)]
  }, [bookedSlots])

  const availabilityMap = useMemo(() => {
    const map = new Map()
    monthlyAvailability.forEach((item) => {
      map.set(item.date, item)
    })
    return map
  }, [monthlyAvailability])

  const toggleSession = (sessionKey, disabled) => {
    if (disabled) return

    setSelectedSessions((prev) => {
      if (selectedService?.allowMultiSession === false) {
        return [sessionKey]
      }

      if (prev.includes(sessionKey)) {
        return prev.filter((item) => item !== sessionKey)
      }

      return [...prev, sessionKey]
    })
  }

  const handleSubmit = async () => {
    if (!selectedService || !selectedDate || selectedSessions.length === 0) {
      toast.error('Vui lòng chọn đầy đủ dịch vụ, ngày và ít nhất một buổi chụp')
      return
    }

    try {
      setSubmitting(true)

      const payload = {
        serviceId: selectedService._id,
        serviceName: selectedService.name,
        conceptId: selectedConcept?._id || null,
        conceptName: selectedConcept?.name || '',
        date: selectedDate,
        sessions: selectedSessions,
        session: selectedSessions[0],
        paymentMethod: selectedPaymentMethod,
        note,
      }

      const res = await createBooking(payload)
      const createdBooking = res.data?.booking
      const paymentInfo = res.data?.paymentInfo

      toast.success(
        selectedPaymentMethod === 'bank_qr'
          ? 'Đặt lịch thành công, bạn có thể tiếp tục thanh toán qua payOS'
          : 'Đặt lịch thành công'
      )

      if (createdBooking) {
        setPaymentModalData({
          bookingCode: createdBooking.bookingCode,
          serviceName:
            createdBooking.serviceName || createdBooking.serviceId?.name || selectedService?.name,
          date: createdBooking.date,
          sessionLabel: formatSessionLabels(createdBooking.sessions || selectedSessions),
          amount: createdBooking.totalPrice,
          paymentMethod: createdBooking.paymentMethod,
          paymentStatus: createdBooking.paymentStatus,
          checkoutUrl: createdBooking.checkoutUrl || paymentInfo?.checkoutUrl || '',
          paymentProvider:
            createdBooking.paymentProvider || paymentInfo?.paymentProvider || '',
          paymentOrderCode:
            createdBooking.paymentOrderCode || paymentInfo?.paymentOrderCode || '',
        })
      }

      setSelectedSessions([])
      setNote('')

      const [slotRes, monthRes] = await Promise.all([
        getBookedSlotsByDate(selectedDate),
        getMonthlyAvailability(formatMonthKey(calendarMonth)),
      ])

      setBookedSlots(slotRes.data?.bookedSlots || [])
      setMonthlyAvailability(monthRes.data?.data || [])
    } catch (error) {
      console.error(error)
      toast.error(error?.response?.data?.message || 'Đặt lịch thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  const tileDisabled = ({ date, view }) => {
    if (view !== 'month') return false
    return date < todayObj
  }

  const tileClassName = ({ date, view }) => {
    if (view !== 'month') return ''

    const dateKey = formatDateLocal(date)
    const info = availabilityMap.get(dateKey)

    if (!info) return 'booking-day-default'
    if (info.isFull) return 'booking-day-full'
    if (info.availableSlots <= 1) return 'booking-day-low'
    return 'booking-day-available'
  }

  const tileContent = ({ date, view }) => {
    if (view !== 'month') return null

    const dateKey = formatDateLocal(date)
    const info = availabilityMap.get(dateKey)

    if (!info) return null

    return (
      <div className="mt-1 text-center text-[10px] font-medium">
        {info.isFull ? (
          <span className="text-red-600 dark:text-red-400">Full</span>
        ) : (
          <span className="text-green-700 dark:text-green-400">
            {info.availableSlots} buổi
          </span>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f8f5ef,transparent_35%),linear-gradient(to_bottom,#faf7f2,#f6f7fb)] dark:bg-[radial-gradient(circle_at_top,#1a1408,transparent_22%),linear-gradient(to_bottom,#09090b,#0f1117)]">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="animate-pulse space-y-6">
            <div className="h-52 rounded-[32px] bg-white/80 dark:bg-white/5" />
            <div className="grid gap-6 lg:grid-cols-[1.55fr_0.95fr]">
              <div className="space-y-6">
                <div className="h-80 rounded-[30px] bg-white/80 dark:bg-white/5" />
                <div className="h-[520px] rounded-[30px] bg-white/80 dark:bg-white/5" />
                <div className="h-72 rounded-[30px] bg-white/80 dark:bg-white/5" />
              </div>
              <div className="h-[780px] rounded-[30px] bg-white/80 dark:bg-white/5" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f8f5ef,transparent_35%),linear-gradient(to_bottom,#faf7f2,#f6f7fb)] dark:bg-[radial-gradient(circle_at_top,#1a1408,transparent_22%),linear-gradient(to_bottom,#09090b,#0f1117)] dark:text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <section className="relative overflow-hidden rounded-[36px] border border-white/60 bg-black shadow-[0_30px_80px_rgba(15,23,42,0.18)] dark:border-white/10">
          <img
            src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1600&auto=format&fit=crop"
            alt="Booking hero"
            className="absolute inset-0 h-full w-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,0,0,0.86),rgba(0,0,0,0.45),rgba(201,168,76,0.18))]" />

          <div className="relative px-6 py-14 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-primary" />
                StudioLens Booking Experience
              </div>

              <h1 className="mt-6 text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
                Đặt lịch chụp ảnh
                <span className="text-primary"> linh hoạt </span>
                theo nhiều buổi
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-white/75 sm:text-lg">
                Chọn một hoặc nhiều buổi chụp trong ngày. Buổi đầu tính theo giá gốc,
                các buổi thêm được ưu đãi chỉ tính 50% để khuyến khích khách book thêm gói chụp.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <FeatureChip>Chọn nhiều buổi</FeatureChip>
                <FeatureChip>Buổi thêm 50%</FeatureChip>
                <FeatureChip>payOS tự xác nhận</FeatureChip>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.55fr_0.95fr]">
          <div className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-2">
              <div className="rounded-[30px] border border-black/5 bg-white/85 p-6 shadow-[0_12px_40px_rgba(15,23,42,0.05)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-[0_18px_50px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <SectionBadge>Bước 1</SectionBadge>
                    <h2 className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">
                      Chọn dịch vụ
                    </h2>
                  </div>

                  <div className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600 dark:bg-white/10 dark:text-neutral-300">
                    {services.length} dịch vụ
                  </div>
                </div>

                <div className="grid gap-3">
                  {services.map((service) => (
                    <button
                      key={service._id}
                      onClick={() => setSelectedService(service)}
                      className={`rounded-[24px] border p-4 text-left transition duration-200 ${
                        selectedService?._id === service._id
                          ? 'border-primary bg-primary/8 shadow-sm dark:border-primary dark:bg-primary/10'
                          : 'bg-white hover:-translate-y-0.5 hover:border-neutral-400 hover:shadow-sm dark:border-white/10 dark:bg-neutral-950/40 dark:hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-neutral-900 dark:text-white">
                            {service.name}
                          </h3>
                          <p className="mt-1 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                            {service.description}
                          </p>
                        </div>

                        {selectedService?._id === service._id ? (
                          <span className="rounded-full bg-black px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white dark:bg-primary dark:text-black">
                            Đã chọn
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
                        <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700 dark:bg-white/10 dark:text-neutral-300">
                          {service.duration} phút
                        </span>
                        <span className="font-semibold text-primary">
                          {formatCurrency(service.price)} / buổi đầu
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-[30px] border border-black/5 bg-white/85 p-6 shadow-[0_12px_40px_rgba(15,23,42,0.05)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-[0_18px_50px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <SectionBadge>Bước 2</SectionBadge>
                    <h2 className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">
                      Gợi ý concept
                    </h2>
                  </div>

                  <div className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600 dark:bg-white/10 dark:text-neutral-300">
                    Top gợi ý
                  </div>
                </div>

                <div className="space-y-4">
                  {concepts.length === 0 ? (
                    <div className="rounded-[24px] border border-dashed border-neutral-200 p-6 text-sm text-neutral-500 dark:border-white/10 dark:text-neutral-300">
                      Chưa có concept phù hợp cho dịch vụ này.
                    </div>
                  ) : (
                    concepts.slice(0, 3).map((concept) => (
                      <button
                        key={concept._id}
                        onClick={() => setSelectedConcept(concept)}
                        className={`block w-full overflow-hidden rounded-[24px] border text-left transition duration-200 ${
                          selectedConcept?._id === concept._id
                            ? 'border-primary shadow-sm dark:border-primary'
                            : 'bg-white hover:-translate-y-0.5 hover:shadow-sm dark:border-white/10 dark:bg-neutral-950/40'
                        }`}
                      >
                        <img
                          src={concept.image}
                          alt={concept.name}
                          className="h-44 w-full object-cover"
                        />
                        <div className="p-4">
                          <div className="flex items-center justify-between gap-3">
                            <h3 className="font-semibold text-neutral-900 dark:text-white">
                              {concept.name}
                            </h3>
                            {selectedConcept?._id === concept._id ? (
                              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
                                Đã chọn
                              </span>
                            ) : null}
                          </div>

                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                            {concept.description}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-[30px] border border-black/5 bg-white/85 p-6 shadow-[0_12px_40px_rgba(15,23,42,0.05)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-[0_18px_50px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5">
              <div className="mb-5">
                <SectionBadge>Bước 3</SectionBadge>
                <h2 className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">
                  Chọn ngày & buổi chụp
                </h2>
                <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                  Có thể tích nhiều buổi trong cùng một ngày. Hệ thống sẽ khóa từng buổi đã có lịch.
                </p>
              </div>

              <div className="mb-6">
                <label className="mb-3 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Lịch chụp
                </label>

                <div className="booking-calendar-wrap rounded-[28px] border border-neutral-200 bg-white/70 p-4 dark:border-white/10 dark:bg-neutral-950/50">
                  <Calendar
                    onChange={(value) => {
                      setSelectedDateObj(value)
                      setSelectedSessions([])
                    }}
                    value={selectedDateObj}
                    minDetail="month"
                    tileDisabled={tileDisabled}
                    tileClassName={tileClassName}
                    tileContent={tileContent}
                    onActiveStartDateChange={({ activeStartDate }) => {
                      if (activeStartDate) setCalendarMonth(activeStartDate)
                    }}
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-green-500" />
                    <span className="dark:text-neutral-300">Còn nhiều buổi</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-yellow-500" />
                    <span className="dark:text-neutral-300">Sắp đầy</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-red-500" />
                    <span className="dark:text-neutral-300">Đã full</span>
                  </div>
                </div>
              </div>

              {selectedDate && (
                <div className="mb-4 rounded-3xl bg-neutral-50 px-4 py-3 text-sm text-neutral-600 dark:bg-neutral-950 dark:text-neutral-300">
                  Ngày đã chọn: <span className="font-semibold">{selectedDate}</span>
                </div>
              )}

              {slotLoading ? (
                <div className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
                  Đang tải buổi chụp...
                </div>
              ) : null}

              <div className="grid gap-3 md:grid-cols-3">
                {BOOKING_SESSIONS.map((session) => {
                  const isBooked = bookedSessionList.includes(session.key)
                  const isSelected = selectedSessions.includes(session.key)
                  const isDisabled = isBooked

                  return (
                    <button
                      key={session.key}
                      disabled={isDisabled}
                      onClick={() => toggleSession(session.key, isDisabled)}
                      className={`rounded-[24px] border px-4 py-5 text-left transition duration-200 ${
                        isDisabled
                          ? 'cursor-not-allowed bg-neutral-200 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500'
                          : isSelected
                            ? 'border-primary bg-[linear-gradient(135deg,#111111,#000000,#2a210d)] text-white shadow-md dark:border-primary'
                            : 'bg-white hover:-translate-y-0.5 hover:border-neutral-500 hover:shadow-sm dark:border-white/10 dark:bg-neutral-950/40 dark:text-white dark:hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-semibold">{session.label}</div>
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs ${
                            isSelected
                              ? 'border-white/40 bg-white/20 text-white'
                              : 'border-neutral-300 bg-white text-neutral-400 dark:border-white/20 dark:bg-white/5'
                          }`}
                        >
                          {isSelected ? '✓' : ''}
                        </span>
                      </div>

                      <div className="mt-1 text-xs opacity-80">
                        {session.description || 'Buổi chụp linh hoạt theo lịch studio'}
                      </div>

                      <div className="mt-4 text-xs font-medium">
                        {isBooked ? 'Đã được đặt' : isSelected ? 'Đang chọn' : 'Còn trống'}
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="mt-4 rounded-3xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-neutral-700 dark:text-neutral-200">
                Ưu đãi upsell: Buổi đầu tính 100% giá gói, các buổi thêm chỉ tính{' '}
                <span className="font-bold text-primary">
                  {Math.round(priceSummary.extraSessionRate * 100)}%
                </span>{' '}
                giá buổi đầu.
              </div>
            </div>

            <div className="rounded-[30px] border border-black/5 bg-white/85 p-6 shadow-[0_12px_40px_rgba(15,23,42,0.05)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-[0_18px_50px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5">
              <div className="mb-5">
                <SectionBadge>Bước 4</SectionBadge>
                <h2 className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">
                  Thanh toán & ghi chú
                </h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('cash')}
                  className={`rounded-[24px] border p-5 text-left transition duration-200 ${
                    selectedPaymentMethod === 'cash'
                      ? 'border-primary bg-primary/8 shadow-sm dark:border-primary dark:bg-primary/10'
                      : 'bg-white hover:-translate-y-0.5 hover:border-neutral-400 hover:shadow-sm dark:border-white/10 dark:bg-neutral-950/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold">Tiền mặt</p>
                      <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                        Thanh toán trực tiếp tại studio vào ngày chụp hoặc theo hướng dẫn.
                      </p>
                    </div>
                    {selectedPaymentMethod === 'cash' ? (
                      <span className="rounded-full bg-black px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white dark:bg-primary dark:text-black">
                        Đã chọn
                      </span>
                    ) : null}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('bank_qr')}
                  className={`rounded-[24px] border p-5 text-left transition duration-200 ${
                    selectedPaymentMethod === 'bank_qr'
                      ? 'border-primary bg-primary/8 shadow-sm dark:border-primary dark:bg-primary/10'
                      : 'bg-white hover:-translate-y-0.5 hover:border-neutral-400 hover:shadow-sm dark:border-white/10 dark:bg-neutral-950/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold">Thanh toán online</p>
                      <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                        Bạn sẽ được chuyển sang payOS để hoàn tất thanh toán. Sau khi giao dịch thành công, hệ thống sẽ xác minh tự động.
                      </p>
                    </div>
                    {selectedPaymentMethod === 'bank_qr' ? (
                      <span className="rounded-full bg-black px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white dark:bg-primary dark:text-black">
                        Đã chọn
                      </span>
                    ) : null}
                  </div>
                </button>
              </div>

              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ghi chú thêm: số người chụp, địa điểm, make-up, trang phục, yêu cầu giao ảnh..."
                className="mt-6 min-h-[130px] w-full rounded-[24px] border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-neutral-400 focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-white/10 dark:bg-neutral-950/70 dark:text-white"
              />
            </div>
          </div>

          <aside className="h-fit overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,#09090b,#171717,#2a210d)] p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.22)] ring-1 ring-white/10">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Tóm tắt đặt lịch</h2>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wider">
                Live summary
              </span>
            </div>

            <div className="mt-6 space-y-4 text-sm">
              <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                <span className="text-white/65">Dịch vụ</span>
                <span className="text-right font-medium">
                  {selectedService?.name || '--'}
                </span>
              </div>

              <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                <span className="text-white/65">Concept</span>
                <span className="text-right font-medium">
                  {selectedConcept?.name || '--'}
                </span>
              </div>

              <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                <span className="text-white/65">Ngày chụp</span>
                <span className="text-right font-medium">{selectedDate || '--'}</span>
              </div>

              <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                <span className="text-white/65">Buổi chụp</span>
                <span className="text-right font-medium">
                  {selectedSessionLabel}
                </span>
              </div>

              <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                <span className="text-white/65">Số buổi</span>
                <span className="text-right font-medium">
                  {priceSummary.sessionCount || 0} buổi
                </span>
              </div>

              <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                <span className="text-white/65">Thanh toán</span>
                <span className="text-right font-medium">
                  {selectedPaymentMethod === 'bank_qr' ? 'payOS online' : 'Tiền mặt'}
                </span>
              </div>

              <div className="rounded-3xl bg-white/7 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-widest text-white/50">
                  Chính sách giá
                </p>
                <div className="mt-3 space-y-2 text-sm text-white/85">
                  <div className="flex justify-between gap-3">
                    <span>Buổi đầu</span>
                    <span>{formatCurrency(priceSummary.sessionCount > 0 ? priceSummary.basePrice : 0)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span>
                      {priceSummary.extraSessionCount} buổi thêm x{' '}
                      {Math.round(priceSummary.extraSessionRate * 100)}%
                    </span>
                    <span>{formatCurrency(priceSummary.extraSessionPrice)}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl bg-primary/10 p-4 ring-1 ring-primary/20">
                <p className="text-xs uppercase tracking-widest text-white/50">
                  Tổng chi phí dự kiến
                </p>
                <p className="mt-2 text-3xl font-bold text-primary">
                  {formatCurrency(priceSummary.totalPrice)}
                </p>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="mt-8 w-full rounded-2xl bg-primary px-6 py-4 text-sm font-semibold uppercase tracking-wider text-black shadow-lg shadow-primary/20 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-60"
            >
              {submitting
                ? 'Đang xử lý...'
                : selectedPaymentMethod === 'bank_qr'
                  ? 'Tạo booking'
                  : 'Xác nhận đặt lịch'}
            </button>

            <p className="mt-4 text-center text-xs text-white/50">
              Sau khi đặt lịch thành công, bạn sẽ nhận được email xác nhận tự động.
            </p>
          </aside>
        </div>
      </div>

      <PaymentActionModal
        paymentData={paymentModalData}
        onClose={() => setPaymentModalData(null)}
      />

      <style>{`
        .booking-calendar-wrap .react-calendar {
          width: 100%;
          border: none;
          background: transparent;
          font-family: inherit;
        }

        .booking-calendar-wrap .react-calendar__navigation {
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .booking-calendar-wrap .react-calendar__navigation button {
          min-width: 46px;
          background: transparent;
          font-weight: 700;
          border-radius: 14px;
          transition: all 0.2s ease;
          color: inherit;
        }

        .booking-calendar-wrap .react-calendar__navigation button:hover {
          background: rgba(201, 168, 76, 0.1);
        }

        .booking-calendar-wrap .react-calendar__month-view__weekdays {
          text-transform: uppercase;
          font-size: 12px;
          color: #737373;
          margin-bottom: 8px;
          font-weight: 600;
        }

        .booking-calendar-wrap .react-calendar__tile {
          position: relative;
          border-radius: 18px;
          padding: 12px 6px;
          min-height: 84px;
          background: white;
          transition: all 0.2s ease;
          border: 1px solid transparent;
        }

        .booking-calendar-wrap .react-calendar__tile:hover {
          transform: translateY(-1px);
        }

        .booking-calendar-wrap .react-calendar__tile--now {
          background: rgba(201, 168, 76, 0.10);
          border-color: rgba(201, 168, 76, 0.35);
        }

        .booking-calendar-wrap .react-calendar__tile--active {
          background: linear-gradient(135deg, #111111, #000000, #2a210d) !important;
          color: white !important;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.18);
          border-color: rgba(201, 168, 76, 0.5);
        }

        .booking-calendar-wrap .react-calendar__tile:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        .booking-day-default {
          border: 1px solid #e5e7eb;
        }

        .booking-day-available {
          border: 1px solid #22c55e;
          background: #f0fdf4 !important;
        }

        .booking-day-low {
          border: 1px solid #f59e0b;
          background: #fffbeb !important;
        }

        .booking-day-full {
          border: 1px solid #ef4444;
          background: #fef2f2 !important;
        }

        .dark .booking-calendar-wrap .react-calendar__tile {
          background: #171717;
          color: white;
        }

        .dark .booking-calendar-wrap .react-calendar__month-view__weekdays {
          color: #a3a3a3;
        }

        .dark .booking-day-default {
          border: 1px solid #404040;
        }

        .dark .booking-day-available {
          border: 1px solid #22c55e;
          background: rgba(34, 197, 94, 0.12) !important;
        }

        .dark .booking-day-low {
          border: 1px solid #f59e0b;
          background: rgba(245, 158, 11, 0.12) !important;
        }

        .dark .booking-day-full {
          border: 1px solid #ef4444;
          background: rgba(239, 68, 68, 0.12) !important;
        }
      `}</style>
    </div>
  )
}

export default BookingPage
