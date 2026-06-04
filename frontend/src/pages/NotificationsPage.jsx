import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import notificationApi from '../api/notificationApi'
import {
  notificationCategoryTabs,
  notificationTypeMap,
} from '../constants/notificationMeta'

const formatTimeAgo = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date

  if (Number.isNaN(date.getTime())) return '--'

  const minutes = Math.floor(diffMs / 60000)
  const hours = Math.floor(diffMs / 3600000)
  const days = Math.floor(diffMs / 86400000)

  if (minutes < 1) return 'Vừa xong'
  if (minutes < 60) return `${minutes} phút trước`
  if (hours < 24) return `${hours} giờ trước`
  if (days < 7) return `${days} ngày trước`

  return date.toLocaleString('vi-VN')
}

const SectionBadge = ({ children }) => (
  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
    {children}
  </p>
)

const PriorityBadge = ({ priority }) => {
  const styles = {
    low: 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300',
    normal: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
    high: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  }

  const labels = {
    low: 'Thấp',
    normal: 'Thường',
    high: 'Cao',
  }

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[priority] || styles.normal}`}>
      Ưu tiên {labels[priority] || 'Thường'}
    </span>
  )
}

export default function NotificationsPage() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [markingAll, setMarkingAll] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

  const fetchNotifications = async () => {
    try {
      const res = await notificationApi.getMyNotifications()
      setNotifications(res.data?.data || [])
    } catch (error) {
      console.error(error)
      toast.error('Không thể tải thông báo')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications]
  )

  const filteredNotifications = useMemo(() => {
    if (activeTab === 'all') return notifications
    return notifications.filter((item) => item.category === activeTab)
  }, [notifications, activeTab])

  const unreadNotifications = filteredNotifications.filter((item) => !item.isRead)
  const readNotifications = filteredNotifications.filter((item) => item.isRead)

  const handleOpenNotification = async (item) => {
    try {
      if (!item.isRead) {
        await notificationApi.markAsRead(item._id)
        setNotifications((prev) =>
          prev.map((n) => (n._id === item._id ? { ...n, isRead: true } : n))
        )
      }

      if (item.link) {
        navigate(item.link)
      }
    } catch (error) {
      console.error(error)
      toast.error('Không thể cập nhật thông báo')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      setMarkingAll(true)
      await notificationApi.markAllAsRead()
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })))
      toast.success('Đã đánh dấu tất cả là đã đọc')
    } catch (error) {
      console.error(error)
      toast.error('Không thể cập nhật thông báo')
    } finally {
      setMarkingAll(false)
    }
  }

  const renderNotificationCard = (item) => {
    const typeInfo = notificationTypeMap[item.type] || notificationTypeMap.general
    const priority = item.priority || typeInfo.priority || 'normal'

    return (
      <button
        key={item._id}
        type="button"
        onClick={() => handleOpenNotification(item)}
        className={`w-full rounded-[28px] border p-5 text-left shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md ${
          item.isRead
            ? 'border-black/5 bg-white/85 dark:border-white/10 dark:bg-white/5'
            : 'border-primary/30 bg-primary/5 dark:border-primary/30 dark:bg-primary/10'
        }`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${typeInfo.className}`}
              >
                {typeInfo.icon} {typeInfo.label}
              </span>

              <PriorityBadge priority={priority} />

              {!item.isRead && (
                <span className="rounded-full bg-red-500 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                  Mới
                </span>
              )}
            </div>

            <h3 className="mt-3 text-lg font-bold text-neutral-900 dark:text-white">
              {item.title}
            </h3>

            <p className="mt-2 text-sm leading-7 text-neutral-600 dark:text-neutral-300">
              {item.message}
            </p>
          </div>

          <div className="shrink-0 text-sm text-neutral-500 dark:text-neutral-400">
            {formatTimeAgo(item.createdAt)}
          </div>
        </div>
      </button>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f8f5ef,transparent_35%),linear-gradient(to_bottom,#faf7f2,#f6f7fb)] dark:bg-[radial-gradient(circle_at_top,#1a1408,transparent_22%),linear-gradient(to_bottom,#09090b,#0f1117)] dark:text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <section className="relative overflow-hidden rounded-[36px] border border-white/60 bg-black shadow-[0_30px_80px_rgba(15,23,42,0.18)] dark:border-white/10">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,0,0,0.86),rgba(0,0,0,0.45),rgba(201,168,76,0.18))]" />
          <div className="relative px-6 py-14 sm:px-8 sm:py-16 lg:px-12 lg:py-18">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Notification Center
              </div>

              <h1 className="mt-6 text-4xl font-bold leading-tight text-white sm:text-5xl">
                Trung tâm thông báo
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-8 text-white/75 sm:text-lg">
                Theo dõi cập nhật mới nhất về booking, thanh toán, gallery và tài khoản của bạn.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[30px] border border-black/5 bg-white/85 p-5 shadow-[0_12px_40px_rgba(15,23,42,0.05)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <SectionBadge>Your notifications</SectionBadge>
              <h2 className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">
                Danh sách thông báo
              </h2>
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                Hiện có{' '}
                <span className="font-semibold text-neutral-900 dark:text-white">
                  {unreadCount}
                </span>{' '}
                thông báo chưa đọc.
              </p>
            </div>

            <button
              type="button"
              onClick={handleMarkAllAsRead}
              disabled={markingAll || unreadCount === 0}
              className="inline-flex items-center justify-center rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-primary dark:text-black"
            >
              {markingAll ? 'Đang cập nhật...' : 'Đánh dấu tất cả đã đọc'}
            </button>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {notificationCategoryTabs.map((tab) => {
              const active = activeTab === tab.key

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded-2xl px-4 py-2.5 text-sm font-medium transition duration-300 ${
                    active
                      ? 'bg-black text-white shadow-lg dark:bg-primary dark:text-black'
                      : 'border border-neutral-200 bg-white text-neutral-700 hover:-translate-y-0.5 hover:border-primary hover:text-primary dark:border-white/10 dark:bg-white/5 dark:text-neutral-200 dark:hover:text-primary'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              )
            })}
          </div>
        </section>

        <section className="mt-6 space-y-8">
          {loading ? (
            <div className="rounded-[30px] border border-black/5 bg-white/85 p-10 text-center shadow-sm dark:border-white/10 dark:bg-white/5">
              Đang tải thông báo...
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="rounded-[30px] border border-black/5 bg-white/85 p-12 text-center shadow-sm dark:border-white/10 dark:bg-white/5">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100 text-3xl dark:bg-white/10">
                🔔
              </div>
              <h3 className="mt-5 text-2xl font-semibold text-neutral-900 dark:text-white">
                Chưa có thông báo nào
              </h3>
              <p className="mt-3 text-neutral-500 dark:text-neutral-400">
                Hiện chưa có thông báo thuộc nhóm này.
              </p>
            </div>
          ) : (
            <>
              {unreadNotifications.length > 0 && (
                <div>
                  <h3 className="mb-4 text-xl font-bold text-neutral-900 dark:text-white">
                    Chưa đọc
                  </h3>
                  <div className="space-y-4">
                    {unreadNotifications.map(renderNotificationCard)}
                  </div>
                </div>
              )}

              {readNotifications.length > 0 && (
                <div>
                  <h3 className="mb-4 text-xl font-bold text-neutral-900 dark:text-white">
                    Đã đọc
                  </h3>
                  <div className="space-y-4">
                    {readNotifications.map(renderNotificationCard)}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  )
}