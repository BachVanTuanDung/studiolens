const MessageBubble = ({ message, viewerRole = 'user' }) => {
  const isSystem = message.senderRole === 'system'
  const isMine = !isSystem && message.senderRole === viewerRole

  const senderName =
    message.senderRole === 'user'
      ? message.senderId?.name || 'Khách hàng'
      : message.senderRole === 'admin'
        ? message.senderId?.name || 'Admin'
        : 'StudioLens'

  const readIndicator = isMine ? (message.isRead ? '✓✓' : '✓') : ''

  return (
    <div
      className={`flex animate-[fadeIn_.22s_ease] ${
        isSystem ? 'justify-center' : isMine ? 'justify-end' : 'justify-start'
      }`}
    >
      <div
        className={`max-w-[80%] transition-all duration-200 ${
          isSystem
            ? 'rounded-2xl border border-dashed border-neutral-300 bg-white/70 px-4 py-3 text-center text-sm text-neutral-600 shadow-sm backdrop-blur-sm dark:border-neutral-700 dark:bg-neutral-900/80 dark:text-neutral-300'
            : isMine
              ? 'rounded-[24px] rounded-br-md bg-[linear-gradient(135deg,#E8C96A,#C9A84C)] px-4 py-3 text-sm text-black shadow-[0_10px_24px_rgba(201,168,76,0.22)]'
              : 'rounded-[24px] rounded-bl-md border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 shadow-[0_8px_22px_rgba(15,23,42,0.06)] dark:border-neutral-700 dark:bg-neutral-900 dark:text-white'
        }`}
      >
        {!isSystem && (
          <div
            className={`mb-2 flex items-center gap-2 ${
              isMine ? 'justify-end' : 'justify-start'
            }`}
          >
            {!isMine && (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-200 text-[11px] font-bold text-neutral-700 dark:bg-neutral-700 dark:text-white">
                {senderName.charAt(0).toUpperCase()}
              </div>
            )}

            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-60">
              {senderName}
            </p>
          </div>
        )}

        {message.content ? (
          <p className="whitespace-pre-wrap break-words leading-6">{message.content}</p>
        ) : null}

        {message.messageType === 'image' && message.mediaUrl ? (
          <img
            src={message.mediaUrl}
            alt="chat-media"
            className="mt-3 max-h-80 w-full rounded-2xl object-cover shadow-sm"
          />
        ) : null}

        {message.messageType === 'video' && message.mediaUrl ? (
          <video
            src={message.mediaUrl}
            controls
            className="mt-3 max-h-80 w-full rounded-2xl bg-black shadow-sm"
          />
        ) : null}

        {message.messageType === 'file' && message.mediaUrl ? (
          <a
            href={message.mediaUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 flex items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
          >
            <span className="text-lg">📎</span>
            <div className="min-w-0">
              <p className="truncate font-semibold">
                {message.fileName || 'Tệp đính kèm'}
              </p>
              <p className="text-xs opacity-70">
                {message.mimeType || 'File'}
                {message.fileSize
                  ? ` • ${(message.fileSize / 1024 / 1024).toFixed(2)} MB`
                  : ''}
              </p>
            </div>
          </a>
        ) : null}

        <div
          className={`mt-2 flex items-center gap-2 text-[11px] opacity-55 ${
            isMine ? 'justify-end' : 'justify-start'
          }`}
        >
          <span>{new Date(message.createdAt).toLocaleString('vi-VN')}</span>
          {isMine && !isSystem ? (
            <span
              className={`font-bold tracking-tight ${
                message.isRead ? 'text-blue-500' : 'text-neutral-500 dark:text-neutral-400'
              }`}
              title={message.isRead ? 'Đã đọc' : 'Đã gửi'}
            >
              {readIndicator}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default MessageBubble