export const notificationTypeMap = {
  booking_created: {
    label: 'Booking mới',
    icon: '📅',
    category: 'booking',
    priority: 'normal',
    className:
      'bg-blue-100 text-blue-700 ring-1 ring-inset ring-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-500/30',
  },
  booking_confirmed: {
    label: 'Đã xác nhận booking',
    icon: '✅',
    category: 'booking',
    priority: 'high',
    className:
      'bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/30',
  },
  booking_rescheduled: {
    label: 'Đổi lịch booking',
    icon: '🕒',
    category: 'booking',
    priority: 'high',
    className:
      'bg-violet-100 text-violet-700 ring-1 ring-inset ring-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-500/30',
  },
  booking_cancelled: {
    label: 'Booking bị hủy',
    icon: '❌',
    category: 'booking',
    priority: 'high',
    className:
      'bg-rose-100 text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-500/30',
  },
  booking_completed: {
    label: 'Buổi chụp hoàn thành',
    icon: '🎉',
    category: 'booking',
    priority: 'normal',
    className:
      'bg-teal-100 text-teal-700 ring-1 ring-inset ring-teal-200 dark:bg-teal-500/15 dark:text-teal-300 dark:ring-teal-500/30',
  },
  booking_reminder: {
    label: 'Nhắc lịch chụp',
    icon: '⏰',
    category: 'booking',
    priority: 'high',
    className:
      'bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/30',
  },

  payment_pending: {
    label: 'Chờ xác nhận thanh toán',
    icon: '💳',
    category: 'payment',
    priority: 'high',
    className:
      'bg-yellow-100 text-yellow-700 ring-1 ring-inset ring-yellow-200 dark:bg-yellow-500/15 dark:text-yellow-300 dark:ring-yellow-500/30',
  },
  payment_confirmed: {
    label: 'Đã xác nhận thanh toán',
    icon: '💰',
    category: 'payment',
    priority: 'high',
    className:
      'bg-green-100 text-green-700 ring-1 ring-inset ring-green-200 dark:bg-green-500/15 dark:text-green-300 dark:ring-green-500/30',
  },
  payment_failed: {
    label: 'Thanh toán thất bại',
    icon: '⚠️',
    category: 'payment',
    priority: 'high',
    className:
      'bg-red-100 text-red-700 ring-1 ring-inset ring-red-200 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-500/30',
  },
  payment_reminder: {
    label: 'Nhắc thanh toán',
    icon: '🔔',
    category: 'payment',
    priority: 'normal',
    className:
      'bg-orange-100 text-orange-700 ring-1 ring-inset ring-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:ring-orange-500/30',
  },

  gallery_created: {
    label: 'Gallery mới',
    icon: '🖼️',
    category: 'gallery',
    priority: 'normal',
    className:
      'bg-pink-100 text-pink-700 ring-1 ring-inset ring-pink-200 dark:bg-pink-500/15 dark:text-pink-300 dark:ring-pink-500/30',
  },
  gallery_updated: {
    label: 'Gallery đã cập nhật',
    icon: '✨',
    category: 'gallery',
    priority: 'normal',
    className:
      'bg-fuchsia-100 text-fuchsia-700 ring-1 ring-inset ring-fuchsia-200 dark:bg-fuchsia-500/15 dark:text-fuchsia-300 dark:ring-fuchsia-500/30',
  },
  edited_images_ready: {
    label: 'Ảnh đã chỉnh xong',
    icon: '🎨',
    category: 'gallery',
    priority: 'high',
    className:
      'bg-indigo-100 text-indigo-700 ring-1 ring-inset ring-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:ring-indigo-500/30',
  },
  selected_images_submitted: {
    label: 'Đã gửi ảnh đã chọn',
    icon: '📤',
    category: 'gallery',
    priority: 'normal',
    className:
      'bg-cyan-100 text-cyan-700 ring-1 ring-inset ring-cyan-200 dark:bg-cyan-500/15 dark:text-cyan-300 dark:ring-cyan-500/30',
  },

  email_verified: {
    label: 'Đã xác thực email',
    icon: '📧',
    category: 'account',
    priority: 'normal',
    className:
      'bg-sky-100 text-sky-700 ring-1 ring-inset ring-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-500/30',
  },
  password_changed: {
    label: 'Đổi mật khẩu thành công',
    icon: '🔐',
    category: 'account',
    priority: 'high',
    className:
      'bg-lime-100 text-lime-700 ring-1 ring-inset ring-lime-200 dark:bg-lime-500/15 dark:text-lime-300 dark:ring-lime-500/30',
  },
  profile_updated: {
    label: 'Cập nhật hồ sơ',
    icon: '👤',
    category: 'account',
    priority: 'low',
    className:
      'bg-neutral-100 text-neutral-700 ring-1 ring-inset ring-neutral-200 dark:bg-white/10 dark:text-white dark:ring-white/10',
  },
  temporary_password_sent: {
    label: 'Đã gửi mật khẩu tạm',
    icon: '🔑',
    category: 'account',
    priority: 'high',
    className:
      'bg-stone-100 text-stone-700 ring-1 ring-inset ring-stone-200 dark:bg-stone-500/15 dark:text-stone-300 dark:ring-stone-500/30',
  },

  system_announcement: {
    label: 'Thông báo hệ thống',
    icon: '📢',
    category: 'system',
    priority: 'normal',
    className:
      'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:ring-slate-500/30',
  },
  maintenance_notice: {
    label: 'Bảo trì hệ thống',
    icon: '🛠️',
    category: 'system',
    priority: 'high',
    className:
      'bg-zinc-100 text-zinc-700 ring-1 ring-inset ring-zinc-200 dark:bg-zinc-500/15 dark:text-zinc-300 dark:ring-zinc-500/30',
  },
  promotion_notice: {
    label: 'Ưu đãi mới',
    icon: '🎁',
    category: 'system',
    priority: 'low',
    className:
      'bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/30',
  },

  general: {
    label: 'Thông báo',
    icon: '🔔',
    category: 'general',
    priority: 'normal',
    className:
      'bg-neutral-100 text-neutral-700 ring-1 ring-inset ring-neutral-200 dark:bg-white/10 dark:text-white dark:ring-white/10',
  },
}

export const notificationCategoryTabs = [
  { key: 'all', label: 'Tất cả', icon: '📋' },
  { key: 'booking', label: 'Booking', icon: '📅' },
  { key: 'payment', label: 'Thanh toán', icon: '💳' },
  { key: 'gallery', label: 'Gallery', icon: '🖼️' },
  { key: 'account', label: 'Tài khoản', icon: '👤' },
  { key: 'system', label: 'Hệ thống', icon: '📢' },
]