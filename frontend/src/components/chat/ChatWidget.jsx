import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import ChatWindow from './ChatWindow'
import { getMyConversation } from '../../api/chatApi'
import { getSocket } from '../../lib/socket'
import { useChatWidget } from '../../context/ChatWidgetContext'

const ChatWidget = () => {
  const { user } = useAuth()
  const { isChatOpen, isChatExpanded, openChat, closeChat, toggleExpandChat } =
    useChatWidget()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!user || user.role !== 'user') return

    const fetchUnread = async () => {
      try {
        const res = await getMyConversation()
        const conversation = res.data?.data || null
        setUnreadCount(conversation?.unreadCountUser || 0)
      } catch (error) {
        console.error(error)
      }
    }

    fetchUnread()

    const socket = getSocket()
    if (!socket) return

    const onConversationUpdated = (conversation) => {
      const conversationUserId =
        typeof conversation.userId === 'object'
          ? conversation.userId?._id
          : conversation.userId

      if (String(conversationUserId) === String(user._id)) {
        setUnreadCount(conversation.unreadCountUser || 0)
      }
    }

    socket.on('conversation_updated', onConversationUpdated)

    return () => {
      socket.off('conversation_updated', onConversationUpdated)
    }
  }, [user])

  if (!user || user.role !== 'user') return null

  return (
    <div className="fixed bottom-5 right-5 z-[70]">
      {isChatOpen ? (
        <ChatWindow
          user={user}
          expanded={isChatExpanded}
          onToggleExpand={toggleExpandChat}
          onClose={closeChat}
        />
      ) : (
        <button
          type="button"
          onClick={openChat}
          className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[linear-gradient(135deg,#111111,#2a210d,#C9A84C)] text-2xl text-white shadow-[0_15px_40px_rgba(0,0,0,0.25)] transition duration-300 hover:scale-105 dark:bg-[linear-gradient(135deg,#C9A84C,#E8C96A)] dark:text-black"
          title="Chat với StudioLens"
        >
          💬

          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex min-h-[24px] min-w-[24px] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      )}
    </div>
  )
}

export default ChatWidget