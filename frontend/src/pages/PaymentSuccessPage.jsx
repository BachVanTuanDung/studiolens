import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { verifyPayOSPayment } from '../api/bookingApi'

const PaymentSuccessPage = () => {
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)

  const orderCode = searchParams.get('orderCode')
  const status = searchParams.get('status')

  const [verifying, setVerifying] = useState(true)
  const [verified, setVerified] = useState(false)

  useEffect(() => {
    const runVerify = async () => {
      try {
        if (!orderCode) {
          setVerifying(false)
          return
        }

        await verifyPayOSPayment(orderCode)
        setVerified(true)
        toast.success('Đã xác nhận thanh toán cho booking')
      } catch (error) {
        console.error(error)
        toast.error(
          error?.response?.data?.message || 'Chưa thể xác minh thanh toán tự động'
        )
      } finally {
        setVerifying(false)
      }
    }

    runVerify()
  }, [orderCode])

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f8f5ef,transparent_35%),linear-gradient(to_bottom,#faf7f2,#f6f7fb)] px-4 py-10 dark:bg-[radial-gradient(circle_at_top,#1a1408,transparent_22%),linear-gradient(to_bottom,#09090b,#0f1117)] dark:text-white">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-[36px] border border-black/5 bg-white/90 shadow-[0_18px_50px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5">
        <div className="grid min-h-[520px] lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative overflow-hidden bg-[linear-gradient(135deg,#09090b,#171717,#2a210d)] p-8 text-white lg:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(201,168,76,0.18),transparent_35%)]" />
            <div className="relative">
              <p className="text-xs uppercase tracking-[0.35em] text-primary">
                Payment completed
              </p>

              <div className="mt-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/10 text-4xl backdrop-blur-sm">
                ✅
              </div>

              <h1 className="mt-6 text-4xl font-bold leading-tight lg:text-5xl">
                Thanh toán thành công
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-7 text-white/75">
                Giao dịch của bạn đã hoàn tất thành công trên payOS. Hệ thống đang đồng bộ
                trạng thái thanh toán với booking của bạn.
              </p>

              <div className="mt-8 space-y-4 text-sm">
                <div className="rounded-3xl border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                  <p className="text-white/60">Order code</p>
                  <p className="mt-2 text-lg font-semibold break-all">{orderCode || '--'}</p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                  <p className="text-white/60">Trạng thái trả về</p>
                  <p className="mt-2 text-lg font-semibold">{status || 'SUCCESS'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center p-8 lg:p-10">
            <div className="w-full">
              <p className="text-xs uppercase tracking-[0.25em] text-neutral-500 dark:text-neutral-400">
                Verification
              </p>
              <h2 className="mt-2 text-3xl font-bold text-neutral-900 dark:text-white">
                Xác minh trạng thái booking
              </h2>

              <p className="mt-4 text-sm leading-7 text-neutral-600 dark:text-neutral-300">
                {verifying
                  ? 'Hệ thống đang xác minh trạng thái thanh toán và cập nhật booking của bạn...'
                  : verified
                    ? 'Booking đã được cập nhật sang trạng thái đã thanh toán. Bạn có thể quay lại danh sách booking để kiểm tra.'
                    : 'Hệ thống chưa xác minh được tự động. Bạn có thể vào Booking của tôi và kiểm tra lại thủ công.'}
              </p>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-neutral-50 p-5 dark:bg-neutral-950">
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Tiến trình</p>
                  <p className="mt-2 text-lg font-semibold">
                    {verifying
                      ? 'Đang xác minh...'
                      : verified
                        ? 'Đã xác minh'
                        : 'Chưa xác minh'}
                  </p>
                </div>

                <div className="rounded-2xl bg-neutral-50 p-5 dark:bg-neutral-950">
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    Trạng thái booking
                  </p>
                  <p className="mt-2 text-lg font-semibold">
                    {verifying
                      ? 'Đang cập nhật'
                      : verified
                        ? 'Đã thanh toán'
                        : 'Cần kiểm tra lại'}
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/my-bookings"
                  className="inline-flex items-center justify-center rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-black transition hover:opacity-90"
                >
                  Xem booking của tôi
                </Link>

                <Link
                  to="/notifications"
                  className="inline-flex items-center justify-center rounded-2xl border border-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-100 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-800"
                >
                  Xem thông báo
                </Link>
              </div>

              {!verifying && !verified ? (
                <div className="mt-6 rounded-2xl border border-dashed border-yellow-300 bg-yellow-50 px-4 py-4 text-sm leading-6 text-yellow-800 dark:border-yellow-500/30 dark:bg-yellow-500/10 dark:text-yellow-300">
                  Nếu bạn thanh toán bằng app ngân hàng hoặc chưa quay lại đầy đủ từ payOS,
                  bạn vẫn có thể vào mục <strong>Booking của tôi</strong> và bấm{' '}
                  <strong>Kiểm tra thanh toán</strong>.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PaymentSuccessPage