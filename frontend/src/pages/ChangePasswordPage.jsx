import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import authApi from '../api/authApi'

export default function ChangePasswordPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const forceChangePassword = location.state?.forceChangePassword || false

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const { currentPassword, newPassword, confirmPassword } = formData

    if (!currentPassword || !newPassword || !confirmPassword) {
      return toast.error('Vui lòng điền đầy đủ thông tin')
    }

    if (newPassword.length < 6) {
      return toast.error('Mật khẩu mới phải có ít nhất 6 ký tự')
    }

    if (newPassword !== confirmPassword) {
      return toast.error('Mật khẩu xác nhận không khớp')
    }

    setLoading(true)
    try {
      const res = await authApi.changePassword({
        currentPassword,
        newPassword,
      })
      toast.success(res.data.message || 'Đổi mật khẩu thành công')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đổi mật khẩu thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-[#0B0B0F]">
      <div className="w-full max-w-md rounded-3xl border border-gray-200/70 dark:border-white/10 bg-white/90 dark:bg-white/5 shadow-2xl backdrop-blur-xl p-8 sm:p-10">
        <div className="text-center mb-8">
          <div className="inline-flex rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-4">
            Bảo mật tài khoản
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Đổi mật khẩu
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {forceChangePassword
              ? 'Bạn đang dùng mật khẩu tạm thời, vui lòng đổi mật khẩu mới để tiếp tục.'
              : 'Cập nhật mật khẩu mới để tăng bảo mật cho tài khoản.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mật khẩu hiện tại
            </label>
            <input
              type="password"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              className="input"
              placeholder="Nhập mật khẩu hiện tại"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mật khẩu mới
            </label>
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              className="input"
              placeholder="Ít nhất 6 ký tự"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Xác nhận mật khẩu mới
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="input"
              placeholder="Nhập lại mật khẩu mới"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full h-12 rounded-xl font-semibold"
          >
            {loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
          </button>
        </form>
      </div>
    </div>
  )
}