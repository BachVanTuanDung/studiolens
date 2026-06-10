import axiosClient from './axiosClient'

export const createBooking = (data) => axiosClient.post('/bookings', data)
export const getMyBookings = () => axiosClient.get('/bookings')
export const getAllBookings = () => axiosClient.get('/bookings')
export const getBookingById = (id) => axiosClient.get(`/bookings/${id}`)
export const updateBooking = (id, data) => axiosClient.put(`/bookings/${id}`, data)
export const deleteBooking = (id) => axiosClient.delete(`/bookings/${id}`)
export const getBookedSlotsByDate = (date) => axiosClient.get(`/bookings/slots/${date}`)
export const getMonthlyAvailability = (month) =>
  axiosClient.get(`/bookings/availability?month=${month}`)

export const confirmPayment = (id) => axiosClient.patch(`/bookings/${id}/confirm-payment`)

export const markBookingAsUnpaid = (id) =>
  axiosClient.put(`/bookings/${id}`, { paymentStatus: 'unpaid' })

export const verifyPayOSPayment = (orderCode) =>
  axiosClient.get(`/bookings/verify-payos-payment?orderCode=${orderCode}`)

// ===== API MỚI CHO LUỒNG YÊU CẦU DỜI LỊCH =====

// 1. User: Gửi yêu cầu xin đổi ngày/giờ
export const requestEditBooking = (id, data) => 
  axiosClient.patch(`/bookings/${id}/request-edit`, data)

// 2. Admin: Duyệt yêu cầu đổi lịch
export const approveEditBooking = (id) => 
  axiosClient.patch(`/bookings/${id}/approve-edit`)

// 3. Admin: Từ chối yêu cầu đổi lịch
export const rejectEditBooking = (id) => 
  axiosClient.patch(`/bookings/${id}/reject-edit`)

export const requestCancelBooking = (id, data) => 
  axiosClient.patch(`/bookings/${id}/request-cancel`, data)