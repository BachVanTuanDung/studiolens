import { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import {
  getAdminConversations,
  getAdminMessagesByConversation,
  sendAdminMessage,
} from '../../api/chatApi'
import MessageBubble from '../../components/chat/MessageBubble'
import imageCompression from 'browser-image-compression'
import { getSocket } from '../../lib/socket'

const CLOUD_NAME = 'dzhjqp5hh'
const UPLOAD_PRESET = 'anh_test'

const QUICK_REPLY_GROUPS = [
  {
    key: 'booking',
    label: 'Booking',
    replies: [
      'Chào {{customerName}}, booking {{bookingCode}} cho dịch vụ {{serviceName}} vào {{date}} - {{session}} đã được studio tiếp nhận.',
      'Chào {{customerName}}, booking {{bookingCode}} của bạn đã được xác nhận. Thời gian chụp: {{date}} - {{session}}.',
      'Chào {{customerName}}, studio đã ghi nhận yêu cầu liên quan đến booking {{bookingCode}}. Admin sẽ kiểm tra và phản hồi sớm nhất.',
      'Chào {{customerName}}, bạn vui lòng xác nhận lại lịch chụp {{date}} - {{session}} để studio sắp xếp tốt nhất.',
    ],
  },
  {
    key: 'payment',
    label: 'Thanh toán',
    replies: [
      'Chào {{customerName}}, bạn vui lòng hoàn tất thanh toán cho booking {{bookingCode}} để studio giữ lịch {{date}} - {{session}}.',
      'Chào {{customerName}}, studio đã ghi nhận yêu cầu thanh toán cho booking {{bookingCode}}. Hệ thống sẽ đối soát trong ít phút.',
      'Chào {{customerName}}, studio đã nhận được thanh toán của booking {{bookingCode}}. Cảm ơn bạn đã hoàn tất sớm.',
      'Chào {{customerName}}, nếu cần hỗ trợ thêm về thanh toán booking {{bookingCode}}, bạn cứ nhắn lại để admin hỗ trợ ngay.',
    ],
  },
  {
    key: 'gallery',
    label: 'Gallery',
    replies: [
      'Chào {{customerName}}, gallery của bạn đã được tạo. Bạn vui lòng vào mục Gallery để kiểm tra.',
      'Chào {{customerName}}, studio đã nhận được danh sách ảnh bạn chọn. Admin sẽ tiếp tục xử lý sớm nhất.',
      'Chào {{customerName}}, ảnh chỉnh sửa của bạn đã hoàn tất. Bạn vui lòng kiểm tra trong gallery.',
      'Chào {{customerName}}, nếu bạn muốn chỉnh thêm ảnh nào trong gallery, hãy nhắn lại mã ảnh để studio hỗ trợ nhanh hơn.',
    ],
  },
  {
    key: 'support',
    label: 'Hỗ trợ',
    replies: [
      'Studio đã nhận được thông tin của bạn. Admin sẽ phản hồi sớm nhất.',
      'Chào {{customerName}}, bạn vui lòng gửi thêm mã booking để admin kiểm tra nhanh hơn.',
      'Chào {{customerName}}, admin đã ghi nhận yêu cầu và sẽ cập nhật cho bạn trong ít phút.',
      'Chào {{customerName}}, nếu bạn cần hỗ trợ chi tiết hơn, vui lòng mô tả thêm để studio xử lý chính xác hơn.',
    ],
  },
]

const replaceTemplateVars = (template, conversation) => {
  const booking = conversation?.bookingSummary || {}
  const customerName = conversation?.userId?.name || 'bạn'
  const bookingCode = booking?.bookingCode || '--'
  const date = booking?.date || '--'
  const session = booking?.sessionLabel || booking?.session || '--'
  const serviceName = booking?.serviceName || '--'

  return template
    .replaceAll('{{customerName}}', customerName)
    .replaceAll('{{bookingCode}}', bookingCode)
    .replaceAll('{{date}}', date)
    .replaceAll('{{session}}', session)
    .replaceAll('{{serviceName}}', serviceName)
}

const AdminChatsPage = () => {
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [content, setContent] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [activeQuickReplyTab, setActiveQuickReplyTab] = useState('booking')

  const fileInputRef = useRef(null)
  const scrollRef = useRef(null)
  const shouldStickToBottomRef = useRef(true)

  const isNearBottom = () => {
    const el = scrollRef.current
    if (!el) return true
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight
    return distance < 140
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

  const fetchConversations = async () => {
    try {
      setLoading(true)
      const res = await getAdminConversations()
      const data = res.data?.data || []
      setConversations(data)

      if (selectedConversation?._id) {
        const updatedSelected = data.find((item) => item._id === selectedConversation._id)
        if (updatedSelected) setSelectedConversation(updatedSelected)
      }
    } catch (error) {
      console.error(error)
      toast.error('Không thể tải danh sách hội thoại')
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (conversationId, { forceScroll = false } = {}) => {
    try {
      setLoadingMessages(true)
      const res = await getAdminMessagesByConversation(conversationId)
      const nextMessages = res.data?.data || []

      setMessages(nextMessages)

      requestAnimationFrame(() => {
        if (forceScroll) {
          scrollToBottom('auto')
        }
      })
    } catch (error) {
      console.error(error)
      toast.error('Không thể tải tin nhắn hội thoại')
    } finally {
      setLoadingMessages(false)
    }
  }

  useEffect(() => {
    fetchConversations()
  }, [])

  useEffect(() => {
    if (selectedConversation?._id) {
      fetchMessages(selectedConversation._id, { forceScroll: true })
    }
  }, [selectedConversation?._id])

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const onConversationUpdated = (conversation) => {
      setConversations((prev) => {
        const exists = prev.some((item) => item._id === conversation._id)
        if (exists) {
          return prev
            .map((item) => (item._id === conversation._id ? conversation : item))
            .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt))
        }
        return [conversation, ...prev].sort(
          (a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
        )
      })

      if (selectedConversation?._id === conversation._id) {
        setSelectedConversation(conversation)
      }
    }

    socket.on('conversation_updated', onConversationUpdated)

    return () => {
      socket.off('conversation_updated', onConversationUpdated)
    }
  }, [selectedConversation?._id])

  useEffect(() => {
    if (!selectedConversation?._id) return

    const socket = getSocket()
    if (!socket) return

    socket.emit('join_conversation', selectedConversation._id)

    const onMessageCreated = (message) => {
      if (String(message.conversationId) !== String(selectedConversation._id)) return

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

    const onMessagesRead = ({ conversationId, messageIds, readAt }) => {
      if (String(conversationId) !== String(selectedConversation._id)) return

      setMessages((prev) =>
        prev.map((msg) =>
          messageIds.includes(String(msg._id))
            ? { ...msg, isRead: true, readAt }
            : msg
        )
      )
    }

    socket.on('message_created', onMessageCreated)
    socket.on('messages_read', onMessagesRead)

    return () => {
      socket.emit('leave_conversation', selectedConversation._id)
      socket.off('message_created', onMessageCreated)
      socket.off('messages_read', onMessagesRead)
    }
  }, [selectedConversation?._id])

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
        console.error('Compress admin chat image error:', error)
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

      if (!selectedConversation?._id) return

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

      await sendAdminMessage(selectedConversation._id, payload)

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

  const handleApplyQuickReply = (template) => {
    const resolved = replaceTemplateVars(template, selectedConversation)
    setContent(resolved)
  }

  const quickReplyTabs = QUICK_REPLY_GROUPS.map((group) => ({
    key: group.key,
    label: group.label,
  }))

  const activeReplies =
    QUICK_REPLY_GROUPS.find((group) => group.key === activeQuickReplyTab)?.replies || []

  const selectedFileLabel = useMemo(() => {
    if (!selectedFile) return ''
    return selectedFile.name
  }, [selectedFile])

  const selectedConversationBookingSummary = selectedConversation?.bookingSummary || null

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 dark:text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-yellow-700 dark:text-yellow-400">
            Chat hỗ trợ
          </p>
          <h1 className="mt-3 text-5xl font-bold tracking-tight">
            Quản lý hội thoại khách hàng
          </h1>
          <p className="mt-3 max-w-3xl text-neutral-600 dark:text-neutral-300">
            Theo dõi cuộc trò chuyện giữa khách hàng và studio, trả lời nhanh bằng mẫu thông minh
            và quản lý hỗ trợ tập trung.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
          <div className="rounded-[30px] border border-neutral-200 bg-white/95 p-4 shadow-[0_12px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-900/95">
            <div className="mb-4">
              <p className="text-xs uppercase tracking-[0.25em] text-neutral-500 dark:text-neutral-400">
                Conversations
              </p>
              <h2 className="mt-2 text-2xl font-semibold">Tin nhắn khách hàng</h2>
            </div>

            {loading ? (
              <div className="py-10 text-center text-sm text-neutral-500 dark:text-neutral-400">
                Đang tải...
              </div>
            ) : conversations.length === 0 ? (
              <div className="py-10 text-center text-sm text-neutral-500 dark:text-neutral-400">
                Chưa có hội thoại nào
              </div>
            ) : (
              <div className="space-y-3">
                {conversations.map((conversation) => {
                  const isActive = selectedConversation?._id === conversation._id

                  return (
                    <button
                      key={conversation._id}
                      type="button"
                      onClick={() => setSelectedConversation(conversation)}
                      className={`w-full rounded-[24px] border p-4 text-left transition ${
                        isActive
                          ? 'border-primary bg-primary/8 shadow-[0_10px_24px_rgba(201,168,76,0.12)] dark:border-primary dark:bg-primary/10'
                          : 'border-neutral-200 bg-white hover:-translate-y-0.5 hover:bg-neutral-50 hover:shadow-sm dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-800/60'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-neutral-100 text-sm font-bold text-neutral-700 dark:bg-neutral-800 dark:text-white">
                          {(conversation.userId?.name || 'K').charAt(0).toUpperCase()}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-neutral-900 dark:text-white">
                                {conversation.userId?.name || 'Khách hàng'}
                              </p>
                              <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                                {conversation.userId?.email || '--'}
                              </p>
                            </div>

                            {conversation.unreadCountAdmin > 0 && (
                              <span className="rounded-full bg-red-500 px-2 py-1 text-[10px] font-bold text-white">
                                {conversation.unreadCountAdmin}
                              </span>
                            )}
                          </div>

                          <p className="mt-2 line-clamp-2 text-sm text-neutral-600 dark:text-neutral-300">
                            {conversation.lastMessage || 'Chưa có tin nhắn'}
                          </p>

                          <div className="mt-3 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                            <span>{conversation.userId?.email || '--'}</span>
                            <span>
                              {conversation.lastMessageAt
                                ? new Date(conversation.lastMessageAt).toLocaleString('vi-VN')
                                : '--'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-[30px] border border-neutral-200 bg-white/95 shadow-[0_12px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-900/95">
            {selectedConversation ? (
              <>
                <div className="border-b border-neutral-200 bg-gradient-to-r from-white via-neutral-50 to-[#fff4d6] px-6 py-5 dark:border-neutral-800 dark:from-neutral-900 dark:via-neutral-950 dark:to-[#2a210d]">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#111111,#2a210d,#C9A84C)] text-lg font-bold text-white">
                        {(selectedConversation.userId?.name || 'K').charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-[0.25em] text-neutral-500 dark:text-neutral-400">
                          Active conversation
                        </p>
                        <h2 className="mt-1 text-2xl font-semibold">
                          {selectedConversation.userId?.name || 'Khách hàng'}
                        </h2>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                          {selectedConversation.userId?.email || '--'}
                        </p>
                      </div>
                    </div>

                    {selectedConversationBookingSummary ? (
                      <div className="rounded-[22px] border border-yellow-200 bg-yellow-50/70 p-4 text-sm dark:border-yellow-900/40 dark:bg-yellow-900/20">
                        <p className="text-xs uppercase tracking-[0.22em] text-yellow-700 dark:text-yellow-300">
                          Booking liên quan
                        </p>
                        <div className="mt-2 space-y-1 text-neutral-800 dark:text-neutral-100">
                          <p>
                            <span className="font-semibold">Mã:</span>{' '}
                            {selectedConversationBookingSummary.bookingCode || '--'}
                          </p>
                          <p>
                            <span className="font-semibold">Dịch vụ:</span>{' '}
                            {selectedConversationBookingSummary.serviceName || '--'}
                          </p>
                          <p>
                            <span className="font-semibold">Lịch:</span>{' '}
                            {selectedConversationBookingSummary.date || '--'} -{' '}
                            {selectedConversationBookingSummary.sessionLabel ||
                              selectedConversationBookingSummary.session ||
                              '--'}
                          </p>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div
                  ref={scrollRef}
                  onScroll={handleScroll}
                  className="h-[500px] space-y-4 overflow-y-auto bg-[radial-gradient(circle_at_top,#fff6dd,transparent_18%),linear-gradient(to_bottom,#fafbfc,#f3f4f6)] px-6 py-5 dark:bg-[radial-gradient(circle_at_top,rgba(201,168,76,0.06),transparent_18%),linear-gradient(to_bottom,#0b0d12,#10131a)]"
                >
                  {loadingMessages ? (
                    <div className="py-10 text-center text-sm text-neutral-500 dark:text-neutral-400">
                      Đang tải tin nhắn...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="py-10 text-center text-sm text-neutral-500 dark:text-neutral-400">
                      Chưa có tin nhắn
                    </div>
                  ) : (
                    messages.map((message) => (
                      <MessageBubble
                        key={message._id}
                        message={message}
                        viewerRole="admin"
                      />
                    ))
                  )}
                </div>

                <div className="border-t border-neutral-200 bg-white/90 px-6 py-5 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/90">
                  <div className="mb-4">
                    <div className="mb-3 flex flex-wrap gap-2">
                      {quickReplyTabs.map((tab) => (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setActiveQuickReplyTab(tab.key)}
                          className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                            activeQuickReplyTab === tab.key
                              ? 'bg-yellow-700 text-white shadow-sm'
                              : 'border border-neutral-200 bg-neutral-50 text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800/70 dark:text-neutral-300 dark:hover:bg-neutral-800'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <div className="grid gap-2 md:grid-cols-2">
                      {activeReplies.map((reply, index) => {
                        const preview = replaceTemplateVars(reply, selectedConversation)

                        return (
                          <button
                            key={`${activeQuickReplyTab}-${index}`}
                            type="button"
                            onClick={() => handleApplyQuickReply(reply)}
                            className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3 text-left text-xs text-neutral-700 transition hover:-translate-y-0.5 hover:bg-neutral-100 hover:shadow-sm dark:border-neutral-700 dark:bg-neutral-800/70 dark:text-neutral-200 dark:hover:bg-neutral-800"
                            title="Nhấn để đổ nội dung vào ô chat"
                          >
                            <p className="line-clamp-3 leading-5">{preview}</p>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {selectedFile ? (
                    <div className="mb-4 rounded-2xl bg-neutral-50 px-4 py-3 text-xs text-neutral-600 shadow-sm dark:bg-neutral-950 dark:text-neutral-300">
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

                  <div className="flex items-end gap-3 rounded-[28px] border border-neutral-200 bg-neutral-50 p-3 shadow-inner dark:border-neutral-700 dark:bg-neutral-950">
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
                      placeholder="Nhập phản hồi cho khách hàng..."
                      className="max-h-36 min-h-[54px] flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-neutral-400 dark:text-white"
                    />

                    <button
                      type="button"
                      onClick={handleSend}
                      disabled={sending}
                      className="rounded-2xl bg-[linear-gradient(135deg,#E8C96A,#C9A84C)] px-5 py-3 text-sm font-semibold text-black shadow-[0_8px_20px_rgba(201,168,76,0.28)] transition hover:scale-[1.02] hover:opacity-95 disabled:opacity-60"
                    >
                      {sending ? 'Đang gửi...' : 'Gửi'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex h-[760px] items-center justify-center text-sm text-neutral-500 dark:text-neutral-400">
                Chọn một tài khoản ở bên trái để mở cuộc trò chuyện
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminChatsPage