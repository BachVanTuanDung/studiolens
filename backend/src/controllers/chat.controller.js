import Conversation from '../models/Conversation.js'
import Message from '../models/Message.js'
import Booking from '../models/Booking.js'

const USER_POPULATE = 'name email avatar role'
const MESSAGE_POPULATE = 'name email avatar role'

const AUTO_REPLY_TEXT =
  'StudioLens đã nhận được tin nhắn của bạn. Admin sẽ phản hồi sớm nhất nếu bạn cần hỗ trợ thêm.'

const AUTO_REPLY_COOLDOWN_MS = 10 * 60 * 1000

const SESSION_LABEL_MAP = {
  morning: 'Buổi sáng',
  afternoon: 'Buổi chiều',
  evening: 'Buổi tối',
}

const ensureUserConversation = async (userId) => {
  let conversation = await Conversation.findOne({ userId })

  if (!conversation) {
    conversation = await Conversation.create({
      userId,
      status: 'open',
      lastMessage: '',
      lastMessageAt: new Date(),
      unreadCountUser: 0,
      unreadCountAdmin: 0,
      adminLastSeenAt: null,
    })
  }

  return conversation
}

const getLatestBookingSummaryByUserId = async (userId) => {
  const latestBooking = await Booking.findOne({ userId })
    .populate('serviceId', 'name')
    .sort({ createdAt: -1 })

  if (!latestBooking) return null

  return {
    bookingId: latestBooking._id,
    bookingCode: latestBooking.bookingCode || '--',
    date: latestBooking.date || '--',
    session: latestBooking.session || '--',
    sessionLabel: SESSION_LABEL_MAP[latestBooking.session] || latestBooking.session || '--',
    serviceName: latestBooking.serviceName || latestBooking.serviceId?.name || '--',
    status: latestBooking.status || '--',
    paymentStatus: latestBooking.paymentStatus || '--',
  }
}

const attachBookingSummaryToConversation = async (conversationDoc) => {
  if (!conversationDoc) return null

  const plainConversation =
    typeof conversationDoc.toObject === 'function'
      ? conversationDoc.toObject()
      : { ...conversationDoc }

  const userId =
    typeof plainConversation.userId === 'object'
      ? plainConversation.userId?._id
      : plainConversation.userId

  if (!userId) {
    plainConversation.bookingSummary = null
    return plainConversation
  }

  plainConversation.bookingSummary = await getLatestBookingSummaryByUserId(userId)
  return plainConversation
}

const attachBookingSummaryToConversationList = async (conversationDocs = []) => {
  const results = await Promise.all(
    conversationDocs.map((conversation) => attachBookingSummaryToConversation(conversation))
  )
  return results
}

const emitConversationUpdate = async (req, conversationId) => {
  const io = req.app.get('io')
  if (!io) return

  const conversation = await Conversation.findById(conversationId)
    .populate('userId', USER_POPULATE)
    .populate('assignedAdminId', USER_POPULATE)

  if (!conversation) return

  const enrichedConversation = await attachBookingSummaryToConversation(conversation)

  io.to('admins').emit('conversation_updated', enrichedConversation)

  const conversationUserId =
    typeof enrichedConversation.userId === 'object'
      ? enrichedConversation.userId?._id
      : enrichedConversation.userId

  io.to(`user_${conversationUserId}`).emit('conversation_updated', enrichedConversation)

  const conversations = await Conversation.find({}, 'unreadCountAdmin')
  const totalUnreadAdmin = conversations.reduce(
    (sum, item) => sum + (item.unreadCountAdmin || 0),
    0
  )

  io.to('admins').emit('admin_unread_refresh', {
    totalUnreadAdmin,
  })
}

const emitMessageCreated = (req, conversationId, message) => {
  const io = req.app.get('io')
  if (!io) return
  io.to(`conversation_${conversationId}`).emit('message_created', message)
}

const emitMessagesRead = (req, conversationId, messageIds, readAt) => {
  const io = req.app.get('io')
  if (!io || !messageIds?.length) return

  io.to(`conversation_${conversationId}`).emit('messages_read', {
    conversationId: String(conversationId),
    messageIds: messageIds.map(String),
    readAt,
  })
}

const shouldSendAutoReply = async (conversationId) => {
  const lastNonSystemMessage = await Message.findOne({
    conversationId,
    senderRole: { $in: ['user', 'admin'] },
  }).sort({ createdAt: -1 })

  if (!lastNonSystemMessage) {
    return true
  }

  const now = Date.now()
  const lastMessageTime = new Date(lastNonSystemMessage.createdAt).getTime()

  return now - lastMessageTime >= AUTO_REPLY_COOLDOWN_MS
}

export const getMyConversation = async (req, res) => {
  try {
    const conversation = await ensureUserConversation(req.user._id)

    const populatedConversation = await Conversation.findById(conversation._id)
      .populate('userId', USER_POPULATE)
      .populate('assignedAdminId', USER_POPULATE)

    const enrichedConversation = await attachBookingSummaryToConversation(populatedConversation)

    return res.json({
      success: true,
      data: enrichedConversation,
    })
  } catch (error) {
    console.error('getMyConversation error:', error)
    return res.status(500).json({
      success: false,
      message: 'Không thể lấy cuộc trò chuyện của bạn',
    })
  }
}

export const getMyMessages = async (req, res) => {
  try {
    const conversation = await ensureUserConversation(req.user._id)

    const messages = await Message.find({
      conversationId: conversation._id,
    })
      .populate('senderId', MESSAGE_POPULATE)
      .sort({ createdAt: 1 })

    const unreadAdminMessages = messages.filter(
      (msg) => msg.senderRole === 'admin' && !msg.isRead
    )

    const readAt = new Date()

    if (unreadAdminMessages.length > 0) {
      const unreadIds = unreadAdminMessages.map((msg) => msg._id)

      await Message.updateMany(
        {
          _id: { $in: unreadIds },
        },
        { $set: { isRead: true, readAt } }
      )

      emitMessagesRead(req, conversation._id, unreadIds, readAt)
    }

    await Message.updateMany(
      {
        conversationId: conversation._id,
        senderRole: 'system',
        isRead: false,
      },
      { $set: { isRead: true, readAt } }
    )

    conversation.unreadCountUser = 0
    await conversation.save()
    await emitConversationUpdate(req, conversation._id)

    const refreshedMessages = await Message.find({
      conversationId: conversation._id,
    })
      .populate('senderId', MESSAGE_POPULATE)
      .sort({ createdAt: 1 })

    return res.json({
      success: true,
      conversation,
      data: refreshedMessages,
    })
  } catch (error) {
    console.error('getMyMessages error:', error)
    return res.status(500).json({
      success: false,
      message: 'Không thể lấy tin nhắn của bạn',
    })
  }
}

export const sendMyMessage = async (req, res) => {
  try {
    const {
      content = '',
      messageType = 'text',
      mediaUrl = '',
      mediaPublicId = '',
      mediaType = '',
      fileName = '',
      mimeType = '',
      fileSize = 0,
    } = req.body

    if (!String(content).trim() && !mediaUrl) {
      return res.status(400).json({
        success: false,
        message: 'Tin nhắn không được để trống',
      })
    }

    const conversation = await ensureUserConversation(req.user._id)

    const message = await Message.create({
      conversationId: conversation._id,
      senderId: req.user._id,
      senderRole: 'user',
      content: String(content).trim(),
      messageType,
      mediaUrl,
      mediaPublicId,
      mediaType,
      fileName,
      mimeType,
      fileSize,
      isRead: false,
    })

    conversation.lastMessage =
      String(content).trim() ||
      (messageType === 'image'
        ? 'Đã gửi 1 hình ảnh'
        : messageType === 'video'
          ? 'Đã gửi 1 video'
          : messageType === 'file'
            ? `Đã gửi file ${fileName || ''}`.trim()
            : 'Tin nhắn mới')
    conversation.lastMessageAt = new Date()
    conversation.unreadCountAdmin += 1
    await conversation.save()

    const populatedMessage = await Message.findById(message._id).populate(
      'senderId',
      MESSAGE_POPULATE
    )

    emitMessageCreated(req, conversation._id, populatedMessage)
    await emitConversationUpdate(req, conversation._id)

    const adminRecentlyActive =
      conversation.adminLastSeenAt &&
      Date.now() - new Date(conversation.adminLastSeenAt).getTime() < 2 * 60 * 1000

    let populatedAutoReply = null

    if (!adminRecentlyActive) {
      const canAutoReply = await shouldSendAutoReply(conversation._id)

      if (canAutoReply) {
        const autoReply = await Message.create({
          conversationId: conversation._id,
          senderRole: 'system',
          messageType: 'auto_reply',
          content: AUTO_REPLY_TEXT,
          isRead: false,
        })

        conversation.lastMessage = AUTO_REPLY_TEXT
        conversation.lastMessageAt = new Date()
        conversation.unreadCountUser += 1
        await conversation.save()

        populatedAutoReply = await Message.findById(autoReply._id)

        emitMessageCreated(req, conversation._id, populatedAutoReply)
        await emitConversationUpdate(req, conversation._id)
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Gửi tin nhắn thành công',
      data: {
        userMessage: populatedMessage,
        autoReply: populatedAutoReply,
      },
    })
  } catch (error) {
    console.error('sendMyMessage error:', error)
    return res.status(500).json({
      success: false,
      message: 'Không thể gửi tin nhắn',
    })
  }
}

export const getAdminConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find()
      .populate('userId', USER_POPULATE)
      .populate('assignedAdminId', USER_POPULATE)
      .sort({ lastMessageAt: -1 })

    const enrichedConversations = await attachBookingSummaryToConversationList(conversations)

    return res.json({
      success: true,
      data: enrichedConversations,
    })
  } catch (error) {
    console.error('getAdminConversations error:', error)
    return res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách hội thoại',
    })
  }
}

export const getAdminMessagesByConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id)

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hội thoại',
      })
    }

    const messages = await Message.find({
      conversationId: conversation._id,
    })
      .populate('senderId', MESSAGE_POPULATE)
      .sort({ createdAt: 1 })

    const unreadUserMessages = messages.filter(
      (msg) => msg.senderRole === 'user' && !msg.isRead
    )

    const readAt = new Date()

    if (unreadUserMessages.length > 0) {
      const unreadIds = unreadUserMessages.map((msg) => msg._id)

      await Message.updateMany(
        {
          _id: { $in: unreadIds },
        },
        { $set: { isRead: true, readAt } }
      )

      emitMessagesRead(req, conversation._id, unreadIds, readAt)
    }

    conversation.unreadCountAdmin = 0
    conversation.adminLastSeenAt = new Date()

    if (!conversation.assignedAdminId) {
      conversation.assignedAdminId = req.user._id
    }

    await conversation.save()
    await emitConversationUpdate(req, conversation._id)

    const refreshedMessages = await Message.find({
      conversationId: conversation._id,
    })
      .populate('senderId', MESSAGE_POPULATE)
      .sort({ createdAt: 1 })

    return res.json({
      success: true,
      conversation,
      data: refreshedMessages,
    })
  } catch (error) {
    console.error('getAdminMessagesByConversation error:', error)
    return res.status(500).json({
      success: false,
      message: 'Không thể lấy tin nhắn hội thoại',
    })
  }
}

export const sendAdminMessage = async (req, res) => {
  try {
    const {
      content = '',
      messageType = 'text',
      mediaUrl = '',
      mediaPublicId = '',
      mediaType = '',
      fileName = '',
      mimeType = '',
      fileSize = 0,
    } = req.body

    if (!String(content).trim() && !mediaUrl) {
      return res.status(400).json({
        success: false,
        message: 'Tin nhắn không được để trống',
      })
    }

    const conversation = await Conversation.findById(req.params.id)

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hội thoại',
      })
    }

    const message = await Message.create({
      conversationId: conversation._id,
      senderId: req.user._id,
      senderRole: 'admin',
      content: String(content).trim(),
      messageType,
      mediaUrl,
      mediaPublicId,
      mediaType,
      fileName,
      mimeType,
      fileSize,
      isRead: false,
    })

    conversation.lastMessage =
      String(content).trim() ||
      (messageType === 'image'
        ? 'Admin đã gửi 1 hình ảnh'
        : messageType === 'video'
          ? 'Admin đã gửi 1 video'
          : messageType === 'file'
            ? `Admin đã gửi file ${fileName || ''}`.trim()
            : 'Tin nhắn mới từ admin')
    conversation.lastMessageAt = new Date()
    conversation.unreadCountUser += 1
    conversation.adminLastSeenAt = new Date()

    if (!conversation.assignedAdminId) {
      conversation.assignedAdminId = req.user._id
    }

    await conversation.save()

    const populatedMessage = await Message.findById(message._id).populate(
      'senderId',
      MESSAGE_POPULATE
    )

    emitMessageCreated(req, conversation._id, populatedMessage)
    await emitConversationUpdate(req, conversation._id)

    return res.status(201).json({
      success: true,
      message: 'Admin đã gửi tin nhắn',
      data: populatedMessage,
    })
  } catch (error) {
    console.error('sendAdminMessage error:', error)
    return res.status(500).json({
      success: false,
      message: 'Không thể gửi tin nhắn admin',
    })
  }
}

export const markConversationClosed = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id)

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hội thoại',
      })
    }

    conversation.status = conversation.status === 'open' ? 'closed' : 'open'
    await conversation.save()
    await emitConversationUpdate(req, conversation._id)

    const enrichedConversation = await attachBookingSummaryToConversation(conversation)

    return res.json({
      success: true,
      message: 'Cập nhật trạng thái hội thoại thành công',
      data: enrichedConversation,
    })
  } catch (error) {
    console.error('markConversationClosed error:', error)
    return res.status(500).json({
      success: false,
      message: 'Không thể cập nhật trạng thái hội thoại',
    })
  }
}