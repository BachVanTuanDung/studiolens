import User from '../models/User.js'
import Booking from '../models/Booking.js'
import Service from '../models/Service.js'
import Gallery from '../models/Gallery.js'
import SelectedImages from '../models/SelectedImages.js'

const MONTH_LABELS = [
  'Th1',
  'Th2',
  'Th3',
  'Th4',
  'Th5',
  'Th6',
  'Th7',
  'Th8',
  'Th9',
  'Th10',
  'Th11',
  'Th12',
]

const createEmptyMonthMap = () => ({
  1: 0,
  2: 0,
  3: 0,
  4: 0,
  5: 0,
  6: 0,
  7: 0,
  8: 0,
  9: 0,
  10: 0,
  11: 0,
  12: 0,
})

const getDateParts = (dateString) => {
  if (!dateString || typeof dateString !== 'string') return null

  const parts = dateString.split('-')
  if (parts.length !== 3) return null

  const year = Number(parts[0])
  const month = Number(parts[1])
  const day = Number(parts[2])

  if (!year || month < 1 || month > 12 || day < 1 || day > 31) return null

  return { year, month, day }
}

const getNowInfo = () => {
  const now = new Date()
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  }
}

const buildMonthlyDataset = (items, valueGetter) => {
  const { year: currentYear } = getNowInfo()
  const monthMap = createEmptyMonthMap()

  items.forEach((item) => {
    const parts = getDateParts(item.date)
    if (!parts || parts.year !== currentYear) return
    monthMap[parts.month] += Number(valueGetter(item) || 0)
  })

  return MONTH_LABELS.map((label, index) => ({
    label,
    value: monthMap[index + 1],
  }))
}

export const getDashboardStats = async (req, res) => {
  try {
    const { year: currentYear, month: currentMonth } = getNowInfo()

    const [
      totalUsers,
      totalBookings,
      totalServices,
      totalGalleries,
      totalSelections,
      allBookings,
      recentBookings,
      recentUsers,
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Booking.countDocuments(),
      Service.countDocuments({ isActive: true }),
      Gallery.countDocuments(),
      SelectedImages.countDocuments(),
      Booking.find()
        .select('date status totalPrice paymentStatus paymentMethod session')
        .lean(),
      Booking.find()
        .populate('userId', 'name email phone')
        .populate('serviceId', 'name')
        .populate('conceptId', 'name')
        .sort({ createdAt: -1 })
        .limit(6),
      User.find({ role: 'user' })
        .select('name email phone createdAt avatar')
        .sort({ createdAt: -1 })
        .limit(6),
    ])

    let totalRevenue = 0
    let bookingsThisMonth = 0
    let revenueThisMonth = 0
    let totalPaidBookings = 0
    let totalCompletedBookings = 0
    let totalConfirmedBookings = 0
    let totalPendingBookings = 0
    let totalCancelledBookings = 0

    allBookings.forEach((booking) => {
      const price = Number(booking.totalPrice || 0)
      const parts = getDateParts(booking.date)

      if (booking.status === 'confirmed' || booking.status === 'completed') {
        totalRevenue += price
      }

      if (booking.paymentStatus === 'paid') totalPaidBookings += 1
      if (booking.status === 'completed') totalCompletedBookings += 1
      if (booking.status === 'confirmed') totalConfirmedBookings += 1
      if (booking.status === 'pending') totalPendingBookings += 1
      if (booking.status === 'cancelled') totalCancelledBookings += 1

      if (parts && parts.year === currentYear && parts.month === currentMonth) {
        bookingsThisMonth += 1
        if (booking.status === 'confirmed' || booking.status === 'completed') {
          revenueThisMonth += price
        }
      }
    })

    const paidRate = totalBookings > 0 ? Math.round((totalPaidBookings / totalBookings) * 100) : 0
    const completionRate =
      totalBookings > 0 ? Math.round((totalCompletedBookings / totalBookings) * 100) : 0

    return res.json({
      success: true,
      data: {
        totalUsers,
        totalBookings,
        totalServices,
        totalGalleries,
        totalSelections,
        totalRevenue,
        bookingsThisMonth,
        revenueThisMonth,
        totalPaidBookings,
        totalCompletedBookings,
        totalConfirmedBookings,
        totalPendingBookings,
        totalCancelledBookings,
        paidRate,
        completionRate,
        recentBookings,
        recentUsers,
      },
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

export const getBookingsChart = async (req, res) => {
  try {
    const bookings = await Booking.find({
      status: { $ne: 'cancelled' },
    })
      .select('date')
      .lean()

    const data = buildMonthlyDataset(bookings, () => 1).map((item) => ({
      label: item.label,
      totalBookings: item.value,
    }))

    return res.json({
      success: true,
      data,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

export const getRevenueChart = async (req, res) => {
  try {
    const bookings = await Booking.find({
      status: { $in: ['confirmed', 'completed'] },
    })
      .select('date totalPrice')
      .lean()

    const data = buildMonthlyDataset(bookings, (item) => item.totalPrice).map((item) => ({
      label: item.label,
      totalRevenue: item.value,
    }))

    return res.json({
      success: true,
      data,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

export const getBookingStatusChart = async (req, res) => {
  try {
    const bookings = await Booking.find().select('status').lean()

    const map = {
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
    }

    bookings.forEach((booking) => {
      if (map[booking.status] !== undefined) {
        map[booking.status] += 1
      }
    })

    return res.json({
      success: true,
      data: [
        { label: 'Chờ xác nhận', value: map.pending },
        { label: 'Đã xác nhận', value: map.confirmed },
        { label: 'Hoàn thành', value: map.completed },
        { label: 'Đã hủy', value: map.cancelled },
      ],
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

export const getPaymentMethodChart = async (req, res) => {
  try {
    const bookings = await Booking.find().select('paymentMethod').lean()

    const map = {
      cash: 0,
      bank_qr: 0,
    }

    bookings.forEach((booking) => {
      if (map[booking.paymentMethod] !== undefined) {
        map[booking.paymentMethod] += 1
      }
    })

    return res.json({
      success: true,
      data: [
        { label: 'Tiền mặt', value: map.cash },
        { label: 'Chuyển khoản/QR', value: map.bank_qr },
      ],
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

export const getSessionChart = async (req, res) => {
  try {
    const bookings = await Booking.find({
      status: { $ne: 'cancelled' },
    })
      .select('session')
      .lean()

    const map = {
      morning: 0,
      afternoon: 0,
      evening: 0,
    }

    bookings.forEach((booking) => {
      if (map[booking.session] !== undefined) {
        map[booking.session] += 1
      }
    })

    return res.json({
      success: true,
      data: [
        { label: 'Buổi sáng', value: map.morning },
        { label: 'Buổi chiều', value: map.afternoon },
        { label: 'Buổi tối', value: map.evening },
      ],
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

export const getTopServices = async (req, res) => {
  try {
    const result = await Booking.aggregate([
      {
        $match: {
          serviceId: { $ne: null },
          status: { $ne: 'cancelled' },
        },
      },
      {
        $group: {
          _id: '$serviceId',
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: '$totalPrice' },
        },
      },
      {
        $sort: { totalBookings: -1, totalRevenue: -1 },
      },
      {
        $limit: 5,
      },
      {
        $lookup: {
          from: 'services',
          localField: '_id',
          foreignField: '_id',
          as: 'service',
        },
      },
      {
        $unwind: {
          path: '$service',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          serviceName: { $ifNull: ['$service.name', 'Dịch vụ không xác định'] },
          totalBookings: 1,
          totalRevenue: 1,
        },
      },
    ])

    return res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

export const getRecentUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'user' })
      .select('name email phone avatar createdAt')
      .sort({ createdAt: -1 })
      .limit(6)

    return res.json({
      success: true,
      data: users,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}