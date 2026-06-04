import api from './axiosClient'

const notificationApi = {
  getMyNotifications: () => api.get('/notifications/my'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
}

export default notificationApi