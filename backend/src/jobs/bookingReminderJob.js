import cron from 'node-cron'
import Booking from '../models/Booking.js'
import User from '../models/User.js'
import { sendEmail } from '../utils/mailer.js'
import { getBookingReminderTemplate } from '../utils/emailTemplates.js'
import { createNotification } from '../utils/createNotification.js'

const TIMEZONE = 'Asia/Ho_Chi_Minh'

const SESSION_START_TIME = {
  morning: { hour: 9, minute: 0 },
  afternoon: { hour: 14, minute: 0 },
  evening: { hour: 18, minute: 30 },
}

const getSessionLabel = (session) => {
  if (session === 'morning') return 'Buổi sáng'
  if (session === 'afternoon') return 'Buổi chiều'
  if (session === 'evening') return 'Buổi tối'
  return 'Khung giờ đã chọn'
}

const parseDateOnly = (dateStr) => {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day, 0, 0, 0, 0)
}

const setTimeForDate = (date, hour, minute) => {
  const d = new Date(date)
  d.setHours(hour, minute, 0, 0)
  return d
}

const addDays = (date, days) => {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

/**
 * Nhắc trước 1 buổi:
 * - morning  -> remind at previous day's evening
 * - afternoon -> remind at same day's morning
 * - evening -> remind at same day's afternoon
 */
const getReminderDateTimeBySession = (bookingDateStr, session) => {
  if (!bookingDateStr || !session) return null

  const bookingDate = parseDateOnly(bookingDateStr)

  if (session === 'morning') {
    const previousDay = addDays(bookingDate, -1)
    return setTimeForDate(
      previousDay,
      SESSION_START_TIME.evening.hour,
      SESSION_START_TIME.evening.minute
    )
  }

  if (session === 'afternoon') {
    return setTimeForDate(
      bookingDate,
      SESSION_START_TIME.morning.hour,
      SESSION_START_TIME.morning.minute
    )
  }

  if (session === 'evening') {
    return setTimeForDate(
      bookingDate,
      SESSION_START_TIME.afternoon.hour,
      SESSION_START_TIME.afternoon.minute
    )
  }

  return null
}

export const startBookingReminderJob = () => {
  cron.schedule(
    '*/10 * * * *',
    async () => {
      try {
        const now = new Date()
        const reminderWindowStart = new Date(now)
        const reminderWindowEnd = new Date(now.getTime() + 10 * 60 * 1000)

        const bookings = await Booking.find({
          reminderSent: false,
          status: { $nin: ['cancelled', 'completed'] },
        })

        for (const booking of bookings) {
          try {
            if (!booking.date || !booking.session) continue

            const reminderDateTime = getReminderDateTimeBySession(
              booking.date,
              booking.session
            )

            if (!reminderDateTime) continue

            if (
              reminderDateTime >= reminderWindowStart &&
              reminderDateTime < reminderWindowEnd
            ) {
              const user = await User.findById(booking.userId).select('name email')

              if (!user?.email) continue

              await sendEmail({
                to: user.email,
                subject: '[StudioLens] Nhắc lịch chụp ảnh sắp tới',
                html: getBookingReminderTemplate({
                  customerName: user.name,
                  serviceName: booking.serviceName || '',
                  conceptName: booking.conceptName || '',
                  date: booking.date,
                  time: `${getSessionLabel(booking.session)}${booking.time ? ` (${booking.time})` : ''}`,
                  bookingCode: booking.bookingCode || booking._id,
                }),
              })

              await createNotification({
                userId: booking.userId,
                title: 'Nhắc lịch chụp sắp tới',
                message: `Bạn có lịch chụp cho booking ${booking.bookingCode || booking._id} vào ${booking.date} - ${getSessionLabel(booking.session)}.`,
                type: 'booking_reminder',
                category: 'booking',
                priority: 'high',
                senderRole: 'system',
                link: '/my-bookings',
                meta: {
                  bookingId: booking._id,
                  bookingCode: booking.bookingCode || booking._id,
                  date: booking.date,
                  session: booking.session,
                  time: booking.time || '',
                  reminderBasis: 'before_one_session',
                },
              })

              booking.reminderSent = true
              booking.reminderSentAt = new Date()
              booking.reminderEmailError = ''
              await booking.save()

              console.log(
                `Reminder sent for booking ${booking.bookingCode || booking._id}`
              )
            }
          } catch (innerError) {
            console.error('Reminder item error:', innerError)
            booking.reminderEmailError =
              innerError.message || 'Unknown reminder mail error'
            await booking.save()
          }
        }
      } catch (error) {
        console.error('Booking reminder cron error:', error)
      }
    },
    {
      timezone: TIMEZONE,
    }
  )
}