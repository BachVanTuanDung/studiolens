import Notification from '../models/Notification.js'

export const createNotification = async ({
  userId,
  title,
  message,
  type = 'general',
  category = 'general',
  priority = 'normal',
  senderRole = 'system',
  link = '',
  meta = {},
}) => {
  if (!userId || !title || !message) return null

  return Notification.create({
    userId,
    title,
    message,
    type,
    category,
    priority,
    senderRole,
    link,
    meta,
  })
}