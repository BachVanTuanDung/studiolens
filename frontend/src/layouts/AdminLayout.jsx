import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import useChatUnreadBadge from '../hooks/useChatUnreadBadge'

const menuItems = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/bookings', label: 'Quản lý booking' },
  { to: '/admin/booking-calendar', label: 'Lịch booking' },
  { to: '/admin/services', label: 'Quản lý dịch vụ' },
  { to: '/admin/concepts', label: 'Quản lý concept' },
  { to: '/admin/galleries', label: 'Quản lý gallery' },
  { to: '/admin/selected-images', label: 'Ảnh khách đã chọn' },
  { to: '/admin/users', label: 'Quản lý người dùng' },
  { to: '/admin/chats', label: 'Chat hỗ trợ', badgeKey: 'chat' },
]

const AdminLayout = () => {
  const { user, logout } = useAuth()
  const { adminUnreadCount } = useChatUnreadBadge()

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950">
      <div className="grid min-h-screen md:grid-cols-[260px_1fr]">
        <aside className="bg-black px-6 py-8 text-white dark:bg-neutral-900">
          <Link to="/" className="text-2xl font-bold tracking-wide">
            StudioLens
          </Link>

          <div className="mt-10">
            <p className="text-xs uppercase tracking-[0.3em] text-yellow-500">Admin Panel</p>
            <p className="mt-3 text-sm text-neutral-300">{user?.name || 'Admin'}</p>
            <p className="text-xs text-neutral-500">{user?.email}</p>
          </div>

          <nav className="mt-10 space-y-2">
            {menuItems.map((item) => {
              const badgeCount = item.badgeKey === 'chat' ? adminUnreadCount : 0

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/admin'}
                  className={({ isActive }) =>
                    `flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition ${
                      isActive
                        ? 'bg-yellow-700 text-white'
                        : 'text-neutral-300 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <span>{item.label}</span>

                  {badgeCount > 0 && (
                    <span className="ml-3 inline-flex min-h-[22px] min-w-[22px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white">
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </span>
                  )}
                </NavLink>
              )
            })}
          </nav>

          <button
            onClick={logout}
            className="mt-10 w-full rounded-lg border border-white/20 px-4 py-3 text-sm font-semibold text-white"
          >
            Đăng xuất
          </button>
        </aside>

        <main className="px-6 py-8 text-neutral-900 dark:text-white md:px-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout