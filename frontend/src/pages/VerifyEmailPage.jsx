import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import authApi from '../api/authApi'

export default function VerifyEmailPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState(location.state?.email || '')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email)
    }
  }, [location.state])

  const handleVerify = async (e) => {
    e.preventDefault()

    if (!email || !code) {
      return toast.error('Vui lòng nhập email và mã xác thực')
    }

    setLoading(true)
    try {
      const res = await authApi.verifyEmail({ email, code })
      toast.success(res.data.message || 'Xác thực email thành công')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xác thực thất bại')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email) {
      return toast.error('Vui lòng nhập email trước')
    }

    setResending(true)
    try {
      const res = await authApi.resendVerificationCode({ email })
      toast.success(res.data.message || 'Đã gửi lại mã xác thực')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gửi lại mã thất bại')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-[#0B0B0F]">
      <div className="w-full max-w-md rounded-3xl border border-gray-200/70 dark:border-white/10 bg-white/90 dark:bg-white/5 shadow-2xl backdrop-blur-xl p-8 sm:p-10">
        <div className="text-center mb-8">
          <div className="inline-flex rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-4">
            Xác thực email
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Kiểm tra email của bạn
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Nhập mã xác thực đã được gửi tới email để kích hoạt tài khoản
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mã xác thực
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="input text-center tracking-[0.5em] text-lg font-semibold"
              placeholder="123456"
              maxLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full h-12 rounded-xl font-semibold"
          >
            {loading ? 'Đang xác thực...' : 'Xác thực email'}
          </button>
        </form>

        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="mt-4 w-full h-12 rounded-xl border border-primary/30 text-primary font-semibold hover:bg-primary/5 transition"
        >
          {resending ? 'Đang gửi lại...' : 'Gửi lại mã xác thực'}
        </button>

        <p className="text-center text-gray-500 dark:text-gray-400 mt-6">
          Đã xác thực xong?{' '}
          <Link to="/login" className="text-primary font-semibold hover:underline">
            Đăng nhập ngay
          </Link>
        </p>
      </div>
    </div>
  )
}