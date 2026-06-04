import Booking from '../models/Booking.js'
import Service from '../models/Service.js'
import User from '../models/User.js'
import generateBookingCode from '../utils/bookingCode.js'
import { sendEmail } from '../utils/mailer.js'
import { getBookingConfirmationTemplate } from '../utils/emailTemplates.js'
import { createNotification } from '../utils/createNotification.js'
import payOS from '../utils/payos.js'

const SESSION_TIME_MAP = {
  morning: '09:00',
  afternoon: '14:00',
  evening: '18:30',
}

const DEFAULT_SESSIONS = ['morning', 'afternoon', 'evening']

const normalizeDateString = (date) => {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const sanitizeTransferContent = (value) => {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 25)
}

const SESSION_LABEL_MAP = {
  morning: 'Buổi sáng',
  afternoon: 'Buổi chiều',
  evening: 'Buổi tối',
}

const normalizeSessions = (value) => {
  const rawSessions = Array.isArray(value) ? value : value ? [value] : []

  return [...new Set(rawSessions)]
    .map((item) => String(item || '').trim())
    .filter((item) => DEFAULT_SESSIONS.includes(item))
}

const getBookingSessions = (booking) => {
  const sessions = normalizeSessions(booking?.sessions)
  if (sessions.length > 0) return sessions

  return normalizeSessions(booking?.session)
}

const getPrimarySession = (sessions) => {
  return normalizeSessions(sessions)[0] || 'morning'
}

const getSessionLabel = (session, time) => {
  if (Array.isArray(session)) {
    const labels = normalizeSessions(session).map((item) => SESSION_LABEL_MAP[item])
    return labels.length ? labels.join(', ') : time || 'Khung giờ đã chọn'
  }

  return SESSION_LABEL_MAP[session] || time || 'Khung giờ đã chọn'
}

const getSessionsLabel = (sessions, time) => {
  return getSessionLabel(normalizeSessions(sessions), time)
}

const getServiceExtraSessionRate = (service) => {
  const rate = Number(service?.extraSessionRate)
  return Number.isFinite(rate) ? rate : 0.5
}

const calculateBookingTotalPrice = (service, sessions) => {
  const basePrice = Number(service?.price || 0)
  const sessionCount = Math.max(normalizeSessions(sessions).length, 1)
  const extraSessionRate = getServiceExtraSessionRate(service)

  return Math.round(basePrice + (sessionCount - 1) * basePrice * extraSessionRate)
}

const buildSessionConflictQuery = (date, sessions, excludeBookingId = null) => {
  const selectedSessions = normalizeSessions(sessions)
  const query = {
    date,
    status: { $in: ['pending', 'confirmed'] },
    $or: [
      { sessions: { $in: selectedSessions } },
      { session: { $in: selectedSessions } },
    ],
  }

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId }
  }

  return query
}

const generatePayOSOrderCode = () => {
  return Date.now()
}

export const getMonthlyAvailability = async (req, res) => {
  try {
    const { month } = req.query

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({
        success: false,
        message: 'month phải có dạng YYYY-MM',
      })
    }

    const [year, monthStr] = month.split('-')
    const startDate = new Date(`${year}-${monthStr}-01T00:00:00.000Z`)
    const endDate = new Date(Number(year), Number(monthStr), 0)
    endDate.setUTCHours(23, 59, 59, 999)

    const bookings = await Booking.find({
      date: {
        $gte: normalizeDateString(startDate),
        $lte: normalizeDateString(endDate),
      },
      status: { $nin: ['cancelled'] },
    }).select('date session sessions time status')

    const bookingMap = {}

    for (const booking of bookings) {
      if (!bookingMap[booking.date]) {
        bookingMap[booking.date] = new Set()
      }

      const sessions = getBookingSessions(booking)

      if (sessions.length > 0) {
        sessions.forEach((session) => bookingMap[booking.date].add(session))
      } else if (booking.time) {
        bookingMap[booking.date].add(booking.time)
      }
    }

    const daysInMonth = new Date(Number(year), Number(monthStr), 0).getDate()
    const result = []

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = `${year}-${monthStr}-${String(day).padStart(2, '0')}`
      const bookedSlots = bookingMap[date] ? bookingMap[date].size : 0
      const totalSlots = DEFAULT_SESSIONS.length
      const availableSlots = totalSlots - bookedSlots

      result.push({
        date,
        totalSlots,
        bookedSlots,
        availableSlots,
        isFull: availableSlots <= 0,
      })
    }

    return res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      success: false,
      message: 'Không thể lấy dữ liệu availability theo tháng',
      error: error.message,
    })
  }
}

export const createBooking = async (req, res) => {
  try {
    const {
      serviceId,
      serviceName,
      conceptId,
      conceptName,
      date,
      session,
      sessions,
      time,
      endTime,
      note,
      paymentMethod,
    } = req.body

    const resolvedSessions = normalizeSessions(sessions?.length ? sessions : session)
    const primarySession = getPrimarySession(resolvedSessions)
    const resolvedTime = SESSION_TIME_MAP[primarySession] || time
    const resolvedPaymentMethod = paymentMethod || 'cash'

    if (!date || resolvedSessions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn ngày và ít nhất một buổi chụp',
      })
    }

    if (!serviceId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn dịch vụ',
      })
    }

    if (!['cash', 'bank_qr'].includes(resolvedPaymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Phương thức thanh toán không hợp lệ',
      })
    }

    const service = await Service.findById(serviceId)

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Dịch vụ không tồn tại',
      })
    }

    if (service.allowMultiSession === false && resolvedSessions.length > 1) {
      return res.status(400).json({
        success: false,
        message: 'Dịch vụ này chỉ cho phép đặt một buổi chụp',
      })
    }

    const existingBooking = await Booking.findOne(
      buildSessionConflictQuery(date, resolvedSessions)
    )

    if (existingBooking) {
      return res.status(409).json({
        success: false,
        message: 'Một hoặc nhiều buổi bạn chọn đã có người đặt, vui lòng chọn buổi khác',
      })
    }

    const totalPrice = calculateBookingTotalPrice(service, resolvedSessions)
    const bookingCode = generateBookingCode()
    const transferContent = sanitizeTransferContent(`BK${bookingCode}`)

    const booking = await Booking.create({
      bookingCode,
      userId: req.user._id,
      serviceId,
      conceptId: conceptId || null,
      conceptName: conceptName || '',
      date,
      session: primarySession,
      sessions: resolvedSessions,
      time: resolvedTime,
      endTime: endTime || '',
      note: note || '',
      totalPrice,
      extraSessionRate: getServiceExtraSessionRate(service),
      status: 'pending',

      paymentMethod: resolvedPaymentMethod,
      paymentStatus: 'unpaid',

      transferContent,
      qrImageUrl: '',
      qrTemplate: '',
      bankCode: '',
      bankAccountNo: '',
      bankAccountName: '',

      paymentProvider: resolvedPaymentMethod === 'bank_qr' ? 'payos' : 'manual_qr',
      paymentOrderCode: null,
      paymentLinkId: '',
      checkoutUrl: '',
      paymentQrCode: '',
      reconciledAt: null,
      paymentWebhookRaw: null,
    })

    if (resolvedPaymentMethod === 'bank_qr') {
      const orderCode = generatePayOSOrderCode()

      const paymentLink = await payOS.paymentRequests.create({
        orderCode,
        amount: totalPrice,
        description: `Booking ${booking.bookingCode}`.slice(0, 25),
        items: [
          {
            name: `${service.name} (${resolvedSessions.length} buổi)`.slice(0, 100),
            quantity: 1,
            price: totalPrice,
          },
        ],
        cancelUrl: process.env.PAYOS_CANCEL_URL,
        returnUrl: process.env.PAYOS_RETURN_URL,
      })

      booking.paymentProvider = 'payos'
      booking.paymentOrderCode = orderCode
      booking.paymentLinkId = paymentLink?.id || ''
      booking.checkoutUrl = paymentLink?.checkoutUrl || ''
      booking.paymentQrCode = paymentLink?.qrCode || ''
      booking.qrImageUrl = paymentLink?.qrCode || ''

      await booking.save()
    }

    await createNotification({
      userId: req.user._id,
      title: 'Đặt lịch thành công',
      message: `Booking ${booking.bookingCode} cho dịch vụ ${service.name} đã được tạo thành công.`,
      type: 'booking_created',
      category: 'booking',
      priority: 'normal',
      senderRole: 'system',
      link: '/my-bookings',
      meta: {
        bookingId: booking._id,
        bookingCode: booking.bookingCode,
        serviceId: service._id,
        serviceName: service.name,
        paymentMethod: resolvedPaymentMethod,
        date: booking.date,
        session: booking.session,
        sessions: booking.sessions,
        totalPrice: booking.totalPrice,
      },
    })

    try {
      const user = await User.findById(req.user._id).select('name email')

      if (user?.email) {
        await sendEmail({
          to: user.email,
          subject: '[StudioLens] Xác nhận đặt lịch chụp ảnh',
          html: getBookingConfirmationTemplate({
            customerName: user.name,
            serviceName: serviceName || service.name,
            conceptName: conceptName || '',
            date: booking.date,
            time: getSessionsLabel(booking.sessions, booking.time),
            note: booking.note || '',
            bookingCode: booking.bookingCode || booking._id,
          }),
        })

        booking.confirmationEmailSent = true
        booking.confirmationEmailSentAt = new Date()
        booking.confirmationEmailError = ''
        await booking.save()
      }
    } catch (mailError) {
      console.error('Send confirmation email error:', mailError)

      booking.confirmationEmailSent = false
      booking.confirmationEmailError = mailError.message || 'Unknown mail error'
      await booking.save()
    }

    const populatedBooking = await Booking.findById(booking._id)
      .populate('userId', 'name email phone role')
      .populate('serviceId', 'name price category extraSessionRate allowMultiSession')
      .populate('conceptId', 'name image')

    return res.status(201).json({
      success: true,
      message:
        resolvedPaymentMethod === 'bank_qr'
          ? 'Đặt lịch thành công, vui lòng thanh toán qua payOS'
          : 'Đặt lịch thành công',
      booking: populatedBooking,
      paymentInfo:
        resolvedPaymentMethod === 'bank_qr'
          ? {
              paymentMethod: 'bank_qr',
              paymentStatus: booking.paymentStatus,
              qrImageUrl: booking.qrImageUrl,
              checkoutUrl: booking.checkoutUrl,
              paymentQrCode: booking.paymentQrCode,
              transferContent: booking.transferContent,
              amount: booking.totalPrice,
              paymentProvider: booking.paymentProvider,
              paymentOrderCode: booking.paymentOrderCode,
            }
          : {
              paymentMethod: 'cash',
              paymentStatus: booking.paymentStatus,
              amount: booking.totalPrice,
            },
    })
  } catch (error) {
    console.error('createBooking error:', error)
    return res.status(500).json({
      success: false,
      message: error?.message || 'Lỗi server khi tạo booking',
    })
  }
}

export const getBookings = async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { userId: req.user._id }

    const bookings = await Booking.find(query)
      .populate('userId', 'name email phone role')
      .populate('serviceId', 'name price category extraSessionRate allowMultiSession')
      .populate('conceptId', 'name image')
      .sort({ createdAt: -1 })

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    })
  } catch (error) {
    console.error('getBookings error:', error)
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách booking',
    })
  }
}

export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('userId', 'name email phone role')
      .populate('serviceId', 'name price category extraSessionRate allowMultiSession')
      .populate('conceptId', 'name image')

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy booking',
      })
    }

    if (
      req.user.role !== 'admin' &&
      booking.userId._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem booking này',
      })
    }

    return res.status(200).json({
      success: true,
      booking,
    })
  } catch (error) {
    console.error('getBookingById error:', error)
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy chi tiết booking',
    })
  }
}

export const updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy booking',
      })
    }

    const oldStatus = booking.status
    const oldDate = booking.date
    const oldSessions = getBookingSessions(booking)
    const oldSession = booking.session
    const oldTime = booking.time
    const oldPaymentStatus = booking.paymentStatus

    const isOwner = booking.userId.toString() === req.user._id.toString()
    const isAdmin = req.user.role === 'admin'

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền cập nhật booking này',
      })
    }

    if (!isAdmin && ['completed', 'cancelled'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: 'Không thể chỉnh sửa booking ở trạng thái này',
      })
    }

    const {
      date,
      session,
      sessions,
      time,
      endTime,
      note,
      serviceId,
      status,
      paymentStatus,
      paymentMethod,
      conceptId,
      conceptName,
    } = req.body

    const nextDate = date || booking.date
    const nextSessions = normalizeSessions(
      sessions !== undefined ? sessions : session !== undefined ? session : oldSessions
    )

    if (nextSessions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn ít nhất một buổi chụp',
      })
    }

    const nextPrimarySession = getPrimarySession(nextSessions)
    const nextTime = SESSION_TIME_MAP[nextPrimarySession] || time || booking.time
    const scheduleChanged =
      nextDate !== booking.date ||
      nextTime !== booking.time ||
      JSON.stringify(nextSessions) !== JSON.stringify(oldSessions)

    if (scheduleChanged) {
      const existingBooking = await Booking.findOne(
        buildSessionConflictQuery(nextDate, nextSessions, booking._id)
      )

      if (existingBooking) {
        return res.status(409).json({
          success: false,
          message: 'Một hoặc nhiều buổi muốn đổi đã có người đặt',
        })
      }
    }

    let serviceForPricing = null

    if (serviceId && serviceId !== booking.serviceId?.toString()) {
      const service = await Service.findById(serviceId)

      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Dịch vụ không tồn tại',
        })
      }

      if (service.allowMultiSession === false && nextSessions.length > 1) {
        return res.status(400).json({
          success: false,
          message: 'Dịch vụ này chỉ cho phép đặt một buổi chụp',
        })
      }

      booking.serviceId = serviceId
      serviceForPricing = service
    }

    if (!serviceForPricing && (scheduleChanged || serviceId)) {
      serviceForPricing = await Service.findById(booking.serviceId)
    }

    if (serviceForPricing) {
      if (serviceForPricing.allowMultiSession === false && nextSessions.length > 1) {
        return res.status(400).json({
          success: false,
          message: 'Dịch vụ này chỉ cho phép đặt một buổi chụp',
        })
      }

      booking.totalPrice = calculateBookingTotalPrice(serviceForPricing, nextSessions)
      booking.extraSessionRate = getServiceExtraSessionRate(serviceForPricing)
    }

    booking.date = nextDate
    booking.session = nextPrimarySession
    booking.sessions = nextSessions
    booking.time = nextTime
    booking.endTime = endTime ?? booking.endTime
    booking.note = note ?? booking.note

    if (conceptId !== undefined) {
      booking.conceptId = conceptId || null
    }

    if (conceptName !== undefined) {
      booking.conceptName = conceptName || ''
    }

    if (isAdmin && status) {
      booking.status = status
    }

    if (isAdmin && paymentMethod && ['cash', 'bank_qr'].includes(paymentMethod)) {
      booking.paymentMethod = paymentMethod
    }

    if (isAdmin && paymentStatus && ['unpaid', 'pending', 'paid'].includes(paymentStatus)) {
      booking.paymentStatus = paymentStatus
      booking.paidAt = paymentStatus === 'paid' ? new Date() : null
    }

    await booking.save()

    if (isAdmin && scheduleChanged) {
      await createNotification({
        userId: booking.userId,
        title: 'Lịch chụp đã được thay đổi',
        message: `Booking ${booking.bookingCode} đã được đổi sang ${booking.date} - ${getSessionsLabel(
          booking.sessions,
          booking.time
        )}.`,
        type: 'booking_rescheduled',
        category: 'booking',
        priority: 'high',
        senderRole: 'admin',
        link: '/my-bookings',
        meta: {
          bookingId: booking._id,
          bookingCode: booking.bookingCode,
          oldDate,
          newDate: booking.date,
          oldSession,
          oldSessions,
          newSession: booking.session,
          newSessions: booking.sessions,
          oldTime,
          newTime: booking.time,
        },
      })
    }

    if (isAdmin && status && oldStatus !== booking.status) {
      let title = 'Booking đã được cập nhật'
      let message = `Booking ${booking.bookingCode} vừa được cập nhật trạng thái.`
      let type = 'general'
      let category = 'booking'
      let priority = 'normal'

      if (booking.status === 'confirmed') {
        title = 'Booking đã được xác nhận'
        message = `Booking ${booking.bookingCode} của bạn đã được admin xác nhận.`
        type = 'booking_confirmed'
        priority = 'high'
      }

      if (booking.status === 'completed') {
        title = 'Buổi chụp đã hoàn thành'
        message = `Booking ${booking.bookingCode} đã được đánh dấu hoàn thành.`
        type = 'booking_completed'
        priority = 'normal'
      }

      if (booking.status === 'cancelled') {
        title = 'Booking đã bị hủy'
        message = `Booking ${booking.bookingCode} đã bị hủy.`
        type = 'booking_cancelled'
        priority = 'high'
      }

      await createNotification({
        userId: booking.userId,
        title,
        message,
        type,
        category,
        priority,
        senderRole: 'admin',
        link: '/my-bookings',
        meta: {
          bookingId: booking._id,
          bookingCode: booking.bookingCode,
          oldStatus,
          newStatus: booking.status,
        },
      })
    }

    if (
      isAdmin &&
      oldPaymentStatus !== booking.paymentStatus &&
      oldPaymentStatus === 'pending' &&
      booking.paymentStatus === 'unpaid'
    ) {
      await createNotification({
        userId: booking.userId,
        title: 'Xác nhận thanh toán không thành công',
        message: `Thanh toán cho booking ${booking.bookingCode} chưa được xác minh. Vui lòng kiểm tra lại và thực hiện lại nếu cần.`,
        type: 'payment_failed',
        category: 'payment',
        priority: 'high',
        senderRole: 'admin',
        link: '/my-bookings',
        meta: {
          bookingId: booking._id,
          bookingCode: booking.bookingCode,
          oldPaymentStatus,
          newPaymentStatus: booking.paymentStatus,
        },
      })
    }

    const updatedBooking = await Booking.findById(booking._id)
      .populate('userId', 'name email phone role')
      .populate('serviceId', 'name price category extraSessionRate allowMultiSession')
      .populate('conceptId', 'name image')

    return res.status(200).json({
      success: true,
      message: 'Cập nhật booking thành công',
      booking: updatedBooking,
    })
  } catch (error) {
    console.error('updateBooking error:', error)
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật booking',
    })
  }
}

export const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy booking',
      })
    }

    await booking.deleteOne()

    return res.status(200).json({
      success: true,
      message: 'Xóa booking thành công',
    })
  } catch (error) {
    console.error('deleteBooking error:', error)
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa booking',
    })
  }
}

export const getBookedSlotsByDate = async (req, res) => {
  try {
    const { date } = req.params

    const bookings = await Booking.find({
      date,
      status: { $in: ['pending', 'confirmed'] },
    }).select('time session sessions endTime status bookingCode')

    const bookedSlots = bookings.map((booking) => ({
      _id: booking._id,
      time: booking.time,
      session: booking.session,
      sessions: getBookingSessions(booking),
      endTime: booking.endTime,
      status: booking.status,
      bookingCode: booking.bookingCode,
    }))

    return res.status(200).json({
      success: true,
      date,
      bookedSlots,
    })
  } catch (error) {
    console.error('getBookedSlotsByDate error:', error)
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy slot đã đặt',
    })
  }
}

export const markAsPaid = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy booking',
      })
    }

    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền',
      })
    }

    if (booking.paymentMethod !== 'bank_qr') {
      return res.status(400).json({
        success: false,
        message: 'Không phải thanh toán QR',
      })
    }

    return res.status(400).json({
      success: false,
      message: 'Thanh toán QR đang dùng payOS, hệ thống sẽ tự xác nhận sau khi giao dịch thành công',
    })
  } catch (error) {
    console.error('markAsPaid error:', error)
    return res.status(500).json({
      success: false,
      message: 'Lỗi server',
    })
  }
}

export const confirmPayment = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy booking',
      })
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Chỉ admin mới được xác nhận thanh toán',
      })
    }

    if (booking.paymentMethod === 'bank_qr') {
      return res.status(400).json({
        success: false,
        message: 'Thanh toán QR được xác nhận tự động qua payOS, không xác nhận tay',
      })
    }

    if (booking.paymentMethod === 'cash' && booking.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Booking này đã được xác nhận thanh toán rồi',
      })
    }

    booking.paymentStatus = 'paid'
    booking.paidAt = new Date()
    booking.reconciledAt = new Date()

    await booking.save()

    await createNotification({
      userId: booking.userId,
      title: 'Thanh toán đã được xác nhận',
      message: `Studio đã xác nhận bạn đã thanh toán tiền mặt cho booking ${booking.bookingCode}.`,
      type: 'payment_confirmed',
      category: 'payment',
      priority: 'high',
      senderRole: 'admin',
      link: '/my-bookings',
      meta: {
        bookingId: booking._id,
        bookingCode: booking.bookingCode,
        paymentMethod: booking.paymentMethod,
        paymentStatus: booking.paymentStatus,
      },
    })

    return res.json({
      success: true,
      message: 'Đã xác nhận thu tiền mặt',
      booking,
    })
  } catch (error) {
    console.error('confirmPayment error:', error)
    return res.status(500).json({
      success: false,
      message: 'Lỗi server',
    })
  }
}

export const handlePayOSWebhook = async (req, res) => {
  try {
    const webhookData = payOS.webhooks.verify(req.body)
    const data = webhookData?.data || webhookData
    const orderCode = data?.orderCode

    if (!orderCode) {
      return res.status(200).json({
        success: true,
        message: 'No orderCode',
      })
    }

    const booking = await Booking.findOne({ paymentOrderCode: orderCode })

    if (!booking) {
      return res.status(200).json({
        success: true,
        message: 'Booking not found',
      })
    }

    if (booking.paymentStatus === 'paid') {
      return res.status(200).json({
        success: true,
        message: 'Already paid',
      })
    }

    booking.paymentStatus = 'paid'
    booking.paidAt = new Date()
    booking.reconciledAt = new Date()
    booking.paymentWebhookRaw = req.body

    await booking.save()

    await createNotification({
      userId: booking.userId,
      title: 'Thanh toán đã được xác nhận',
      message: `Thanh toán cho booking ${booking.bookingCode} đã được xác nhận tự động.`,
      type: 'payment_confirmed',
      category: 'payment',
      priority: 'high',
      senderRole: 'system',
      link: '/my-bookings',
      meta: {
        bookingId: booking._id,
        bookingCode: booking.bookingCode,
        paymentMethod: booking.paymentMethod,
        paymentStatus: booking.paymentStatus,
        paymentOrderCode: booking.paymentOrderCode,
      },
    })

    return res.status(200).json({
      success: true,
      message: 'Webhook processed',
    })
  } catch (error) {
    console.error('handlePayOSWebhook error:', error)
    return res.status(400).json({
      success: false,
      message: 'Webhook không hợp lệ',
    })
  }
}
export const verifyPayOSPayment = async (req, res) => {
  try {
    const { orderCode } = req.query

    if (!orderCode) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu orderCode',
      })
    }

    const booking = await Booking.findOne({ paymentOrderCode: Number(orderCode) })

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy booking tương ứng với giao dịch này',
      })
    }

    if (
      req.user.role !== 'admin' &&
      booking.userId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xác minh giao dịch này',
      })
    }

    if (booking.paymentStatus === 'paid') {
      return res.json({
        success: true,
        message: 'Booking đã được xác nhận thanh toán trước đó',
        booking,
      })
    }

    booking.paymentStatus = 'paid'
    booking.paidAt = new Date()
    booking.reconciledAt = new Date()

    await booking.save()

    await createNotification({
      userId: booking.userId,
      title: 'Thanh toán đã được xác nhận',
      message: `Thanh toán cho booking ${booking.bookingCode} đã được xác nhận thành công.`,
      type: 'payment_confirmed',
      category: 'payment',
      priority: 'high',
      senderRole: 'system',
      link: '/my-bookings',
      meta: {
        bookingId: booking._id,
        bookingCode: booking.bookingCode,
        paymentMethod: booking.paymentMethod,
        paymentStatus: booking.paymentStatus,
        paymentOrderCode: booking.paymentOrderCode,
      },
    })

    return res.json({
      success: true,
      message: 'Xác minh thanh toán thành công',
      booking,
    })
  } catch (error) {
    console.error('verifyPayOSPayment error:', error)
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi xác minh thanh toán',
    })
  }
}