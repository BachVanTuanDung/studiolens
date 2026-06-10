import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  confirmPayment,
  getAllBookings,
  markBookingAsUnpaid,
  updateBooking,
  approveEditBooking,
  rejectEditBooking,
} from '../../api/bookingApi'

const statusOptions = ['pending', 'confirmed', 'completed', 'cancelled']
const paymentFilterOptions = ['all', 'unpaid', 'pending', 'paid']
const bookingFilterOptions = ['all', 'pending', 'confirmed', 'completed', 'cancelled']

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

const getSessionLabelFromArray = (sessions = []) => {
  const labels = sessions.map((item) => sessionLabelMap[item]).filter(Boolean)
  return labels.length ? labels.join(', ') : '--'
}

const getSessionLabel = (booking) => {
  const sessions = normalizeBookingSessions(booking)
  return getSessionLabelFromArray(sessions)
}

const getSessionBadgeClass = (booking) => {
  const sessions = normalizeBookingSessions(booking)

  if (sessions.length > 1) {
    return 'bg-yellow-100 text-yellow-800 ring-1 ring-inset ring-yellow-200 dark:bg-yellow-500/15 dark:text-yellow-300 dark:ring-yellow-500/30'
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

const statusMap = {
  pending: {
    label: 'Chờ xác nhận',
    className: 'bg-yellow-100 text-yellow-800 ring-1 ring-inset ring-yellow-200 dark:bg-yellow-500/15 dark:text-yellow-300 dark:ring-yellow-500/30',
  },
  confirmed: {
    label: 'Đã xác nhận',
    className: 'bg-blue-100 text-blue-800 ring-1 ring-inset ring-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-500/30',
  },
  completed: {
    label: 'Hoàn thành',
    className: 'bg-green-100 text-green-800 ring-1 ring-inset ring-green-200 dark:bg-green-500/15 dark:text-green-300 dark:ring-green-500/30',
  },
  cancelled: {
    label: 'Đã hủy',
    className: 'bg-red-100 text-red-800 ring-1 ring-inset ring-red-200 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-500/30',
  },
}

const paymentStatusMap = {
  unpaid: {
    label: 'Chưa thanh toán',
    className: 'bg-neutral-100 text-neutral-700 ring-1 ring-inset ring-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:ring-neutral-700',
  },
  pending: {
    label: 'Đang xử lý',
    className: 'bg-yellow-100 text-yellow-800 ring-1 ring-inset ring-yellow-200 dark:bg-yellow-500/15 dark:text-yellow-300 dark:ring-yellow-500/30',
  },
  paid: {
    label: 'Đã thanh toán',
    className: 'bg-green-100 text-green-800 ring-1 ring-inset ring-green-200 dark:bg-green-500/15 dark:text-green-300 dark:ring-green-500/30',
  },
}

const paymentMethodMap = {
  cash: 'Tiền mặt',
  bank_qr: 'Thanh toán online',
}

const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`

const formatDateTimeVN = (value) => {
  if (!value) return '--'
  return new Date(value).toLocaleString('vi-VN')
}

const StatCard = ({ title, value, className }) => {
  return (
    <div className={`rounded-[28px] p-5 text-white shadow-sm ${className}`}>
      <p className="text-xs uppercase tracking-[0.25em] opacity-80">{title}</p>
      <p className="mt-3 text-3xl font-bold">{value}</p>
    </div>
  )
}

const InfoLine = ({ label, value }) => (
  <div className="flex items-start justify-between gap-4 border-b border-neutral-100 py-2 last:border-b-0 dark:border-neutral-800">
    <span className="text-sm text-neutral-500 dark:text-neutral-400">{label}</span>
    <span className="max-w-[62%] break-words text-right text-sm font-medium text-neutral-900 dark:text-white">
      {value || '--'}
    </span>
  </div>
)

const SummaryCell = ({ label, value, subValue }) => (
  <div className="rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-950">
    <p className="text-sm text-neutral-500 dark:text-neutral-400">{label}</p>
    <p className="mt-2 text-lg font-semibold text-neutral-900 dark:text-white">
      {value || '--'}
    </p>
    {subValue ? (
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{subValue}</p>
    ) : null}
  </div>
)

const AdminBookingsPage = () => {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState('')
  const [paymentUpdatingId, setPaymentUpdatingId] = useState('')
  const [approvingEditId, setApprovingEditId] = useState('')
  const [bookingFilter, setBookingFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState('')

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const res = await getAllBookings()
      const data = res.data?.bookings || []
      setBookings(data)
    } catch (error) {
      console.error(error)
      toast.error(error?.response?.data?.message || 'Không thể tải danh sách booking')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  const handleChangeStatus = async (bookingId, status) => {
    try {
      setUpdatingId(bookingId)
      await updateBooking(bookingId, { status })
      setBookings((prev) =>
        prev.map((item) => (item._id === bookingId ? { ...item, status } : item))
      )
      toast.success('Cập nhật trạng thái booking thành công')
    } catch (error) {
      console.error(error)
      toast.error(error?.response?.data?.message || 'Cập nhật trạng thái thất bại')
    } finally {
      setUpdatingId('')
    }
  }

  const handleApproveEdit = async (bookingId) => {
    try {
      setApprovingEditId(bookingId)
      const res = await approveEditBooking(bookingId)
      setBookings((prev) =>
        prev.map((item) => (item._id === bookingId ? res.data.booking || item : item))
      )
      toast.success('Đã duyệt yêu cầu thành công')
    } catch (error) {
      console.error(error)
      toast.error(error?.response?.data?.message || 'Duyệt yêu cầu thất bại')
    } finally {
      setApprovingEditId('')
    }
  }

  const handleRejectEdit = async (bookingId) => {
    const confirmed = window.confirm('Bạn có chắc muốn từ chối yêu cầu này?')
    if (!confirmed) return

    try {
      setApprovingEditId(bookingId)
      const res = await rejectEditBooking(bookingId)
      setBookings((prev) =>
        prev.map((item) => (item._id === bookingId ? res.data.booking || item : item))
      )
      toast.success('Đã từ chối yêu cầu')
    } catch (error) {
      console.error(error)
      toast.error(error?.response?.data?.message || 'Từ chối thất bại')
    } finally {
      setApprovingEditId('')
    }
  }

  const handleConfirmPayment = async (bookingId) => {
    try {
      setPaymentUpdatingId(bookingId)
      await confirmPayment(bookingId)
      setBookings((prev) =>
        prev.map((item) =>
          item._id === bookingId
            ? {
                ...item,
                paymentStatus: 'paid',
                paidAt: new Date().toISOString(),
              }
            : item
        )
      )
      toast.success('Đã xác nhận thanh toán')
    } catch (error) {
      console.error(error)
      toast.error(error?.response?.data?.message || 'Xác nhận thanh toán thất bại')
    } finally {
      setPaymentUpdatingId('')
    }
  }

  const handleMarkAsUnpaid = async (bookingId) => {
    try {
      setPaymentUpdatingId(bookingId)
      await markBookingAsUnpaid(bookingId)
      setBookings((prev) =>
        prev.map((item) =>
          item._id === bookingId
            ? {
                ...item,
                paymentStatus: 'unpaid',
                paidAt: null,
              }
            : item
        )
      )
      toast.success('Đã chuyển về chưa thanh toán')
    } catch (error) {
      console.error(error)
      toast.error(error?.response?.data?.message || 'Cập nhật thanh toán thất bại')
    } finally {
      setPaymentUpdatingId('')
    }
  }

  const filteredBookings = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    return bookings.filter((booking) => {
      const matchesBookingStatus =
        bookingFilter === 'all' ? true : booking.status === bookingFilter

      const matchesPaymentStatus =
        paymentFilter === 'all' ? true : booking.paymentStatus === paymentFilter

      const searchableText = [
        booking.bookingCode,
        booking.customerName,
        booking.userId?.name,
        booking.customerEmail,
        booking.userId?.email,
        booking.customerPhone,
        booking.userId?.phone,
        booking.serviceName,
        booking.serviceId?.name,
        booking.transferContent,
        booking.date,
        ...(Array.isArray(booking.sessions) ? booking.sessions : []),
        booking.conceptName,
        booking.conceptId?.name,
        booking.paymentOrderCode,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      const matchesSearch = keyword ? searchableText.includes(keyword) : true

      return matchesBookingStatus && matchesPaymentStatus && matchesSearch
    })
  }, [bookings, bookingFilter, paymentFilter, search])

  useEffect(() => {
    if (!filteredBookings.length) {
      setExpandedId('')
      return
    }

    if (expandedId) {
      const exists = filteredBookings.some((item) => item._id === expandedId)
      if (!exists) {
        setExpandedId('')
      }
    }
  }, [filteredBookings, expandedId])

  const stats = useMemo(() => {
    return {
      total: bookings.length,
      pendingBooking: bookings.filter((item) => item.status === 'pending').length,
      paymentPending: bookings.filter((item) => item.paymentStatus === 'pending').length,
      paid: bookings.filter((item) => item.paymentStatus === 'paid').length,
    }
  }, [bookings])

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 dark:text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.3em] text-yellow-700 dark:text-yellow-400">
            Quản trị booking
          </p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-5xl font-bold">Quản lý booking & đối soát</h1>
              <p className="mt-3 max-w-3xl text-neutral-600 dark:text-neutral-300">
                Hiển thị booking dạng danh sách gọn, bấm vào từng dòng để xem chi tiết đầy đủ
                ngay bên dưới, giúp xử lý nhanh hơn khi số lượng booking tăng nhiều.
              </p>
            </div>

            <div className="inline-flex rounded-full border border-yellow-200 bg-yellow-50 px-4 py-2 text-sm font-medium text-yellow-800 dark:border-yellow-900/40 dark:bg-yellow-900/20 dark:text-yellow-300">
              Booking list manager
            </div>
          </div>
        </div>

        {!loading && bookings.length > 0 ? (
          <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Tổng booking"
              value={stats.total}
              className="bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-800"
            />
            <StatCard
              title="Chờ xác nhận lịch"
              value={stats.pendingBooking}
              className="bg-gradient-to-br from-yellow-600 via-amber-500 to-orange-500"
            />
            <StatCard
              title="Đang xử lý thanh toán"
              value={stats.paymentPending}
              className="bg-gradient-to-br from-orange-600 to-yellow-500"
            />
            <StatCard
              title="Đã thanh toán"
              value={stats.paid}
              className="bg-gradient-to-br from-green-600 to-emerald-500"
            />
          </div>
        ) : null}

        <div className="mb-6 grid gap-4 rounded-[28px] border border-neutral-200 bg-white p-5 shadow-sm md:grid-cols-3 dark:border-neutral-800 dark:bg-neutral-900">
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-600 dark:text-neutral-300">
              Tìm kiếm
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Mã booking, tên khách, email, mã đơn..."
              className="w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none transition focus:border-yellow-500 dark:border-neutral-700 dark:bg-neutral-950"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-600 dark:text-neutral-300">
              Trạng thái booking
            </label>
            <select
              value={bookingFilter}
              onChange={(e) => setBookingFilter(e.target.value)}
              className="w-full rounded-2xl border border-neutral-200 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-950"
            >
              {bookingFilterOptions.map((item) => (
                <option key={item} value={item}>
                  {item === 'all' ? 'Tất cả' : statusMap[item]?.label || item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-600 dark:text-neutral-300">
              Trạng thái thanh toán
            </label>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full rounded-2xl border border-neutral-200 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-950"
            >
              {paymentFilterOptions.map((item) => (
                <option key={item} value={item}>
                  {item === 'all' ? 'Tất cả' : paymentStatusMap[item]?.label || item}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="rounded-[28px] border border-neutral-200 bg-white p-10 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            Đang tải danh sách booking...
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="rounded-[28px] border border-neutral-200 bg-white p-10 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            Không có booking nào phù hợp bộ lọc hiện tại.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => {
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

              const isExpanded = expandedId === booking._id
              const isQrPayment = booking.paymentMethod === 'bank_qr'
              const isCashPayment = booking.paymentMethod === 'cash'
              const isPaid = booking.paymentStatus === 'paid'

              return (
                <div
                  key={booking._id}
                  className="overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-sm transition duration-300 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? '' : booking._id)}
                    className="w-full px-5 py-4 text-left transition hover:bg-neutral-50 dark:hover:bg-neutral-800/40"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-xs uppercase tracking-widest text-yellow-700 dark:text-yellow-400">
                            {booking.bookingCode || 'BOOKING'}
                          </span>
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getSessionBadgeClass(
                              booking
                            )}`}
                          >
                            {getSessionLabel(booking)}
                          </span>
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusInfo.className}`}
                          >
                            {statusInfo.label}
                          </span>
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${paymentInfo.className}`}
                          >
                            {paymentInfo.label}
                          </span>
                          
                          {/* Indicator có yêu cầu sửa/hủy lịch */}
                          {booking.editRequest?.status === 'pending' && (
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${
                              booking.editRequest?.requestType === 'cancel' 
                              ? 'bg-red-100 text-red-800 ring-red-300 dark:bg-red-500/20 dark:text-red-300' 
                              : 'bg-blue-100 text-blue-800 ring-blue-300 dark:bg-blue-500/20 dark:text-blue-300'
                            }`}>
                              {booking.editRequest?.requestType === 'cancel' ? '🚨 Yêu cầu hủy lịch' : '🔔 Có yêu cầu dời lịch'}
                            </span>
                          )}
                        </div>

                        <div className="mt-2 flex flex-col gap-1 xl:flex-row xl:flex-wrap xl:items-center xl:gap-x-6">
                          <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">
                            {booking.serviceName || booking.serviceId?.name || 'Dịch vụ'}
                          </h2>
                          <p className="text-sm text-neutral-600 dark:text-neutral-300">
                            {booking.conceptName ||
                              booking.conceptId?.name ||
                              'Không có concept'}
                          </p>
                        </div>

                        <div className="mt-2 flex flex-col gap-1 text-sm text-neutral-500 dark:text-neutral-400 xl:flex-row xl:flex-wrap xl:gap-x-6">
                          <span>{booking.customerName || booking.userId?.name || '--'}</span>
                          <span>{booking.date || '--'}</span>
                          <span>{formatMoney(booking.totalPrice)}</span>
                          <span>{normalizeBookingSessions(booking).length || 1} buổi</span>
                          <span>{paymentMethodMap[booking.paymentMethod] || '--'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-start xl:self-center">
                        <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                          {isExpanded ? 'Thu gọn' : 'Xem chi tiết'}
                        </span>
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-lg transition dark:border-neutral-700 ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        >
                          ⌄
                        </div>
                      </div>
                    </div>
                  </button>

                  {isExpanded ? (
                    <div className="border-t border-neutral-100 p-6 dark:border-neutral-800">
                      
                      {/* Bảng duyệt yêu cầu dời/hủy lịch */}
                      {booking.editRequest?.status === 'pending' && (
                        <div className={`mb-6 rounded-2xl border p-5 ${
                          booking.editRequest.requestType === 'cancel'
                          ? 'border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/20'
                          : 'border-blue-200 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-900/20'
                        }`}>
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                              <h4 className={`font-semibold flex items-center gap-2 ${
                                booking.editRequest.requestType === 'cancel' ? 'text-red-900 dark:text-red-100' : 'text-blue-900 dark:text-blue-100'
                              }`}>
                                {booking.editRequest.requestType === 'cancel' ? '🚨 Khách hàng yêu cầu hủy lịch' : '🔔 Khách hàng yêu cầu dời lịch'}
                              </h4>
                              
                              {booking.editRequest.requestType === 'reschedule' ? (
                                <p className="mt-2 text-sm text-blue-800 dark:text-blue-200">
                                  Muốn đổi sang ngày: <span className="font-bold">{booking.editRequest.date}</span>
                                  <br />
                                  Buổi chụp: <span className="font-bold">{getSessionLabelFromArray(booking.editRequest.sessions)}</span>
                                </p>
                              ) : null}

                              {booking.editRequest.note && (
                                <p className={`mt-2 text-sm italic border-l-2 pl-3 ${
                                  booking.editRequest.requestType === 'cancel' 
                                  ? 'text-red-800/80 border-red-300 dark:text-red-200/80' 
                                  : 'text-blue-800/80 border-blue-300 dark:text-blue-200/80'
                                }`}>
                                  Lý do: {booking.editRequest.note}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                              <button
                                type="button"
                                onClick={() => handleRejectEdit(booking._id)}
                                disabled={approvingEditId === booking._id}
                                className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-neutral-700 border border-neutral-300 transition hover:bg-neutral-50 dark:bg-neutral-800 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-60"
                              >
                                Từ chối
                              </button>
                              <button
                                type="button"
                                onClick={() => handleApproveEdit(booking._id)}
                                disabled={approvingEditId === booking._id}
                                className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition shadow-sm disabled:opacity-60 ${
                                  booking.editRequest.requestType === 'cancel'
                                  ? 'bg-red-600 hover:bg-red-700'
                                  : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                              >
                                {approvingEditId === booking._id 
                                  ? 'Đang xử lý...' 
                                  : booking.editRequest.requestType === 'cancel' ? 'Duyệt hủy lịch' : 'Duyệt lịch mới'
                                }
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                        <div>
                          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            <SummaryCell
                              label="Khách hàng"
                              value={booking.customerName || booking.userId?.name || '--'}
                              subValue={`${booking.customerEmail || booking.userId?.email || '--'}${
                                booking.customerPhone || booking.userId?.phone
                                  ? `\n${booking.customerPhone || booking.userId?.phone}`
                                  : ''
                              }`}
                            />

                            <SummaryCell
                              label="Ngày chụp"
                              value={booking.date || '--'}
                              subValue={`${getSessionLabel(booking)} • ${normalizeBookingSessions(booking).length || 1} buổi`}
                            />

                            <SummaryCell
                              label="Tổng tiền"
                              value={formatMoney(booking.totalPrice)}
                              subValue={paymentMethodMap[booking.paymentMethod] || '--'}
                            />
                          </div>

                          <div className="mt-5 rounded-2xl border border-dashed border-neutral-200 p-4 dark:border-neutral-700">
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                              Ghi chú
                            </p>
                            <p className="mt-2 text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
                              {booking.note || 'Không có ghi chú'}
                            </p>
                          </div>

                          <div className="mt-5 rounded-3xl border border-neutral-200 bg-neutral-50 p-5 dark:border-neutral-800 dark:bg-neutral-950">
                            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                              <div>
                                <p className="text-xs uppercase tracking-[0.25em] text-neutral-500 dark:text-neutral-400">
                                  Trạng thái booking
                                </p>
                                <h3 className="mt-2 text-xl font-semibold">
                                  Cập nhật tiến trình booking
                                </h3>
                              </div>

                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${statusInfo.className}`}
                              >
                                {statusInfo.label}
                              </span>
                            </div>

                            <select
                              value={booking.status}
                              disabled={updatingId === booking._id}
                              onChange={(e) => handleChangeStatus(booking._id, e.target.value)}
                              className="w-full rounded-2xl border border-neutral-200 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-900"
                            >
                              {statusOptions.map((status) => (
                                <option key={status} value={status}>
                                  {statusMap[status]?.label || status}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="rounded-3xl border border-neutral-200 bg-gradient-to-br from-white to-neutral-50 p-5 dark:border-neutral-800 dark:from-neutral-900 dark:to-neutral-950">
                          <div className="mb-4 flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs uppercase tracking-[0.25em] text-yellow-700 dark:text-yellow-400">
                                Đối soát thanh toán
                              </p>
                              <h3 className="mt-2 text-xl font-semibold">
                                Xử lý thanh toán booking
                              </h3>
                            </div>

                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${paymentInfo.className}`}
                            >
                              {paymentInfo.label}
                            </span>
                          </div>

                          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                            <InfoLine
                              label="Phương thức"
                              value={paymentMethodMap[booking.paymentMethod] || '--'}
                            />
                            <InfoLine
                              label="Provider"
                              value={booking.paymentProvider || (isQrPayment ? 'payOS' : '--')}
                            />
                            <InfoLine
                              label="Mã đơn thanh toán"
                              value={booking.paymentOrderCode || '--'}
                            />
                            <InfoLine
                              label="Đã thanh toán lúc"
                              value={formatDateTimeVN(booking.paidAt)}
                            />
                          </div>

                          {isQrPayment ? (
                            <div className="mt-4 rounded-2xl border border-dashed border-yellow-300 bg-yellow-50 px-4 py-4 text-sm leading-6 text-yellow-800 dark:border-yellow-500/30 dark:bg-yellow-500/10 dark:text-yellow-300">
                              Với thanh toán online, hệ thống nhận kết quả tự động từ payOS. Admin không xác nhận tay cho loại thanh toán này.
                            </div>
                          ) : null}

                          {isCashPayment ? (
                            <div className="mt-4 rounded-2xl border border-dashed border-blue-300 bg-blue-50 px-4 py-4 text-sm leading-6 text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300">
                              Với tiền mặt, chỉ xác nhận khi studio đã thực nhận tiền từ khách hàng.
                            </div>
                          ) : null}

                          <div className="mt-5 grid gap-3 sm:grid-cols-1">
                            {isCashPayment && !isPaid ? (
                              <button
                                type="button"
                                onClick={() => handleConfirmPayment(booking._id)}
                                disabled={paymentUpdatingId === booking._id}
                                className="rounded-2xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
                              >
                                {paymentUpdatingId === booking._id
                                  ? 'Đang xử lý...'
                                  : 'Xác nhận đã thu tiền'}
                              </button>
                            ) : isPaid ? (
                              <button
                                type="button"
                                onClick={() => handleMarkAsUnpaid(booking._id)}
                                disabled={paymentUpdatingId === booking._id}
                                className="rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-60 dark:bg-neutral-700 dark:hover:bg-neutral-600"
                              >
                                {paymentUpdatingId === booking._id
                                  ? 'Đang xử lý...'
                                  : 'Chuyển về chưa thanh toán'}
                              </button>
                            ) : (
                              <div className="rounded-2xl border border-dashed border-neutral-300 px-4 py-3 text-sm text-neutral-500 text-center dark:border-neutral-700 dark:text-neutral-400">
                                Thanh toán online sẽ tự cập nhật
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminBookingsPage