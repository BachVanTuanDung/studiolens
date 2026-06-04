import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getMyConversation, getAdminConversations } from '../api/chatApi'
import { getSocket } from '../lib/socket'

const useChatUnreadBadge = () => {
  const { user } = useAuth()
  const [userUnreadCount, setUserUnreadCount] = useState(0)
  const [adminUnreadCount, setAdminUnreadCount] = useState(0)

  useEffect(() => {
    if (!user) return

    const bootstrap = async () => {
      try {
        if (user.role === 'user') {
          const res = await getMyConversation()
          const conversation = res.data?.data || null
          setUserUnreadCount(conversation?.unreadCountUser || 0)
        }

        if (user.role === 'admin') {
          const res = await getAdminConversations()
          const conversations = res.data?.data || []
          const totalUnread = conversations.reduce(
            (sum, item) => sum + (item.unreadCountAdmin || 0),
            0
          )
          setAdminUnreadCount(totalUnread)
        }
      } catch (error) {
        console.error('bootstrap chat unread error:', error)
      }
    }

    bootstrap()

    const socket = getSocket()
    if (!socket) return

    const onConversationUpdated = (conversation) => {
      if (user.role === 'user') {
        const conversationUserId =
          typeof conversation.userId === 'object'
            ? conversation.userId?._id
            : conversation.userId

        if (String(conversationUserId) === String(user._id)) {
          setUserUnreadCount(conversation.unreadCountUser || 0)
        }
      }
    }

    const onAdminUnreadRefresh = (payload) => {
      if (user.role === 'admin') {
        setAdminUnreadCount(payload?.totalUnreadAdmin || 0)
      }
    }

    socket.on('conversation_updated', onConversationUpdated)
    socket.on('admin_unread_refresh', onAdminUnreadRefresh)

    if (user.role === 'admin') {
      socket.emit('admin_request_unread_refresh')
    }

    return () => {
      socket.off('conversation_updated', onConversationUpdated)
      socket.off('admin_unread_refresh', onAdminUnreadRefresh)
    }
  }, [user])

  return useMemo(
    () => ({
      userUnreadCount,
      adminUnreadCount,
    }),
    [userUnreadCount, adminUnreadCount]
  )
}

export default useChatUnreadBadge