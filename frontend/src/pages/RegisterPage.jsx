import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const { name, email, password, confirmPassword, phone } = formData

    if (!name || !email || !password) {
      return toast.error('Vui lòng điền đầy đủ thông tin')
    }
    if (password.length < 6) {
      return toast.error('Mật khẩu ít nhất 6 ký tự')
    }
    if (password !== confirmPassword) {
      return toast.error('Mật khẩu xác nhận không khớp')
    }

    setLoading(true)
    try {
      const res = await register({
        name,
        email,
        password,
        phone,
      })

      toast.success(res.message || 'Đăng ký thành công')
      navigate('/verify-email', {
        state: { email },
      })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đăng ký thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-[#0B0B0F]">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-black">
        <img
          src="https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1200&auto=format&fit=crop"
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
              Tạo tài khoản mới
              <br />
              và bắt đầu ngay
            </h1>
            <p className="text-gray-300 text-lg max-w-xl">
              Tham gia StudioLens để đặt lịch chụp, theo dõi booking và quản lý trải nghiệm dịch vụ chuyên nghiệp.
            </p>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-md rounded-3xl border border-gray-200/70 dark:border-white/10 bg-white/90 dark:bg-white/5 shadow-2xl backdrop-blur-xl p-8 sm:p-10">
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-3xl font-bold text-primary">StudioLens</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Lưu giữ những khoảnh khắc đáng nhớ
            </p>
          </div>

          <div className="mb-8">
            <div className="inline-flex rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-4">
              Tạo tài khoản
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Đăng ký tài khoản
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Hoàn tất thông tin để bắt đầu sử dụng StudioLens
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Họ và tên
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Nguyễn Văn A"
                className="input"
              />
            </div>

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
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Số điện thoại
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="0901234567"
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Ít nhất 6 ký tự"
                  className="input pr-12"
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

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Xác nhận mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Nhập lại mật khẩu"
                  className="input pr-12"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword((prev) => !prev)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  {showConfirmPassword ? '🙈' : '👁️'}
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
                  Đang đăng ký...
                </>
              ) : (
                'Tạo tài khoản'
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-white/10">
            <p className="text-center text-gray-500 dark:text-gray-400">
              Đã có tài khoản?{' '}
              <Link
                to="/login"
                className="text-primary font-semibold hover:underline"
              >
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}