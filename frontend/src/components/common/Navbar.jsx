import { Link, NavLink, useLocation } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import notificationApi from '../../api/notificationApi'
import useChatUnreadBadge from '../../hooks/useChatUnreadBadge'
import { useChatWidget } from '../../context/ChatWidgetContext'

const defaultAvatar = 'https://via.placeholder.com/100?text=AVT'

const Navbar = () => {
  const { user, logout, theme, toggleTheme } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const location = useLocation()
  const { userUnreadCount } = useChatUnreadBadge()
  const { openChat } = useChatWidget()

  useEffect(() => {
    setMobileOpen(false)
    setProfileMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return

      try {
        const res = await notificationApi.getMyNotifications()
        setUnreadCount(res.data?.unreadCount || 0)
      } catch (error) {
        console.error(error)
      }
    }

    fetchNotifications()
  }, [user, location.pathname])

  const navItems = useMemo(() => {
    const items = [
      { to: '/', label: 'Trang chủ' },
      { to: '/concept', label: 'Concept' },
      { to: '/services', label: 'Dịch vụ' },
      { to: '/booking', label: 'Đặt lịch' },
    ]

    if (user) {
      items.push({ to: '/gallery', label: 'Gallery cá nhân' })
    }

    return items
  }, [user])

  const mobileNavClass = ({ isActive }) =>
    `flex items-center justify-between rounded-2xl px-4 py-3 text-[15px] font-semibold transition duration-300 ${
      isActive
        ? 'bg-primary/10 text-primary'
        : 'text-neutral-700 hover:bg-neutral-100 hover:translate-x-1 dark:text-neutral-300 dark:hover:bg-white/5'
    }`

  const desktopNavClass = ({ isActive }) =>
    `group relative rounded-2xl px-2.5 py-2 text-[14px] font-semibold transition duration-300 xl:px-3 xl:text-[15px] ${
      isActive
        ? 'text-primary'
        : 'text-neutral-700 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white'
    }`

  return (
    <header className="sticky top-0 z-50">
      <div className="border-b border-black/5 bg-white/82 backdrop-blur-xl dark:border-white/10 dark:bg-[#09090b]/82">
        <div className="mx-auto max-w-7xl px-3 py-3 sm:px-5 lg:px-6 xl:px-8">
          <div className="flex items-center justify-between gap-3">
            <Link to="/" className="group flex shrink-0 items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#111111,#2a210d)] text-sm font-bold text-white shadow-lg transition duration-300 group-hover:scale-105 group-hover:shadow-xl dark:bg-[linear-gradient(135deg,#C9A84C,#E8C96A)] dark:text-black">
                S
              </div>

              <div className="transition duration-300 group-hover:translate-x-0.5">
                <p className="text-[20px] font-bold leading-none tracking-tight text-neutral-900 dark:text-white">
                  StudioLens
                </p>
                <p className="mt-1 hidden text-[9px] uppercase tracking-[0.24em] text-neutral-400 dark:text-neutral-500 sm:block">
                  Studio Management
                </p>
              </div>
            </Link>

            <nav className="hidden min-w-0 flex-1 items-center justify-center lg:flex">
              <div className="flex min-w-0 items-center justify-center gap-1 xl:gap-2">
                {navItems.map((item) => (
                  <NavLink key={item.to} to={item.to} className={desktopNavClass}>
                    {({ isActive }) => (
                      <span className="relative inline-flex items-center gap-1.5 whitespace-nowrap">
                        <span className="transition duration-300 group-hover:tracking-[0.01em]">
                          {item.label}
                        </span>

                        <span
                          className={`absolute -bottom-2 left-0 h-[2px] rounded-full bg-primary transition-all duration-300 ${
                            isActive
                              ? 'w-full opacity-100'
                              : 'w-0 opacity-0 group-hover:w-full group-hover:opacity-100'
                          }`}
                        />
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            </nav>

            <div className="flex shrink-0 items-center gap-2">
              {user && (
                <Link
                  to="/notifications"
                  className="relative hidden h-11 w-11 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-lg text-neutral-700 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:scale-105 hover:bg-neutral-50 hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 sm:inline-flex"
                  title="Thông báo"
                  aria-label="Thông báo"
                >
                  <span className="leading-none">🔔</span>

                  {unreadCount > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex min-h-[20px] min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white shadow-lg ring-2 ring-white dark:ring-[#09090b]">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
              )}

              {user ? (
                <div className="relative hidden sm:block">
                  <button
                    type="button"
                    onClick={() => setProfileMenuOpen((prev) => !prev)}
                    className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-2.5 py-2 text-sm font-medium text-neutral-800 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:bg-neutral-50 hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                  >
                    <img
                      src={user.avatar || defaultAvatar}
                      alt={user.name}
                      onError={(e) => {
                        e.currentTarget.src = defaultAvatar
                      }}
                      className="h-9 w-9 rounded-full object-cover ring-2 ring-neutral-200 dark:ring-white/10"
                    />

                    <div className="hidden max-w-[130px] text-left xl:block">
                      <p className="truncate text-[14px] font-semibold">{user.name}</p>
                      <p className="truncate text-[11px] text-neutral-500 dark:text-neutral-400">
                        {user.role === 'admin' ? 'Quản trị viên' : 'Khách hàng'}
                      </p>
                    </div>

                    <span
                      className={`text-[10px] transition-transform duration-300 ${
                        profileMenuOpen ? 'rotate-180' : ''
                      }`}
                    >
                      ▼
                    </span>
                  </button>

                  {profileMenuOpen && (
                    <div className="absolute right-0 mt-3 w-72 overflow-hidden rounded-3xl border border-black/5 bg-white/95 p-2 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-[#111317]/95">
                      <div className="mb-2 rounded-2xl bg-neutral-50 p-3 dark:bg-white/5">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.avatar || defaultAvatar}
                            alt={user.name}
                            onError={(e) => {
                              e.currentTarget.src = defaultAvatar
                            }}
                            className="h-12 w-12 rounded-full object-cover ring-2 ring-neutral-200 dark:ring-white/10"
                          />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-neutral-900 dark:text-white">
                              {user.name}
                            </p>
                            <p className="truncate text-sm text-neutral-500 dark:text-neutral-400">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </div>

                      <Link
                        to="/profile"
                        className="flex items-center gap-3 rounded-2xl px-4 py-3 text-[15px] font-medium text-neutral-700 transition duration-300 hover:translate-x-1 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-white/5"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 dark:bg-white/10">
                          👤
                        </span>
                        <span>Hồ sơ cá nhân</span>
                      </Link>

                      <Link
                        to="/my-bookings"
                        className="flex items-center gap-3 rounded-2xl px-4 py-3 text-[15px] font-medium text-neutral-700 transition duration-300 hover:translate-x-1 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-white/5"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 dark:bg-white/10">
                          📅
                        </span>
                        <span>Booking của tôi</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => {
                          openChat()
                          setProfileMenuOpen(false)
                        }}
                        className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-[15px] font-medium text-neutral-700 transition duration-300 hover:translate-x-1 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-white/5"
                      >
                        <span className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 dark:bg-white/10">
                            💬
                          </span>
                          <span>Chat hỗ trợ</span>
                        </span>

                        {userUnreadCount > 0 && (
                          <span className="inline-flex min-h-[20px] min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                            {userUnreadCount > 9 ? '9+' : userUnreadCount}
                          </span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={toggleTheme}
                        className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-[15px] font-medium text-neutral-700 transition duration-300 hover:translate-x-1 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-white/5"
                      >
                        <span className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 dark:bg-white/10">
                            {theme === 'dark' ? '☀️' : '🌙'}
                          </span>
                          <span>{theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}</span>
                        </span>
                      </button>

                      {user.role === 'admin' && (
                        <Link
                          to="/admin"
                          className="flex items-center gap-3 rounded-2xl px-4 py-3 text-[15px] font-medium text-neutral-700 transition duration-300 hover:translate-x-1 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-white/5"
                        >
                          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 dark:bg-white/10">
                            ⚙️
                          </span>
                          <span>Trang admin</span>
                        </Link>
                      )}

                      <div className="my-2 h-px bg-neutral-200 dark:bg-white/10" />

                      <button
                        onClick={logout}
                        className="w-full rounded-2xl bg-black px-4 py-3 text-[15px] font-semibold text-white transition duration-300 hover:scale-[1.02] hover:opacity-90 dark:bg-primary dark:text-black"
                      >
                        Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="hidden items-center justify-center rounded-2xl bg-black px-5 py-2.5 text-[15px] font-semibold text-white shadow-lg transition duration-300 hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-xl dark:bg-primary dark:text-black sm:inline-flex"
                >
                  Đăng nhập
                </Link>
              )}

              <button
                type="button"
                onClick={() => setMobileOpen((prev) => !prev)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-lg text-neutral-700 shadow-sm transition duration-300 hover:scale-105 hover:bg-neutral-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 lg:hidden"
                aria-label="Mở menu"
              >
                {mobileOpen ? '✕' : '☰'}
              </button>
            </div>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-black/5 px-4 pb-4 pt-3 dark:border-white/10 lg:hidden">
            <div className="rounded-[28px] border border-black/5 bg-white/90 p-3 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#101216]/90">
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={mobileNavClass}
                    onClick={() => setMobileOpen(false)}
                  >
                    <span>{item.label}</span>
                  </NavLink>
                ))}

                {user && (
                  <>
                    <NavLink
                      to="/notifications"
                      className={mobileNavClass}
                      onClick={() => setMobileOpen(false)}
                    >
                      <span>Thông báo</span>
                      {unreadCount > 0 && (
                        <span className="inline-flex min-h-[20px] min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </NavLink>

                    <button
                      type="button"
                      onClick={() => {
                        openChat()
                        setMobileOpen(false)
                      }}
                      className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-[15px] font-semibold text-neutral-700 transition duration-300 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-white/5"
                    >
                      <span>Chat hỗ trợ</span>
                      {userUnreadCount > 0 && (
                        <span className="inline-flex min-h-[20px] min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                          {userUnreadCount > 9 ? '9+' : userUnreadCount}
                        </span>
                      )}
                    </button>
                  </>
                )}
              </nav>

              <div className="my-3 h-px bg-neutral-200 dark:bg-white/10" />

              <button
                onClick={toggleTheme}
                className="mb-3 flex h-11 w-full items-center justify-center rounded-2xl border border-neutral-200 bg-white text-lg text-neutral-700 transition duration-300 hover:bg-neutral-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                title={theme === 'dark' ? 'Chuyển sang Light Mode' : 'Chuyển sang Dark Mode'}
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>

              {user ? (
                <>
                  <Link
                    to="/profile"
                    className="mb-3 flex items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 transition duration-300 hover:bg-neutral-100 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                    onClick={() => setMobileOpen(false)}
                  >
                    <img
                      src={user.avatar || defaultAvatar}
                      alt={user.name}
                      onError={(e) => {
                        e.currentTarget.src = defaultAvatar
                      }}
                      className="h-11 w-11 rounded-full object-cover ring-2 ring-neutral-200 dark:ring-white/10"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold text-neutral-900 dark:text-white">
                        {user.name}
                      </p>
                      <p className="truncate text-sm text-neutral-500 dark:text-neutral-400">
                        {user.email}
                      </p>
                    </div>
                  </Link>

                  <Link
                    to="/my-bookings"
                    className="mb-3 block rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-center text-[15px] font-semibold text-neutral-800 transition duration-300 hover:bg-neutral-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                    onClick={() => setMobileOpen(false)}
                  >
                    Booking của tôi
                  </Link>

                  {user.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="mb-3 block rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-center text-[15px] font-semibold text-neutral-800 transition duration-300 hover:bg-neutral-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                      onClick={() => setMobileOpen(false)}
                    >
                      Trang admin
                    </Link>
                  )}

                  <button
                    onClick={logout}
                    className="w-full rounded-2xl bg-black px-4 py-3 text-[15px] font-semibold text-white transition duration-300 hover:scale-[1.01] hover:opacity-90 dark:bg-primary dark:text-black"
                  >
                    Đăng xuất
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="block w-full rounded-2xl bg-black px-4 py-3 text-center text-[15px] font-semibold text-white transition duration-300 hover:scale-[1.01] hover:opacity-90 dark:bg-primary dark:text-black"
                  onClick={() => setMobileOpen(false)}
                >
                  Đăng nhập
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

export default Navbar
