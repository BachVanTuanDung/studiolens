import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="relative mt-16 border-t border-black/5 bg-white/70 text-neutral-700 backdrop-blur-xl dark:border-white/10 dark:bg-[#09090b]/70 dark:text-neutral-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr_0.8fr_1fr]">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#111111,#2a210d)] text-sm font-bold text-white shadow-lg dark:bg-[linear-gradient(135deg,#C9A84C,#E8C96A)] dark:text-black">
                S
              </div>

              <div>
                <p className="text-xl font-bold tracking-wide text-neutral-900 dark:text-white">
                  StudioLens
                </p>
                <p className="text-[11px] uppercase tracking-[0.26em] text-neutral-400 dark:text-neutral-500">
                  Studio Management
                </p>
              </div>
            </div>

            <p className="mt-5 max-w-sm text-sm leading-7 text-neutral-600 dark:text-neutral-400">
              Nền tảng quản lý và đặt lịch studio hiện đại, giúp khách hàng dễ dàng
              chọn dịch vụ, concept, theo dõi booking và quản lý gallery cá nhân.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
              Điều hướng
            </h3>
            <div className="mt-5 space-y-3">
              <Link
                to="/"
                className="block text-sm transition hover:translate-x-1 hover:text-primary"
              >
                Trang chủ
              </Link>
              <Link
                to="/concept"
                className="block text-sm transition hover:translate-x-1 hover:text-primary"
              >
                Concept
              </Link>
              <Link
                to="/services"
                className="block text-sm transition hover:translate-x-1 hover:text-primary"
              >
                Dịch vụ
              </Link>
              <Link
                to="/booking"
                className="block text-sm transition hover:translate-x-1 hover:text-primary"
              >
                Đặt lịch
              </Link>
            </div>
          </div>

          {/* User */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
              Cá nhân
            </h3>
            <div className="mt-5 space-y-3">
              <Link
                to="/profile"
                className="block text-sm transition hover:translate-x-1 hover:text-primary"
              >
                Hồ sơ cá nhân
              </Link>
              <Link
                to="/my-bookings"
                className="block text-sm transition hover:translate-x-1 hover:text-primary"
              >
                Booking của tôi
              </Link>
              <Link
                to="/gallery"
                className="block text-sm transition hover:translate-x-1 hover:text-primary"
              >
                Gallery cá nhân
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
              Liên hệ
            </h3>
            <div className="mt-5 space-y-3 text-sm text-neutral-600 dark:text-neutral-400">
              <p>Email: bachdung003@gmail.com@gmail.com</p>
              <p>Hotline: 036.26.28.093</p>
              <p>Địa chỉ: Vĩnh Hưng - Phú Thọ</p>
              <p>Thời gian hỗ trợ: 07:00 - 21:00</p>
            </div>
          </div>
        </div>

        <div className="mt-10 h-px bg-neutral-200 dark:bg-white/10" />

        <div className="mt-6 flex flex-col gap-3 text-sm text-neutral-500 dark:text-neutral-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 StudioLens. All rights reserved.</p>
          <p>Bạch Văn Tuấn Dũng</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer