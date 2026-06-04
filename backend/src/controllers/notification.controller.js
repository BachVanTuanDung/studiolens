import Notification from '../models/Notification.js'

export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      userId: req.user._id,
    }).sort({ createdAt: -1 })

    const unreadCount = notifications.filter((item) => !item.isRead).length

    return res.json({
      success: true,
      data: notifications,
      unreadCount,
    })
  } catch (error) {
    console.error('getMyNotifications error:', error)
    return res.status(500).json({
      success: false,
      message: 'Không thể lấy thông báo',
    })
  }
}

export const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user._id,
    })

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông báo',
      })
    }

    notification.isRead = true
    await notification.save()

    return res.json({
      success: true,
      message: 'Đã đánh dấu đã đọc',
      data: notification,
    })
  } catch (error) {
    console.error('markNotificationAsRead error:', error)
    return res.status(500).json({
      success: false,
      message: 'Không thể cập nhật thông báo',
    })
  }
}

export const markAllNotificationsAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { $set: { isRead: true } }
    )

    return res.json({
      success: true,
      message: 'Đã đánh dấu tất cả là đã đọc',
    })
  } catch (error) {
    console.error('markAllNotificationsAsRead error:', error)
    return res.status(500).json({
      success: false,
      message: 'Không thể cập nhật thông báo',
    })
  }
}