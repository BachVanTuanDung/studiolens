import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [formData, setFormData] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.email || !formData.password) {
      return toast.error('Vui lòng điền đầy đủ thông tin')
    }

    setLoading(true)
    try {
      const result = await login(formData.email, formData.password)

      toast.success('Đăng nhập thành công!')

      if (result.mustChangePassword) {
        navigate('/change-password', {
          state: { forceChangePassword: true },
        })
        return
      }

      navigate(result.user.role === 'admin' ? '/admin' : '/')
    } catch (err) {
      const data = err.response?.data

      if (data?.needsEmailVerification) {
        toast.error('Tài khoản chưa xác thực email')
        navigate('/verify-email', {
          state: { email: data.email },
        })
        return
      }

      toast.error(data?.message || 'Đăng nhập thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-[#0B0B0F]">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-black">
        <img
          src="https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=1200&auto=format&fit=crop"
          alt="Studio"
          className="w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-black via-black/60 to-primary/20" />
        <div className="absolute inset-0 p-12 flex flex-col justify-between">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/10 px-4 py-2 backdrop-blur-md text-white w-fit">
            <span className="h-2 w-2 rounded-full bg-primary" />
            StudioLens
          </div>

          <div>
            <h1 className="text-white text-5xl font-bold leading-tight mb-4">
              Quản lý studio
              <br />
              hiện đại và chuyên nghiệp
            </h1>
            <p className="text-gray-300 text-lg max-w-xl">
              Đăng nhập để tiếp tục quản lý booking, gallery, thanh toán và trải nghiệm dịch vụ chụp ảnh mượt mà hơn.
            </p>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-md rounded-3xl border border-gray-200/70 dark:border-white/10 bg-white/90 dark:bg-white/5 shadow-2xl backdrop-blur-xl p-8 sm:p-10">
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-3xl font-bold text-primary">StudioLens</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Hệ thống quản lý studio chuyên nghiệp
            </p>
          </div>

          <div className="mb-8">
            <div className="inline-flex rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-4">
              Đăng nhập hệ thống
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Chào mừng trở lại
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Đăng nhập để tiếp tục với tài khoản của bạn
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                className="input"
                autoComplete="email"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Mật khẩu
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Quên mật khẩu?
                </Link>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="input pr-12"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full h-12 flex items-center justify-center gap-2 rounded-xl text-base font-semibold shadow-lg shadow-primary/20"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Đang đăng nhập...
                </>
              ) : (
                'Đăng nhập'
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-white/10">
            <p className="text-center text-gray-500 dark:text-gray-400">
              Chưa có tài khoản?{' '}
              <Link
                to="/register"
                className="text-primary font-semibold hover:underline"
              >
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}