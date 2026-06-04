import axiosClient from './axiosClient'

export const getDashboardStats = () => axiosClient.get('/dashboard/stats')
export const getBookingsChart = () => axiosClient.get('/dashboard/charts/bookings')
export const getRevenueChart = () => axiosClient.get('/dashboard/charts/revenue')
export const getBookingStatusChart = () => axiosClient.get('/dashboard/charts/status')
export const getPaymentMethodChart = () =>
  axiosClient.get('/dashboard/charts/payment-methods')
export const getSessionChart = () => axiosClient.get('/dashboard/charts/sessions')
export const getTopServices = () => axiosClient.get('/dashboard/top-services')
export const getRecentUsers = () => axiosClient.get('/dashboard/recent-users')