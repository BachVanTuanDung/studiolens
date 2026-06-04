import { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import authApi from '../api/authApi'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email) {
      return toast.error('Vui lòng nhập email')
    }

    setLoading(true)
    try {
      const res = await authApi.forgotPassword({ email })
      toast.success(res.data.message || 'Mật khẩu tạm thời đã được gửi về email')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gửi yêu cầu thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-[#0B0B0F]">
      <div className="w-full max-w-md rounded-3xl border border-gray-200/70 dark:border-white/10 bg-white/90 dark:bg-white/5 shadow-2xl backdrop-blur-xl p-8 sm:p-10">
        <div className="text-center mb-8">
          <div className="inline-flex rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-4">
            Khôi phục mật khẩu
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Quên mật khẩu?
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Nhập email để nhận mật khẩu tạm thời mới
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
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

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full h-12 rounded-xl font-semibold"
          >
            {loading ? 'Đang gửi...' : 'Gửi mật khẩu tạm thời'}
          </button>
        </form>

        <p className="text-center text-gray-500 dark:text-gray-400 mt-6">
          Đã nhớ mật khẩu?{' '}
          <Link to="/login" className="text-primary font-semibold hover:underline">
            Quay lại đăng nhập
          </Link>
        </p>
      </div>
    </div>
  )
}