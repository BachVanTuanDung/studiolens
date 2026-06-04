import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { getMyBookings } from '../api/bookingApi'
import { formatCurrency } from '../utils/formatCurrency'

const statusMap = {
  pending: {
    label: 'Chờ xác nhận',
    className:
      'bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/30',
  },
  confirmed: {
    label: 'Đã xác nhận',
    className:
      'bg-sky-100 text-sky-800 ring-1 ring-inset ring-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-500/30',
  },
  completed: {
    label: 'Hoàn thành',
    className:
      'bg-emerald-100 text-emerald-800 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/30',
  },
  cancelled: {
    label: 'Đã hủy',
    className:
      'bg-rose-100 text-rose-800 ring-1 ring-inset ring-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-500/30',
  },
}

const paymentStatusMap = {
  unpaid: {
    label: 'Chưa thanh toán',
    className:
      'bg-neutral-100 text-neutral-700 ring-1 ring-inset ring-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:ring-neutral-700',
  },
  pending: {
    label: 'Đang xử lý',
    className:
      'bg-yellow-100 text-yellow-800 ring-1 ring-inset ring-yellow-200 dark:bg-yellow-500/15 dark:text-yellow-300 dark:ring-yellow-500/30',
  },
  paid: {
    label: 'Đã thanh toán',
    className:
      'bg-green-100 text-green-800 ring-1 ring-inset ring-green-200 dark:bg-green-500/15 dark:text-green-300 dark:ring-green-500/30',
  },
}

const paymentMethodMap = {
  cash: 'Tiền mặt',
  bank_qr: 'Thanh toán online',
}

const sessionLabelMap = {
  morning: 'Buổi sáng',
  afternoon: 'Buổi chiều',
  evening: 'Buổi tối',
}

const normalizeBookingSessions = (booking) => {
  if (Array.isArray(booking.sessions) && booking.sessions.length > 0) {
    return booking.sessions
  }

  return booking.session ? [booking.session] : []
}

const getSessionLabel = (booking) => {
  const sessions = normalizeBookingSessions(booking)
  const labels = sessions.map((item) => sessionLabelMap[item]).filter(Boolean)
  return labels.length ? labels.join(', ') : '--'
}

const getSessionBadgeClass = (booking) => {
  const sessions = normalizeBookingSessions(booking)

  if (sessions.length > 1) {
    return 'bg-primary/10 text-primary ring-1 ring-inset ring-primary/25'
  }

  const session = sessions[0]

  if (session === 'morning') {
    return 'bg-sky-100 text-sky-700 ring-1 ring-inset ring-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-500/30'
  }
  if (session === 'afternoon') {
    return 'bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/30'
  }
  if (session === 'evening') {
    return 'bg-violet-100 text-violet-700 ring-1 ring-inset ring-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-500/30'
  }

  return 'bg-neutral-100 text-neutral-700 ring-1 ring-inset ring-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:ring-neutral-700'
}

const StatCard = ({ title, value, className, subtext }) => {
  return (
    <div className={`rounded-[28px] p-5 text-white shadow-lg ${className}`}>
      <p className="text-xs uppercase tracking-[0.25em] opacity-80">{title}</p>
      <p className="mt-3 text-3xl font-bold">{value}</p>
      {subtext ? <p className="mt-2 text-sm text-white/75">{subtext}</p> : null}
    </div>
  )
}

const InfoItem = ({ label, value }) => {
  return (
    <div className="rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-950/70">
      <p className="text-sm text-neutral-500 dark:text-neutral-400">{label}</p>
      <p className="mt-2 break-words text-lg font-semibold text-neutral-900 dark:text-white">
        {value || '--'}
      </p>
    </div>
  )
}

const formatDateDisplay = (dateStr) => {
  if (!dateStr) return '--'
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('vi-VN')
}

const OnlinePaymentCard = ({ booking }) => {
  if (booking.paymentMethod !== 'bank_qr') return null

  const paymentInfo = paymentStatusMap[booking.paymentStatus] || {
    label: booking.paymentStatus || 'Không rõ',
    className:
      'bg-neutral-100 text-neutral-700 ring-1 ring-inset ring-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:ring-neutral-700',
  }

  return (
    <div className="mt-6 rounded-[28px] border border-neutral-200 bg-gradient-to-br from-neutral-50 to-white p-5 dark:border-neutral-800 dark:from-neutral-950 dark:to-neutral-900">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-primary">
            Thanh toán online
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-neutral-900 dark:text-white">
            Tiếp tục qua payOS
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600 dark:text-neutral-300">
            Booking này đang dùng payOS. Để hệ thống xác nhận tự động ổn định hơn, bạn hãy
            thanh toán trực tiếp trên trang payOS và quay về website sau khi hoàn tất.
          </p>
        </div>

        <span
          className={`inline-flex w-fit rounded-full px-3 py-1 text-sm font-medium ${paymentInfo.className}`}
        >
          {paymentInfo.label}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InfoItem label="Số tiền" value={formatCurrency(booking.totalPrice || 0)} />
        <InfoItem label="Nhà cung cấp" value={booking.paymentProvider || 'payOS'} />
        <InfoItem label="Mã đơn thanh toán" value={booking.paymentOrderCode || '--'} />
        <InfoItem label="Trạng thái" value={paymentInfo.label} />
      </div>

      {booking.paymentStatus !== 'paid' ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-1">
          {booking.checkoutUrl ? (
            <a
              href={booking.checkoutUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-black transition hover:opacity-90"
            >
              Tiếp tục thanh toán
            </a>
          ) : (
            <div className="flex items-center justify-center rounded-2xl border border-dashed border-neutral-300 px-4 py-3 text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
              Không có link thanh toán
            </div>
          )}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-green-300 bg-green-50 px-4 py-4 text-sm leading-6 text-green-800 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-300">
          Booking này đã được xác nhận thanh toán thành công.
        </div>
      )}
    </div>
  )
}

const MyBookingsPage = () => {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedBookingId, setExpandedBookingId] = useState('')

  const fetchBookings = useCallback(async () => {
    try {
      const res = await getMyBookings()
      const data = res.data?.bookings || []
      setBookings(data)
    } catch (error) {
      console.error(error)
      toast.error(error?.response?.data?.message || 'Không thể tải lịch sử booking')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  const toggleExpand = (bookingId) => {
    setExpandedBookingId((prev) => (prev === bookingId ? '' : bookingId))
  }

  const stats = useMemo(() => {
    const total = bookings.length
    const confirmed = bookings.filter((item) => item.status === 'confirmed').length
    const completed = bookings.filter((item) => item.status === 'completed').length
    const pending = bookings.filter((item) => item.status === 'pending').length
    return { total, confirmed, completed, pending }
  }, [bookings])

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f8f5ef,transparent_35%),linear-gradient(to_bottom,#faf7f2,#f6f7fb)] dark:bg-[radial-gradient(circle_at_top,#1a1408,transparent_22%),linear-gradient(to_bottom,#09090b,#0f1117)] dark:text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <section className="relative overflow-hidden rounded-[36px] border border-white/60 bg-black shadow-[0_30px_80px_rgba(15,23,42,0.18)] dark:border-white/10">
          <img
            src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1600&auto=format&fit=crop"
            alt="My bookings hero"
            className="absolute inset-0 h-full w-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,0,0,0.86),rgba(0,0,0,0.45),rgba(201,168,76,0.18))]" />

          <div className="relative px-6 py-14 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Booking Management
              </div>

              <h1 className="mt-6 text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
                Lịch sử booking
                <span className="text-primary"> dạng danh sách </span>
                dễ theo dõi hơn
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-white/75 sm:text-lg">
                Xem nhanh toàn bộ booking của bạn theo dạng danh sách gọn. Bấm vào từng dòng
                để xem chi tiết và trạng thái thanh toán mới nhất.
              </p>
            </div>
          </div>
        </section>

        {!loading && bookings.length > 0 ? (
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Tổng booking"
              value={stats.total}
              subtext="Tất cả lịch chụp của bạn"
              className="bg-gradient-to-br from-neutral-900 to-neutral-700"
            />
            <StatCard
              title="Chờ xác nhận"
              value={stats.pending}
              subtext="Đang chờ studio phản hồi"
              className="bg-gradient-to-br from-yellow-600 to-amber-500"
            />
            <StatCard
              title="Đã xác nhận"
              value={stats.confirmed}
              subtext="Lịch chụp đã chốt"
              className="bg-gradient-to-br from-blue-600 to-sky-500"
            />
            <StatCard
              title="Hoàn thành"
              value={stats.completed}
              subtext="Buổi chụp đã xong"
              className="bg-gradient-to-br from-green-600 to-emerald-500"
            />
          </div>
        ) : null}

        <div className="mt-8">
          {loading ? (
            <div className="rounded-[30px] border border-black/5 bg-white/85 p-10 text-center shadow-sm dark:border-white/10 dark:bg-white/5">
              Đang tải lịch sử booking...
            </div>
          ) : bookings.length === 0 ? (
            <div className="rounded-[30px] border border-black/5 bg-white/85 p-12 text-center shadow-sm dark:border-white/10 dark:bg-white/5">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100 text-3xl dark:bg-white/10">
                📅
              </div>
              <h2 className="mt-5 text-2xl font-semibold text-neutral-900 dark:text-white">
                Bạn chưa có booking nào
              </h2>
              <p className="mt-3 text-neutral-500 dark:text-neutral-400">
                Hãy đặt lịch chụp đầu tiên để bắt đầu lưu giữ những khoảnh khắc đẹp.
              </p>
              <Link
                to="/booking"
                className="mt-6 inline-flex items-center justify-center rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-black transition hover:opacity-90"
              >
                Đặt lịch ngay
              </Link>
            </div>
          ) : (
            <div className="overflow-hidden rounded-[30px] border border-black/5 bg-white/90 shadow-[0_12px_40px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-white/5">
              <div className="border-b border-neutral-200 px-6 py-5 dark:border-white/10">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
                  Booking list
                </p>
                <h2 className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">
                  Danh sách booking của tôi
                </h2>
              </div>

              <div className="divide-y divide-neutral-200 dark:divide-white/10">
                {bookings.map((booking, index) => {
                  const statusInfo = statusMap[booking.status] || {
                    label: booking.status || 'Không rõ',
                    className:
                      'bg-neutral-100 text-neutral-700 ring-1 ring-inset ring-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:ring-neutral-700',
                  }

                  const paymentInfo = paymentStatusMap[booking.paymentStatus] || {
                    label: booking.paymentStatus || 'Không rõ',
                    className:
                      'bg-neutral-100 text-neutral-700 ring-1 ring-inset ring-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:ring-neutral-700',
                  }

                  const isExpanded = expandedBookingId === booking._id

                  return (
                    <div key={booking._id}>
                      <button
                        type="button"
                        onClick={() => toggleExpand(booking._id)}
                        className={`w-full px-6 py-5 text-left transition ${
                          index % 2 === 0
                            ? 'bg-white/60 dark:bg-white/[0.02]'
                            : 'bg-neutral-50/90 dark:bg-white/[0.07]'
                        } hover:bg-neutral-100 dark:hover:bg-white/[0.09]`}
                      >
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                                #{index + 1}
                              </span>
                              <span className="text-xs uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">
                                {booking.bookingCode || 'BOOKING'}
                              </span>
                            </div>

                            <h3 className="mt-2 text-xl font-bold text-neutral-900 dark:text-white">
                              {booking.serviceName || booking.serviceId?.name || 'Dịch vụ'}
                            </h3>

                            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                              {booking.conceptName || 'Chưa chọn concept'} • {booking.date || '--'} •{' '}
                              {getSessionLabel(booking)}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${getSessionBadgeClass(
                                booking
                              )}`}
                            >
                              {getSessionLabel(booking)}
                            </span>

                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${statusInfo.className}`}
                            >
                              {statusInfo.label}
                            </span>

                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${paymentInfo.className}`}
                            >
                              {paymentInfo.label}
                            </span>

                            <div className="ml-2 flex items-center gap-3">
                              <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                                {formatCurrency(booking.totalPrice || 0)}
                              </span>
                              <span
                                className={`text-xl transition-transform duration-200 ${
                                  isExpanded ? 'rotate-180' : ''
                                }`}
                              >
                                ⌄
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>

                      {isExpanded ? (
                        <div className="border-t border-neutral-200 bg-neutral-50/70 px-6 py-6 dark:border-white/10 dark:bg-black/10">
                          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                            <InfoItem label="Ngày chụp" value={booking.date || '--'} />
                            <InfoItem label="Buổi chụp" value={getSessionLabel(booking)} />
                            <InfoItem label="Số buổi" value={`${normalizeBookingSessions(booking).length || 1} buổi`} />
                            <InfoItem
                              label="Phương thức thanh toán"
                              value={paymentMethodMap[booking.paymentMethod] || '--'}
                            />
                            <InfoItem
                              label="Tổng chi phí"
                              value={formatCurrency(booking.totalPrice || 0)}
                            />
                            <InfoItem
                              label="Ngày tạo"
                              value={formatDateDisplay(booking.createdAt)}
                            />
                          </div>

                          <div className="mt-5 rounded-2xl border border-dashed border-neutral-200 p-4 dark:border-white/10">
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">Ghi chú</p>
                            <p className="mt-2 text-neutral-700 dark:text-neutral-300">
                              {booking.note || 'Không có ghi chú'}
                            </p>
                          </div>

                          <OnlinePaymentCard booking={booking} />
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MyBookingsPage