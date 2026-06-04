import { Link, useLocation } from 'react-router-dom'

const PaymentCancelPage = () => {
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)

  const orderCode = searchParams.get('orderCode')

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f8f5ef,transparent_35%),linear-gradient(to_bottom,#faf7f2,#f6f7fb)] px-4 py-10 dark:bg-[radial-gradient(circle_at_top,#1a1408,transparent_22%),linear-gradient(to_bottom,#09090b,#0f1117)] dark:text-white">
      <div className="mx-auto max-w-3xl rounded-[36px] border border-black/5 bg-white/90 p-8 shadow-[0_18px_50px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-4xl dark:bg-amber-500/15">
          ⚠️
        </div>

        <h1 className="mt-6 text-center text-4xl font-bold text-neutral-900 dark:text-white">
          Bạn đã hủy thanh toán
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-center text-neutral-600 dark:text-neutral-300">
          Giao dịch chưa được hoàn tất. Bạn có thể quay lại trang booking của mình để mở lại link thanh toán bất cứ lúc nào.
        </p>

        <div className="mt-8 rounded-2xl bg-neutral-50 p-5 dark:bg-neutral-950">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Order code</p>
          <p className="mt-2 text-lg font-semibold">{orderCode || '--'}</p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/my-bookings"
            className="inline-flex items-center justify-center rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-black transition hover:opacity-90"
          >
            Quay lại booking của tôi
          </Link>

          <Link
            to="/booking"
            className="inline-flex items-center justify-center rounded-2xl border border-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-100 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-800"
          >
            Đặt lịch mới
          </Link>
        </div>
      </div>
    </div>
  )
}

export default PaymentCancelPage