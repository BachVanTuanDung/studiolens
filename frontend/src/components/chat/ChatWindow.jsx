import { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import MessageBubble from './MessageBubble'
import { getMyConversation, getMyMessages, sendMyMessage } from '../../api/chatApi'
import imageCompression from 'browser-image-compression'
import { getSocket } from '../../lib/socket'

const CLOUD_NAME = 'dzhjqp5hh'
const UPLOAD_PRESET = 'anh_test'

const ChatWindow = ({ user, onClose, expanded, onToggleExpand }) => {
  const [messages, setMessages] = useState([])
  const [conversation, setConversation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [content, setContent] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)

  const fileInputRef = useRef(null)
  const scrollRef = useRef(null)
  const shouldStickToBottomRef = useRef(true)

  const isNearBottom = () => {
    const el = scrollRef.current
    if (!el) return true
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight
    return distance < 120
  }

  const scrollToBottom = (behavior = 'smooth') => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({
      top: el.scrollHeight,
      behavior,
    })
  }

  const handleScroll = () => {
    shouldStickToBottomRef.current = isNearBottom()
  }

  const bootstrapChat = async () => {
    try {
      setLoading(true)
      const [conversationRes, messageRes] = await Promise.all([
        getMyConversation(),
        getMyMessages(),
      ])

      const nextConversation = conversationRes.data?.data || null
      const nextMessages = messageRes.data?.data || []

      setConversation(nextConversation)
      setMessages(nextMessages)

      requestAnimationFrame(() => {
        scrollToBottom('auto')
      })
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) return
    bootstrapChat()
  }, [user])

  useEffect(() => {
    if (!conversation?._id) return

    const socket = getSocket()
    if (!socket) return

    socket.emit('join_conversation', conversation._id)

    const onMessageCreated = (message) => {
      if (String(message.conversationId) !== String(conversation._id)) return

      const wasNearBottom = isNearBottom()

      setMessages((prev) => {
        const exists = prev.some((item) => item._id === message._id)
        if (exists) return prev
        return [...prev, message]
      })

      requestAnimationFrame(() => {
        if (wasNearBottom || shouldStickToBottomRef.current) {
          scrollToBottom('smooth')
        }
      })
    }

    const onConversationUpdated = (nextConversation) => {
      if (String(nextConversation._id) === String(conversation._id)) {
        setConversation(nextConversation)
      }
    }

    const onMessagesRead = ({ conversationId, messageIds, readAt }) => {
      if (String(conversationId) !== String(conversation._id)) return

      setMessages((prev) =>
        prev.map((msg) =>
          messageIds.includes(String(msg._id))
            ? { ...msg, isRead: true, readAt }
            : msg
        )
      )
    }

    socket.on('message_created', onMessageCreated)
    socket.on('conversation_updated', onConversationUpdated)
    socket.on('messages_read', onMessagesRead)

    return () => {
      socket.emit('leave_conversation', conversation._id)
      socket.off('message_created', onMessageCreated)
      socket.off('conversation_updated', onConversationUpdated)
      socket.off('messages_read', onMessagesRead)
    }
  }, [conversation?._id])

  const uploadToCloudinary = async (file) => {
    let finalFile = file

    if (file.type.startsWith('image/')) {
      try {
        const compressed = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1600,
          useWebWorker: true,
        })

        finalFile = new File([compressed], file.name, {
          type: compressed.type,
        })
      } catch (error) {
        console.error('Compress chat image error:', error)
      }
    }

    const formData = new FormData()
    formData.append('file', finalFile)
    formData.append('upload_preset', UPLOAD_PRESET)
    formData.append('folder', 'studiolens/chat')

    let resourceType = 'raw'
    let messageType = 'file'
    let mediaType = 'file'

    if (file.type.startsWith('image/')) {
      resourceType = 'image'
      messageType = 'image'
      mediaType = 'image'
    } else if (file.type.startsWith('video/')) {
      resourceType = 'video'
      messageType = 'video'
      mediaType = 'video'
    }

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
      {
        method: 'POST',
        body: formData,
      }
    )

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data?.error?.message || 'Upload file chat thất bại')
    }

    return {
      url: data.secure_url,
      publicId: data.public_id,
      mediaType,
      messageType,
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
    }
  }

  const handleSend = async () => {
    try {
      if (!content.trim() && !selectedFile) {
        toast.error('Vui lòng nhập tin nhắn hoặc chọn file')
        return
      }

      setSending(true)

      let payload = {
        content: content.trim(),
        messageType: 'text',
        mediaUrl: '',
        mediaPublicId: '',
        mediaType: '',
        fileName: '',
        mimeType: '',
        fileSize: 0,
      }

      if (selectedFile) {
        const uploaded = await uploadToCloudinary(selectedFile)

        payload = {
          ...payload,
          messageType: uploaded.messageType,
          mediaUrl: uploaded.url,
          mediaPublicId: uploaded.publicId,
          mediaType: uploaded.mediaType,
          fileName: uploaded.fileName || '',
          mimeType: uploaded.mimeType || '',
          fileSize: uploaded.fileSize || 0,
        }
      }

      await sendMyMessage(payload)

      setContent('')
      setSelectedFile(null)

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      shouldStickToBottomRef.current = true
    } catch (error) {
      console.error(error)
      toast.error(error?.response?.data?.message || error.message || 'Không thể gửi tin nhắn')
    } finally {
      setSending(false)
    }
  }

  const selectedFileLabel = useMemo(() => {
    if (!selectedFile) return ''
    return selectedFile.name
  }, [selectedFile])

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-[30px] border border-black/5 bg-white/95 shadow-[0_24px_70px_rgba(15,23,42,0.18)] backdrop-blur-xl transition-all duration-300 dark:border-white/10 dark:bg-[#0f1117]/95 ${
        expanded
          ? 'h-[820px] w-[680px] max-w-[calc(100vw-24px)]'
          : 'h-[650px] w-[390px] max-w-[calc(100vw-24px)]'
      }`}
    >
      <div className="flex items-center justify-between border-b border-neutral-200 bg-[linear-gradient(135deg,#111111,#2a210d,#C9A84C)] px-5 py-4 text-white dark:border-white/10">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12 text-lg font-bold backdrop-blur-sm">
            S
          </div>

          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.28em] text-white/75">
              Studio support
            </p>
            <h3 className="mt-1 truncate text-lg font-semibold">Chat với StudioLens</h3>
            <p className="text-xs text-white/80">Phản hồi nhanh và hỗ trợ trực tiếp</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleExpand}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-sm transition hover:scale-105 hover:bg-white/15"
            title={expanded ? 'Thu nhỏ' : 'Phóng to'}
          >
            {expanded ? '🗕' : '🗖'}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-lg transition hover:scale-105 hover:bg-white/15"
          >
            ✕
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 space-y-4 overflow-y-auto bg-[radial-gradient(circle_at_top,#fff6dd,transparent_18%),linear-gradient(to_bottom,#fafbfc,#f3f4f6)] px-4 py-5 dark:bg-[radial-gradient(circle_at_top,rgba(201,168,76,0.08),transparent_18%),linear-gradient(to_bottom,#0b0d12,#10131a)]"
      >
        {loading ? (
          <div className="py-10 text-center text-sm text-neutral-500 dark:text-neutral-400">
            Đang tải tin nhắn...
          </div>
        ) : messages.length === 0 ? (
          <div className="py-10 text-center text-sm text-neutral-500 dark:text-neutral-400">
            Chưa có tin nhắn nào
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message._id} message={message} viewerRole="user" />
          ))
        )}
      </div>

      <div className="border-t border-neutral-200 bg-white/90 p-4 backdrop-blur-sm dark:border-white/10 dark:bg-[#0f1117]/90">
        {selectedFile ? (
          <div className="mb-3 rounded-2xl bg-neutral-50 px-4 py-3 text-xs text-neutral-600 shadow-sm dark:bg-neutral-950 dark:text-neutral-300">
            <div className="flex items-center justify-between gap-3">
              <span className="truncate">Đã chọn: {selectedFileLabel}</span>
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null)
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
                className="text-red-500"
              >
                Xóa
              </button>
            </div>
          </div>
        ) : null}

        <div className="flex items-end gap-2 rounded-[28px] border border-neutral-200 bg-neutral-50 p-3 shadow-inner dark:border-neutral-700 dark:bg-neutral-950">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-lg transition hover:scale-105 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800"
            title="Chọn ảnh, video hoặc file"
          >
            ＋
          </button>

          <input
            ref={fileInputRef}
            type="file"
            hidden
            accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.txt"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) setSelectedFile(file)
            }}
          />

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Nhập tin nhắn cho studio..."
            className="max-h-32 min-h-[52px] flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-neutral-400 dark:text-white"
          />

          <button
            type="button"
            onClick={handleSend}
            disabled={sending}
            className="flex h-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#E8C96A,#C9A84C)] px-5 text-sm font-semibold text-black shadow-[0_8px_20px_rgba(201,168,76,0.28)] transition hover:scale-[1.02] hover:opacity-95 disabled:opacity-60"
          >
            {sending ? '...' : 'Gửi'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatWindow