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