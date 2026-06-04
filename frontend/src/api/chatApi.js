import axiosClient from './axiosClient'

export const getMyConversation = () => axiosClient.get('/chat/my-conversation')
export const getMyMessages = () => axiosClient.get('/chat/my-messages')
export const sendMyMessage = (data) => axiosClient.post('/chat/my-messages', data)

export const getAdminConversations = () => axiosClient.get('/chat/admin/conversations')
export const getAdminMessagesByConversation = (conversationId) =>
  axiosClient.get(`/chat/admin/conversations/${conversationId}/messages`)
export const sendAdminMessage = (conversationId, data) =>
  axiosClient.post(`/chat/admin/conversations/${conversationId}/messages`, data)
export const toggleConversationStatus = (conversationId) =>
  axiosClient.patch(`/chat/admin/conversations/${conversationId}/toggle-status`)