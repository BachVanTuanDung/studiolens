import { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import {
  deleteBooking,
  getAllBookings,
  updateBooking,
  confirmPayment,
  markBookingAsUnpaid,
} from '../../api/bookingApi'
import { BOOKING_SESSIONS } from '../../utils/bookingSessions'

const statusOptions = ['pending', 'confirmed', 'completed', 'cancelled']
const sessionOptions = ['morning', 'afternoon', 'evening']

const statusMeta = {
  pending: {
    label: 'Chờ xác nhận',
    color: '#f59e0b',
    badgeClass:
      'bg-yellow-100 text-yellow-700 ring-1 ring-inset ring-yellow-200 dark:bg-yellow-500/15 dark:text-yellow-300 dark:ring-yellow-500/30',
  },
  confirmed: {
    label: 'Đã xác nhận',
    color: '#2563eb',
    badgeClass:
      'bg-blue-100 text-blue-700 ring-1 ring-inset ring-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-500/30',
  },
  completed: {
    label: 'Hoàn thành',
    color: '#16a34a',
    badgeClass:
      'bg-green-100 text-green-700 ring-1 ring-inset ring-green-200 dark:bg-green-500/15 dark:text-green-300 dark:ring-green-500/30',
  },
  cancelled: {
    label: 'Đã hủy',
    color: '#dc2626',
    badgeClass:
      'bg-red-100 text-red-700 ring-1 ring-inset ring-red-200 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-500/30',
  },
}

const paymentStatusMeta = {
  unpaid: {
    label: 'Chưa thanh toán',
    badgeClass:
      'bg-neutral-100 text-neutral-700 ring-1 ring-inset ring-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:ring-neutral-700',
  },
  pending: {
    label: 'Chờ đối soát',
    badgeClass:
      'bg-yellow-100 text-yellow-800 ring-1 ring-inset ring-yellow-200 dark:bg-yellow-500/15 dark:text-yellow-300 dark:ring-yellow-500/30',
  },
  paid: {
    label: 'Đã thanh toán',
    badgeClass:
      'bg-green-100 text-green-800 ring-1 ring-inset ring-green-200 dark:bg-green-500/15 dark:text-green-300 dark:ring-green-500/30',
  },
}

const paymentMethodMap = {
  cash: 'Tiền mặt',
  bank_qr: 'Chuyển khoản QR',
}

const sessionMeta = {
  morning: {
    label: 'Buổi sáng',
    shortLabel: 'Sáng',
    colorClass:
      'bg-sky-100 text-sky-700 ring-1 ring-inset ring-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-500/30',
    dotClass: 'bg-sky-500',
    timeFallback: ['09:00', '10:30'],
  },
  afternoon: {
    label: 'Buổi chiều',
    shortLabel: 'Chiều',
    colorClass:
      'bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/30',
    dotClass: 'bg-amber-500',
    timeFallback: ['13:00', '14:00', '14:30', '16:00'],
  },
  evening: {
    label: 'Buổi tối',
    shortLabel: 'Tối',
    colorClass:
      'bg-violet-100 text-violet-700 ring-1 ring-inset ring-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-500/30',
    dotClass: 'bg-violet-500',
    timeFallback: ['17:30', '18:30'],
  },
}

const getShiftedSessions = (booking, targetSession) => {
  const currentSessions = normalizeBookingSessions(booking)
  const sessionCount = Math.min(Math.max(currentSessions.length, 1), sessionOptions.length)
  const targetIndex = sessionOptions.indexOf(targetSession)

  if (targetIndex === -1) return currentSessions
  if (sessionCount === 1) return [targetSession]
  if (sessionCount >= sessionOptions.length) return [...sessionOptions]

  const startIndex = Math.min(targetIndex, sessionOptions.length - sessionCount)
  return sessionOptions.slice(startIndex, startIndex + sessionCount)
}

const normalizeSessions = (value) => {
  const raw = Array.isArray(value) ? value : value ? [value] : []
  return [...new Set(raw)].filter((item) => sessionMeta[item])
}

const normalizeBookingSessions = (booking) => {
  if (Array.isArray(booking?.sessions) && booking.sessions.length > 0) {
    return normalizeSessions(booking.sessions)
  }

  const inferredSession = booking?.session && sessionMeta[booking.session] ? booking.session : ''

  if (inferredSession) return [inferredSession]

  const time = booking?.time || ''

  if (sessionMeta.morning.timeFallback.includes(time)) return ['morning']
  if (sessionMeta.afternoon.timeFallback.includes(time)) return ['afternoon']
  if (sessionMeta.evening.timeFallback.includes(time)) return ['evening']

  return ['morning']
}

const inferSessionFromBooking = (booking) => {
  return normalizeBookingSessions(booking)[0] || 'morning'
}

const getSessionLabelFromArray = (sessions) => {
  const labels = normalizeSessions(sessions).map((key) => sessionMeta[key]?.label).filter(Boolean)
  return labels.length ? labels.join(', ') : '--'
}

const getSessionLabel = (booking) => {
  return getSessionLabelFromArray(normalizeBookingSessions(booking))
}

const getSessionShortLabel = (booking) => {
  const sessions = normalizeBookingSessions(booking)
  if (sessions.length > 1) return `${sessions.length} buổi`
  const key = sessions[0]
  return key ? sessionMeta[key].shortLabel : 'Booking'
}

const getSessionBadgeClass = (booking) => {
  const sessions = normalizeBookingSessions(booking)

  if (sessions.length > 1) {
    return 'bg-yellow-100 text-yellow-800 ring-1 ring-inset ring-yellow-200 dark:bg-yellow-500/15 dark:text-yellow-300 dark:ring-yellow-500/30'
  }

  const key = sessions[0]
  return key
    ? sessionMeta[key].colorClass
    : 'bg-neutral-100 text-neutral-700 ring-1 ring-inset ring-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:ring-neutral-700'
}

const getSessionDotClass = (booking, sessionKey = '') => {
  const key = sessionKey || inferSessionFromBooking(booking)
  return key ? sessionMeta[key].dotClass : 'bg-neutral-400'
}

const formatDateLocal = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const toEventDateTime = (date, time) => {
  if (!date || !time) return null
  return `${date}T${time}:00`
}

const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`

const formatDateTimeVN = (value) => {
  if (!value) return '--'
  return new Date(value).toLocaleString('vi-VN')
}

const formatDisplayDate = (value) => {
  if (!value) return '--'
  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}

const StatCard = ({ label, value, tone = 'neutral' }) => {
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
      <p className="text-xs uppercase tracking-[0.25em] opacity-80">{label}</p>
      <p className="mt-3 text-3xl font-bold">{value}</p>
    </div>
  )
}

const InfoCard = ({ label, children }) => (
  <div className="rounded-2xl border border-neutral-200 bg-white/80 p-4 shadow-sm backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-950/80">
    <p className="text-xs uppercase tracking-[0.25em] text-neutral-500 dark:text-neutral-400">
      {label}
    </p>
    <div className="mt-3">{children}</div>
  </div>
)

const FilterSelect = ({ value, onChange, children }) => (
  <select
    value={value}
    onChange={onChange}
    className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm transition focus:border-yellow-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
  >
    {children}
  </select>
)

const InfoLine = ({ label, value }) => (
  <div className="flex items-start justify-between gap-4 border-b border-neutral-100 py-2 last:border-b-0 dark:border-neutral-800">
    <span className="text-sm text-neutral-500 dark:text-neutral-400">{label}</span>
    <span className="max-w-[62%] break-words text-right text-sm font-medium text-neutral-900 dark:text-white">
      {value || '--'}
    </span>
  </div>
)

const QuickEditModal = ({
  booking,
  formData,
  setFormData,
  onClose,
  onSave,
  saving,
  deleting,
  onDelete,
}) => {
  if (!booking) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 p-4 backdrop-blur-sm">
      <div className="mx-auto mt-8 max-w-2xl rounded-[28px] border border-neutral-200 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900 dark:text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-yellow-700 dark:text-yellow-400">
              Chỉnh nhanh booking
            </p>
            <h3 className="mt-2 text-2xl font-bold">{booking.bookingCode || 'Booking'}</h3>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              {booking.customerName || booking.userId?.name || '--'} •{' '}
              {booking.serviceName || booking.serviceId?.name || '--'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-neutral-200 px-4 py-2 text-sm font-medium transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            Đóng
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">Ngày chụp</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, date: e.target.value }))
              }
              className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm transition focus:border-yellow-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Buổi chụp</label>
            <div className="grid gap-2">
              {sessionOptions.map((session) => {
                const checked = normalizeSessions(formData.sessions).includes(session)

                return (
                  <button
                    key={session}
                    type="button"
                    onClick={() => {
                      setFormData((prev) => {
                        const current = normalizeSessions(prev.sessions)
                        const next = current.includes(session)
                          ? current.filter((item) => item !== session)
                          : [...current, session]

                        const safeNext = next.length ? next : [session]

                        return {
                          ...prev,
                          session: safeNext[0],
                          sessions: safeNext,
                        }
                      })
                    }}
                    className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm transition ${
                      checked
                        ? 'border-yellow-500 bg-yellow-50 text-yellow-900 dark:bg-yellow-500/10 dark:text-yellow-200'
                        : 'border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-950'
                    }`}
                  >
                    <span>{sessionMeta[session].label}</span>
                    <span>{checked ? '✓' : ''}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium">Trạng thái</label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, status: e.target.value }))
              }
              className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm transition focus:border-yellow-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {statusMeta[status]?.label || status}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium">Ghi chú</label>
            <textarea
              value={formData.note}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, note: e.target.value }))
              }
              rows={4}
              className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm transition focus:border-yellow-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
              placeholder="Cập nhật ghi chú booking..."
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            {deleting ? 'Đang xóa...' : 'Xóa booking'}
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="rounded-2xl bg-yellow-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-yellow-800 disabled:opacity-60"
          >
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  )
}

const ConfirmRescheduleModal = ({ action, onClose, onConfirm, confirming }) => {
  if (!action) return null

  const bookingCode = action.booking?.bookingCode || 'Booking'
  const customerName =
    action.booking?.customerName || action.booking?.userId?.name || 'Khách hàng'

  return (
    <div className="fixed inset-0 z-50 bg-black/55 p-4 backdrop-blur-sm">
      <div className="mx-auto mt-12 max-w-xl rounded-[28px] border border-neutral-200 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900 dark:text-white">
        <p className="text-xs uppercase tracking-[0.28em] text-yellow-700 dark:text-yellow-400">
          Xác nhận đổi lịch
        </p>

        <h3 className="mt-3 text-2xl font-bold">Bạn có chắc muốn đổi booking này?</h3>

        <p className="mt-3 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
          Hệ thống sẽ cập nhật booking <span className="font-semibold">{bookingCode}</span> của{' '}
          <span className="font-semibold">{customerName}</span>.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-950">
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">
              Từ
            </p>
            <p className="mt-2 text-sm font-semibold">
              {formatDisplayDate(action.from.date)} •{' '}
              {getSessionLabelFromArray(action.from.sessions)}
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900/40 dark:bg-yellow-900/20">
            <p className="text-xs uppercase tracking-[0.2em] text-yellow-700 dark:text-yellow-300">
              Sang
            </p>
            <p className="mt-2 text-sm font-semibold text-yellow-900 dark:text-yellow-100">
              {formatDisplayDate(action.to.date)} •{' '}
              {getSessionLabelFromArray(action.to.sessions)}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-600 dark:bg-neutral-950 dark:text-neutral-300">
          Nếu buổi chụp mới đã có người đặt, hệ thống sẽ từ chối cập nhật và giữ nguyên booking cũ.
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-neutral-200 px-5 py-3 text-sm font-semibold transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            Hủy
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={confirming}
            className="rounded-2xl bg-yellow-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-yellow-800 disabled:opacity-60"
          >
            {confirming ? 'Đang cập nhật...' : 'Xác nhận đổi lịch'}
          </button>
        </div>
      </div>
    </div>
  )
}

const PlannerBookingCard = ({ booking, onOpen, onDragStart }) => {
  const customerName = booking.customerName || booking.userId?.name || 'Khách'
  const serviceName = booking.serviceName || booking.serviceId?.name || 'Booking'
  const status = statusMeta[booking.status] || statusMeta.pending

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, booking)}
      onClick={() => onOpen(booking)}
      className="cursor-grab rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing dark:border-neutral-800 dark:bg-neutral-950"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs uppercase tracking-[0.22em] text-yellow-700 dark:text-yellow-400">
            {booking.bookingCode || 'BOOKING'}
          </p>
          <p className="mt-2 truncate text-sm font-semibold text-neutral-900 dark:text-white">
            {customerName}
          </p>
          <p className="mt-1 truncate text-xs text-neutral-500 dark:text-neutral-400">
            {serviceName}
          </p>
        </div>

        <span
          className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.badgeClass}`}
        >
          {status.label}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-neutral-500 dark:text-neutral-400">
        <span>{booking.time || '--'}</span>
        <span>{formatMoney(booking.totalPrice)}</span>
      </div>
    </div>
  )
}

const renderEventContent = (eventInfo) => {
  const booking = eventInfo.event.extendedProps.booking
  const customerName = booking.customerName || booking.userId?.name || 'Khách'

  return (
    <div className="group overflow-hidden rounded-lg px-2 py-1.5 text-[11px] leading-tight transition duration-200">
      <div className="flex items-center gap-1.5">
        <span className={`h-2 w-2 rounded-full ${getSessionDotClass(booking, eventInfo.event.extendedProps.sessionKey)}`} />
        <span className="font-bold">{sessionMeta[eventInfo.event.extendedProps.sessionKey]?.shortLabel || getSessionShortLabel(booking)}</span>
      </div>
      <div className="mt-1 truncate font-medium">{customerName}</div>
      <div className="truncate opacity-90">
        {booking.serviceName || booking.serviceId?.name || 'Booking'}
      </div>
    </div>
  )
}

const AdminBookingCalendarPage = () => {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [editingBooking, setEditingBooking] = useState(null)
  const [plannerDate, setPlannerDate] = useState(formatDateLocal(new Date()))
  const [draggedBooking, setDraggedBooking] = useState(null)
  const [dropSessionHighlight, setDropSessionHighlight] = useState('')
  const [pendingReschedule, setPendingReschedule] = useState(null)

  const [editForm, setEditForm] = useState({
    date: '',
    session: 'morning',
    sessions: ['morning'],
    status: 'pending',
    note: '',
  })

  const [updatingId, setUpdatingId] = useState('')
  const [deletingId, setDeletingId] = useState('')
  const [paymentUpdatingId, setPaymentUpdatingId] = useState('')

  const [searchKeyword, setSearchKeyword] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterSession, setFilterSession] = useState('all')
  const [filterDate, setFilterDate] = useState('')

  const calendarRef = useRef(null)

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const res = await getAllBookings()
      setBookings(res.data?.bookings || [])
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.message || 'Không thể tải lịch booking')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  const stats = useMemo(() => {
    const total = bookings.length
    const pending = bookings.filter((b) => b.status === 'pending').length
    const confirmed = bookings.filter((b) => b.status === 'confirmed').length
    const completed = bookings.filter((b) => b.status === 'completed').length

    return { total, pending, confirmed, completed }
  }, [bookings])

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const normalizedKeyword = searchKeyword.trim().toLowerCase()
      const customerName = (booking.customerName || booking.userId?.name || '').toLowerCase()
      const bookingCode = (booking.bookingCode || '').toLowerCase()
      const serviceName = (booking.serviceName || booking.serviceId?.name || '').toLowerCase()
      const conceptName = (booking.conceptName || booking.conceptId?.name || '').toLowerCase()
      const sessions = normalizeBookingSessions(booking)

      const matchesKeyword =
        !normalizedKeyword ||
        customerName.includes(normalizedKeyword) ||
        bookingCode.includes(normalizedKeyword) ||
        serviceName.includes(normalizedKeyword) ||
        conceptName.includes(normalizedKeyword)

      const matchesStatus = filterStatus === 'all' || booking.status === filterStatus
      const matchesSession = filterSession === 'all' || sessions.includes(filterSession)
      const matchesDate = !filterDate || booking.date === filterDate

      return matchesKeyword && matchesStatus && matchesSession && matchesDate
    })
  }, [bookings, searchKeyword, filterStatus, filterSession, filterDate])

  const plannerBookings = useMemo(() => {
    return filteredBookings.filter((booking) => booking.date === plannerDate)
  }, [filteredBookings, plannerDate])

  const plannerGrouped = useMemo(() => {
    const groups = {
      morning: [],
      afternoon: [],
      evening: [],
    }

    plannerBookings.forEach((booking) => {
      const sessions = normalizeBookingSessions(booking)
      sessions.forEach((key) => {
        if (groups[key]) groups[key].push(booking)
      })
    })

    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => (a.time || '').localeCompare(b.time || ''))
    })

    return groups
  }, [plannerBookings])

  const calendarEvents = useMemo(() => {
    return filteredBookings
      .flatMap((booking) => {
        const meta = statusMeta[booking.status] || statusMeta.pending
        const sessions = normalizeBookingSessions(booking)

        return sessions.map((sessionKey) => {
          const eventTime = sessionMeta[sessionKey]?.timeFallback?.[0] || booking.time
          const start = toEventDateTime(booking.date, eventTime)
          if (!start) return null

          return {
            id: `${booking._id}-${sessionKey}`,
            title: `${sessionMeta[sessionKey]?.shortLabel || 'Buổi'} - ${
              booking.customerName || booking.userId?.name || 'Khách'
            }`,
            start,
            backgroundColor: meta.color,
            borderColor: meta.color,
            extendedProps: { booking, sessionKey },
          }
        })
      })
      .filter(Boolean)
  }, [filteredBookings])

  const openQuickEdit = (booking) => {
    const inferredSession = inferSessionFromBooking(booking) || 'morning'

    setEditingBooking(booking)
    setEditForm({
      date: booking.date || '',
      session: inferredSession,
      sessions: normalizeBookingSessions(booking),
      status: booking.status || 'pending',
      note: booking.note || '',
    })
  }

  const applyUpdatedBooking = (updatedBooking, fallbackChanges = {}) => {
    const mergedBooking = updatedBooking || {
      ...selectedBooking,
      ...fallbackChanges,
    }

    setBookings((prev) =>
      prev.map((item) =>
        item._id === mergedBooking._id ? mergedBooking : item
      )
    )

    if (selectedBooking?._id === mergedBooking._id) {
      setSelectedBooking(mergedBooking)
    }

    if (editingBooking?._id === mergedBooking._id) {
      setEditingBooking(mergedBooking)
    }
  }

  const handleEventClick = (info) => {
    const booking = info.event.extendedProps.booking
    setSelectedBooking(booking)
    setPlannerDate(booking.date)
  }

  const handleDateClick = (arg) => {
    setPlannerDate(arg.dateStr)
  }

  const handleChangeStatus = async (bookingId, status) => {
    try {
      setUpdatingId(bookingId)
      const res = await updateBooking(bookingId, { status })
      const updated = res.data?.booking

      setBookings((prev) =>
        prev.map((item) => (item._id === bookingId ? updated || { ...item, status } : item))
      )

      if (selectedBooking?._id === bookingId) {
        setSelectedBooking((prev) => ({
          ...prev,
          ...(updated || { status }),
        }))
      }

      if (editingBooking?._id === bookingId) {
        setEditingBooking((prev) => ({
          ...prev,
          ...(updated || { status }),
        }))
      }

      toast.success('Cập nhật trạng thái thành công')
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.message || 'Cập nhật trạng thái thất bại')
    } finally {
      setUpdatingId('')
    }
  }

  const handleQuickSave = async () => {
    if (!editingBooking) return

    try {
      setUpdatingId(editingBooking._id)

      const res = await updateBooking(editingBooking._id, {
        date: editForm.date,
        session: normalizeSessions(editForm.sessions)[0] || editForm.session,
        sessions: normalizeSessions(editForm.sessions),
        status: editForm.status,
        note: editForm.note,
      })

      const updated = res.data?.booking

      setBookings((prev) =>
        prev.map((item) =>
          item._id === editingBooking._id ? updated || { ...item, ...editForm } : item
        )
      )

      setSelectedBooking(updated || { ...editingBooking, ...editForm })
      setEditingBooking(null)
      toast.success('Đã lưu thay đổi booking')
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.message || 'Lưu thay đổi thất bại')
    } finally {
      setUpdatingId('')
    }
  }

  const handleDeleteBooking = async (bookingId) => {
    const confirmed = window.confirm('Bạn có chắc muốn xóa booking này không?')
    if (!confirmed) return

    try {
      setDeletingId(bookingId)
      await deleteBooking(bookingId)

      setBookings((prev) => prev.filter((item) => item._id !== bookingId))

      if (selectedBooking?._id === bookingId) {
        setSelectedBooking(null)
      }

      if (editingBooking?._id === bookingId) {
        setEditingBooking(null)
      }

      toast.success('Xóa booking thành công')
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.message || 'Xóa booking thất bại')
    } finally {
      setDeletingId('')
    }
  }

  const askForReschedule = (booking, toDate, toSessions, revertCallback = null) => {
    const currentSessions = normalizeBookingSessions(booking)
    const nextSessions = normalizeSessions(toSessions)
    const from = {
      date: booking.date,
      sessions: currentSessions,
    }
    const to = {
      date: toDate,
      sessions: nextSessions.length ? nextSessions : currentSessions,
    }

    if (from.date === to.date && JSON.stringify(from.sessions) === JSON.stringify(to.sessions)) {
      if (revertCallback) revertCallback()
      return
    }

    setPendingReschedule({
      booking,
      from,
      to,
      revertCallback,
    })
  }

  const confirmReschedule = async () => {
    if (!pendingReschedule) return

    const { booking, to, revertCallback } = pendingReschedule

    try {
      setUpdatingId(booking._id)

      const res = await updateBooking(booking._id, {
        date: to.date,
        session: normalizeSessions(to.sessions)[0],
        sessions: normalizeSessions(to.sessions),
      })

      const updated = res.data?.booking

      setBookings((prev) =>
        prev.map((item) =>
          item._id === booking._id
            ? updated || { ...item, date: to.date, session: normalizeSessions(to.sessions)[0], sessions: normalizeSessions(to.sessions) }
            : item
        )
      )

      if (selectedBooking?._id === booking._id) {
        setSelectedBooking(updated || { ...booking, date: to.date, session: normalizeSessions(to.sessions)[0], sessions: normalizeSessions(to.sessions) })
      }

      if (editingBooking?._id === booking._id) {
        setEditingBooking(updated || { ...booking, date: to.date, session: normalizeSessions(to.sessions)[0], sessions: normalizeSessions(to.sessions) })
      }

      setPlannerDate(to.date)
      toast.success('Đã đổi lịch booking thành công')
    } catch (error) {
      console.error(error)
      if (revertCallback) revertCallback()
      toast.error(
        error.response?.data?.message || 'Không thể chuyển booking sang lịch mới'
      )
    } finally {
      setUpdatingId('')
      setPendingReschedule(null)
      setDraggedBooking(null)
      setDropSessionHighlight('')
    }
  }

  const cancelReschedule = () => {
    if (pendingReschedule?.revertCallback) {
      pendingReschedule.revertCallback()
    }
    setPendingReschedule(null)
    setDraggedBooking(null)
    setDropSessionHighlight('')
  }

  const handleEventDrop = async (info) => {
    const booking = info.event.extendedProps.booking
    const newDate = formatDateLocal(info.event.start)
    askForReschedule(booking, newDate, normalizeBookingSessions(booking), () => info.revert())
  }

  const handlePlannerDragStart = (event, booking) => {
    event.dataTransfer.setData('text/plain', booking._id)
    setDraggedBooking(booking)
  }

  const handlePlannerDrop = (sessionKey) => {
    if (!draggedBooking) return

    const nextSessions = getShiftedSessions(draggedBooking, sessionKey)
    askForReschedule(draggedBooking, plannerDate, nextSessions)
  }

  const handleConfirmPayment = async (bookingId) => {
    try {
      setPaymentUpdatingId(bookingId)
      const res = await confirmPayment(bookingId)
      const updated = res.data?.booking

      setBookings((prev) =>
        prev.map((item) =>
          item._id === bookingId
            ? updated || { ...item, paymentStatus: 'paid', paidAt: new Date().toISOString() }
            : item
        )
      )

      if (selectedBooking?._id === bookingId) {
        setSelectedBooking((prev) => ({
          ...prev,
          ...(updated || { paymentStatus: 'paid', paidAt: new Date().toISOString() }),
        }))
      }

      toast.success(res.data?.message || 'Đã xác nhận thanh toán')
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
      const res = await markBookingAsUnpaid(bookingId)
      const updated = res.data?.booking

      setBookings((prev) =>
        prev.map((item) =>
          item._id === bookingId
            ? updated || { ...item, paymentStatus: 'unpaid', paidAt: null }
            : item
        )
      )

      if (selectedBooking?._id === bookingId) {
        setSelectedBooking((prev) => ({
          ...prev,
          ...(updated || { paymentStatus: 'unpaid', paidAt: null }),
        }))
      }

      toast.success(res?.data?.message || 'Đã chuyển về chưa thanh toán')
    } catch (error) {
      console.error(error)
      toast.error(error?.response?.data?.message || 'Cập nhật thanh toán thất bại')
    } finally {
      setPaymentUpdatingId('')
    }
  }

  const resetFilters = () => {
    setSearchKeyword('')
    setFilterStatus('all')
    setFilterSession('all')
    setFilterDate('')
  }

  const selectedStatusMeta =
    statusMeta[selectedBooking?.status] || {
      label: selectedBooking?.status || '--',
      badgeClass:
        'bg-neutral-100 text-neutral-700 ring-1 ring-inset ring-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:ring-neutral-700',
    }

  const selectedPaymentMeta =
    paymentStatusMeta[selectedBooking?.paymentStatus] || {
      label: selectedBooking?.paymentStatus || '--',
      badgeClass:
        'bg-neutral-100 text-neutral-700 ring-1 ring-inset ring-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:ring-neutral-700',
    }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-yellow-700 dark:text-yellow-400">
            Quản lý booking
          </p>
          <div className="mt-3 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h1 className="text-5xl font-bold tracking-tight text-neutral-900 dark:text-white">
                Booking Calendar
              </h1>
              <p className="mt-3 max-w-3xl text-neutral-600 dark:text-neutral-300">
                Theo dõi lịch chụp theo tháng, kéo thả đổi ngày trên calendar, và điều phối nhanh
                buổi sáng / chiều / tối bằng bảng planner theo ngày.
              </p>
            </div>

            <div className="inline-flex rounded-full border border-yellow-200 bg-yellow-50 px-4 py-2 text-sm font-medium text-yellow-800 dark:border-yellow-900/40 dark:bg-yellow-900/20 dark:text-yellow-300">
              Drag & Drop reschedule
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-[28px] border border-neutral-200 bg-white p-10 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:text-white">
            Đang tải lịch booking...
          </div>
        ) : (
          <>
            <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Tổng booking" value={stats.total} tone="neutral" />
              <StatCard label="Chờ xác nhận" value={stats.pending} tone="yellow" />
              <StatCard label="Đã xác nhận" value={stats.confirmed} tone="blue" />
              <StatCard label="Hoàn thành" value={stats.completed} tone="green" />
            </div>

            <div className="mb-6 rounded-[28px] border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex flex-col gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                    Bộ lọc nhanh
                  </h2>
                  <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                    Lọc theo khách hàng, mã booking, dịch vụ, concept, trạng thái, buổi và ngày chụp.
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="Tìm theo khách / mã / dịch vụ / concept..."
                    className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm transition focus:border-yellow-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
                  />

                  <FilterSelect
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="all">Tất cả trạng thái</option>
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {statusMeta[status]?.label || status}
                      </option>
                    ))}
                  </FilterSelect>

                  <FilterSelect
                    value={filterSession}
                    onChange={(e) => setFilterSession(e.target.value)}
                  >
                    <option value="all">Tất cả buổi</option>
                    {sessionOptions.map((session) => (
                      <option key={session} value={session}>
                        {sessionMeta[session].label}
                      </option>
                    ))}
                  </FilterSelect>

                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm transition focus:border-yellow-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
                  />

                  <button
                    type="button"
                    onClick={resetFilters}
                    className="rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-semibold transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                  >
                    Đặt lại bộ lọc
                  </button>
                </div>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.65fr_0.95fr]">
              <div className="space-y-6">
                <div className="overflow-hidden rounded-[28px] border border-neutral-200 bg-white p-4 shadow-sm transition duration-300 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                        Lịch booking theo tháng
                      </h2>
                      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                        Kéo thả booking để đổi ngày. Bấm vào ngày hoặc booking để đồng bộ planner bên dưới.
                      </p>
                    </div>

                    <div className="hidden rounded-full bg-neutral-100 px-4 py-2 text-xs font-medium text-neutral-600 md:block dark:bg-neutral-800 dark:text-neutral-300">
                      Monthly calendar view
                    </div>
                  </div>

                  <div className="calendar-shell">
                    <FullCalendar
                      ref={calendarRef}
                      plugins={[dayGridPlugin, interactionPlugin]}
                      initialView="dayGridMonth"
                      editable
                      selectable
                      eventStartEditable
                      headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth',
                      }}
                      events={calendarEvents}
                      eventClick={handleEventClick}
                      eventContent={renderEventContent}
                      eventDrop={handleEventDrop}
                      dateClick={handleDateClick}
                      height="auto"
                      locale="vi"
                      buttonText={{
                        today: 'Hôm nay',
                        month: 'Tháng',
                      }}
                    />
                  </div>
                </div>

                <div className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-sm transition duration-300 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
                  <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-yellow-700 dark:text-yellow-400">
                        Planner theo ngày
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold text-neutral-900 dark:text-white">
                        Điều phối booking trong ngày {formatDisplayDate(plannerDate)}
                      </h2>
                      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                        Kéo booking giữa 3 cột để đổi buổi chụp. Hệ thống sẽ hỏi xác nhận trước khi cập nhật.
                      </p>
                    </div>

                    <input
                      type="date"
                      value={plannerDate}
                      onChange={(e) => setPlannerDate(e.target.value)}
                      className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm transition focus:border-yellow-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
                    />
                  </div>

                  <div className="grid gap-4 xl:grid-cols-3">
                    {BOOKING_SESSIONS.map((sessionItem) => {
                      const sessionKey = sessionItem.key
                      const bookingsInSession = plannerGrouped[sessionKey] || []
                      const isDropActive = dropSessionHighlight === sessionKey

                      return (
                        <div
                          key={sessionKey}
                          onDragOver={(e) => {
                            e.preventDefault()
                            setDropSessionHighlight(sessionKey)
                          }}
                          onDragLeave={() => setDropSessionHighlight('')}
                          onDrop={(e) => {
                            e.preventDefault()
                            setDropSessionHighlight('')
                            handlePlannerDrop(sessionKey)
                          }}
                          className={`rounded-[24px] border p-4 transition ${
                            isDropActive
                              ? 'border-yellow-400 bg-yellow-50 dark:border-yellow-500 dark:bg-yellow-900/20'
                              : 'border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950'
                          }`}
                        >
                          <div className="mb-4 flex items-center justify-between gap-3">
                            <div>
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${sessionMeta[sessionKey].colorClass}`}
                              >
                                {sessionItem.label}
                              </span>
                              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                                {sessionItem.description}
                              </p>
                            </div>

                            <div className="rounded-2xl bg-white px-3 py-2 text-sm font-semibold shadow-sm dark:bg-neutral-900">
                              {bookingsInSession.length}
                            </div>
                          </div>

                          <div className="space-y-3 min-h-[220px]">
                            {bookingsInSession.length === 0 ? (
                              <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white/70 px-4 text-center text-sm text-neutral-400 dark:border-neutral-700 dark:bg-neutral-900/60 dark:text-neutral-500">
                                Kéo booking vào đây
                              </div>
                            ) : (
                              bookingsInSession.map((booking) => (
                                <PlannerBookingCard
                                  key={booking._id}
                                  booking={booking}
                                  onOpen={(item) => {
                                    setSelectedBooking(item)
                                    openQuickEdit(item)
                                  }}
                                  onDragStart={handlePlannerDragStart}
                                />
                              ))
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-neutral-200 bg-gradient-to-b from-white to-neutral-50 p-6 shadow-sm transition duration-300 hover:shadow-lg dark:border-neutral-800 dark:from-neutral-900 dark:to-neutral-950 dark:text-white">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-2xl font-semibold">Chi tiết booking</h2>

                  {selectedBooking && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${selectedStatusMeta.badgeClass}`}
                      >
                        {selectedStatusMeta.label}
                      </span>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${selectedPaymentMeta.badgeClass}`}
                      >
                        {selectedPaymentMeta.label}
                      </span>
                    </div>
                  )}
                </div>

                {!selectedBooking ? (
                  <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 bg-white/70 p-8 text-center text-neutral-500 dark:border-neutral-700 dark:bg-neutral-950/60 dark:text-neutral-400">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-2xl dark:bg-neutral-800">
                      📅
                    </div>
                    Chọn một booking trên lịch hoặc trong planner để xem chi tiết.
                  </div>
                ) : (
                  <div className="mt-6 space-y-4">
                    <InfoCard label="Mã booking">
                      <p className="font-semibold text-neutral-900 dark:text-white">
                        {selectedBooking.bookingCode || '--'}
                      </p>
                    </InfoCard>

                    <InfoCard label="Khách hàng">
                      <p className="font-semibold text-neutral-900 dark:text-white">
                        {selectedBooking.customerName || selectedBooking.userId?.name || '--'}
                      </p>
                      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                        {selectedBooking.customerEmail || selectedBooking.userId?.email || '--'}
                      </p>
                      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                        {selectedBooking.customerPhone || selectedBooking.userId?.phone || '--'}
                      </p>
                    </InfoCard>

                    <InfoCard label="Dịch vụ & concept">
                      <p className="font-semibold text-neutral-900 dark:text-white">
                        {selectedBooking.serviceName ||
                          selectedBooking.serviceId?.name ||
                          '--'}
                      </p>
                      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                        {selectedBooking.conceptName ||
                          selectedBooking.conceptId?.name ||
                          'Không có concept'}
                      </p>
                    </InfoCard>

                    <div className="grid gap-4 md:grid-cols-2">
                      <InfoCard label="Ngày chụp">
                        <p className="font-semibold text-neutral-900 dark:text-white">
                          {selectedBooking.date || '--'}
                        </p>
                      </InfoCard>

                      <InfoCard label="Buổi chụp">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getSessionBadgeClass(
                            selectedBooking
                          )}`}
                        >
                          {getSessionLabel(selectedBooking)}
                        </span>
                      </InfoCard>
                    </div>

                    <InfoCard label="Thanh toán">
                      <div className="space-y-2">
                        <InfoLine
                          label="Phương thức"
                          value={paymentMethodMap[selectedBooking.paymentMethod] || '--'}
                        />
                        <InfoLine
                          label="Tổng chi phí"
                          value={formatMoney(selectedBooking.totalPrice)}
                        />
                        <InfoLine
                          label="Nội dung CK"
                          value={selectedBooking.transferContent || '--'}
                        />
                        <InfoLine
                          label="Thanh toán lúc"
                          value={formatDateTimeVN(selectedBooking.paidAt)}
                        />
                      </div>
                    </InfoCard>

                    <InfoCard label="Ghi chú">
                      <p className="text-sm text-neutral-700 dark:text-neutral-300">
                        {selectedBooking.note || 'Không có ghi chú'}
                      </p>
                    </InfoCard>

                    <div className="grid gap-3">
                      <button
                        type="button"
                        onClick={() => openQuickEdit(selectedBooking)}
                        className="rounded-2xl bg-yellow-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-yellow-800"
                      >
                        Chỉnh nhanh booking
                      </button>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleChangeStatus(
                              selectedBooking._id,
                              selectedBooking.status === 'confirmed'
                                ? 'completed'
                                : 'confirmed'
                            )
                          }
                          disabled={updatingId === selectedBooking._id}
                          className="rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-semibold transition hover:bg-neutral-100 disabled:opacity-60 dark:border-neutral-700 dark:hover:bg-neutral-800"
                        >
                          {selectedBooking.status === 'confirmed'
                            ? 'Đánh dấu hoàn thành'
                            : 'Xác nhận booking'}
                        </button>

                        {selectedBooking.paymentStatus !== 'paid' ? (
                          <button
                            type="button"
                            onClick={() => handleConfirmPayment(selectedBooking._id)}
                            disabled={paymentUpdatingId === selectedBooking._id}
                            className="rounded-2xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
                          >
                            {paymentUpdatingId === selectedBooking._id
                              ? 'Đang xử lý...'
                              : selectedBooking.paymentMethod === 'cash'
                                ? 'Xác nhận đã thu tiền'
                                : 'Xác nhận thanh toán'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleMarkAsUnpaid(selectedBooking._id)}
                            disabled={paymentUpdatingId === selectedBooking._id}
                            className="rounded-2xl bg-neutral-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-60 dark:bg-neutral-700 dark:hover:bg-neutral-600"
                          >
                            {paymentUpdatingId === selectedBooking._id
                              ? 'Đang xử lý...'
                              : 'Chuyển về chưa thanh toán'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <QuickEditModal
              booking={editingBooking}
              formData={editForm}
              setFormData={setEditForm}
              onClose={() => setEditingBooking(null)}
              onSave={handleQuickSave}
              saving={updatingId === editingBooking?._id}
              deleting={deletingId === editingBooking?._id}
              onDelete={() => handleDeleteBooking(editingBooking?._id)}
            />

            <ConfirmRescheduleModal
              action={pendingReschedule}
              onClose={cancelReschedule}
              onConfirm={confirmReschedule}
              confirming={updatingId === pendingReschedule?.booking?._id}
            />

            <style>{`
              .calendar-shell .fc {
                --fc-border-color: #e5e7eb;
                --fc-page-bg-color: transparent;
                --fc-neutral-bg-color: #f5f5f5;
                --fc-today-bg-color: rgba(245, 158, 11, 0.08);
                --fc-event-border-color: transparent;
                --fc-button-bg-color: #111827;
                --fc-button-border-color: #111827;
                --fc-button-hover-bg-color: #0b1220;
                --fc-button-hover-border-color: #0b1220;
                --fc-button-active-bg-color: #ca8a04;
                --fc-button-active-border-color: #ca8a04;
              }

              .calendar-shell .fc-toolbar-title {
                font-size: 1.5rem;
                font-weight: 700;
              }

              .calendar-shell .fc-button {
                border-radius: 14px !important;
                box-shadow: none !important;
                transition: all 0.2s ease;
              }

              .calendar-shell .fc-button:hover {
                transform: translateY(-1px);
              }

              .calendar-shell .fc-scrollgrid,
              .calendar-shell .fc-theme-standard td,
              .calendar-shell .fc-theme-standard th {
                border-color: #e5e7eb;
              }

              .calendar-shell .fc-col-header-cell {
                background: #fafafa;
                font-weight: 700;
                padding: 6px 0;
              }

              .calendar-shell .fc-daygrid-day-frame {
                min-height: 110px;
              }

              .calendar-shell .fc-event {
                border: 0 !important;
                border-radius: 12px !important;
                box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
                transition: transform 0.18s ease, box-shadow 0.18s ease;
                overflow: hidden;
                cursor: pointer;
              }

              .calendar-shell .fc-event:hover {
                transform: translateY(-1px) scale(1.01);
                box-shadow: 0 10px 24px rgba(0, 0, 0, 0.16);
              }

              .calendar-shell .fc-daygrid-event {
                margin: 2px 4px;
              }

              .dark .calendar-shell .fc {
                --fc-border-color: #262626;
                --fc-neutral-bg-color: #171717;
                --fc-page-bg-color: transparent;
                --fc-today-bg-color: rgba(245, 158, 11, 0.12);
                color: white;
              }

              .dark .calendar-shell .fc-col-header-cell {
                background: #171717;
              }

              .dark .calendar-shell .fc-theme-standard td,
              .dark .calendar-shell .fc-theme-standard th,
              .dark .calendar-shell .fc-scrollgrid {
                border-color: #262626;
              }
            `}</style>
          </>
        )}
      </div>
    </div>
  )
}

export default AdminBookingCalendarPage