import { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { getProfile, updateProfile } from '../api/userApi'
import { getMyBookings } from '../api/bookingApi'
import { getMyGalleries } from '../api/galleryApi'
import authApi from '../api/authApi'
import { formatCurrency } from '../utils/formatCurrency'

const statusMap = {
  pending: {
    label: 'Chờ xác nhận',
    className:
      'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/20',
  },
  confirmed: {
    label: 'Đã xác nhận',
    className:
      'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-400/20',
  },
  completed: {
    label: 'Hoàn thành',
    className:
      'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/20',
  },
  cancelled: {
    label: 'Đã hủy',
    className:
      'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/20',
  },
}

const defaultAvatar =
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop'

const formatDateDisplay = (dateStr) => {
  if (!dateStr) return '--'
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('vi-VN')
}

const ProfilePage = () => {
  const fileInputRef = useRef(null)

  const [profile, setProfile] = useState(null)
  const [bookings, setBookings] = useState([])
  const [galleries, setGalleries] = useState([])

  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    avatar: '',
    darkMode: false,
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, bookingRes, galleryRes] = await Promise.all([
          getProfile(),
          getMyBookings(),
          getMyGalleries(),
        ])

        const user = profileRes.data?.data || profileRes.data?.user || null
        setProfile(user)

        setForm({
          name: user?.name || '',
          phone: user?.phone || '',
          address: user?.address || '',
          avatar: user?.avatar || '',
          darkMode: user?.darkMode || false,
        })

        setBookings(bookingRes.data?.bookings || [])
        setGalleries(galleryRes.data?.data || [])
      } catch (error) {
        console.error(error)
        toast.error('Không thể tải hồ sơ người dùng')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const upcomingBookings = useMemo(() => {
    return bookings
      .filter((b) => ['pending', 'confirmed'].includes(b.status))
      .slice(0, 3)
  }, [bookings])

  const galleryPreviewImages = useMemo(() => {
    return galleries.slice(0, 4).flatMap((gallery) =>
      (gallery.images || []).slice(0, 1).map((img, index) => ({
        id: `${gallery._id}-${index}`,
        url: img.url,
        title: gallery.title,
      }))
    )
  }, [galleries])

  const totalSpent = useMemo(() => {
    return bookings.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0)
  }, [bookings])

  const completedBookings = useMemo(() => {
    return bookings.filter((b) => b.status === 'completed').length
  }, [bookings])

  const joinedDate = useMemo(() => {
    return formatDateDisplay(profile?.createdAt)
  }, [profile])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleAvatarUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh hợp lệ')
      return
    }

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

    if (!cloudName || !uploadPreset) {
      toast.error('Thiếu cấu hình Cloudinary')
      return
    }

    try {
      setUploadingAvatar(true)

      const data = new FormData()
      data.append('file', file)
      data.append('upload_preset', uploadPreset)
      data.append('folder', 'studiolens/avatars')

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: data,
        }
      )

      const result = await res.json()

      if (!res.ok || !result.secure_url) {
        throw new Error(result.error?.message || 'Upload avatar thất bại')
      }

      setForm((prev) => ({
        ...prev,
        avatar: result.secure_url,
      }))

      toast.success('Tải avatar lên thành công')
    } catch (error) {
      console.error(error)
      toast.error(error.message || 'Không thể tải avatar lên')
    } finally {
      setUploadingAvatar(false)
      e.target.value = ''
    }
  }

  const handleSubmitProfile = async (e) => {
    e.preventDefault()

    try {
      setSavingProfile(true)
      const res = await updateProfile(form)
      const updatedUser = res.data?.user || res.data?.data

      setProfile(updatedUser)
      setForm({
        name: updatedUser?.name || '',
        phone: updatedUser?.phone || '',
        address: updatedUser?.address || '',
        avatar: updatedUser?.avatar || '',
        darkMode: updatedUser?.darkMode || false,
      })

      const savedUser = localStorage.getItem('user')
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser)
        localStorage.setItem(
          'user',
          JSON.stringify({
            ...parsedUser,
            ...updatedUser,
          })
        )
      }

      if (typeof updatedUser?.darkMode === 'boolean') {
        if (updatedUser.darkMode) {
          document.documentElement.classList.add('dark')
          localStorage.setItem('theme', 'dark')
        } else {
          document.documentElement.classList.remove('dark')
          localStorage.setItem('theme', 'light')
        }
      }

      toast.success('Cập nhật hồ sơ thành công')
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.message || 'Cập nhật thất bại')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleSubmitPassword = async (e) => {
    e.preventDefault()

    const { currentPassword, newPassword, confirmPassword } = passwordForm

    if (!currentPassword || !newPassword || !confirmPassword) {
      return toast.error('Vui lòng nhập đầy đủ thông tin mật khẩu')
    }

    if (newPassword.length < 6) {
      return toast.error('Mật khẩu mới phải có ít nhất 6 ký tự')
    }

    if (newPassword !== confirmPassword) {
      return toast.error('Mật khẩu xác nhận không khớp')
    }

    try {
      setChangingPassword(true)

      await authApi.changePassword({
        currentPassword,
        newPassword,
      })

      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })

      toast.success('Đổi mật khẩu thành công')
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.message || 'Đổi mật khẩu thất bại')
    } finally {
      setChangingPassword(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] bg-neutral-50 dark:bg-[#09090B]">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="animate-pulse space-y-6">
            <div className="h-52 rounded-[28px] bg-white shadow-sm dark:bg-neutral-900" />
            <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr]">
              <div className="space-y-6">
                <div className="h-80 rounded-[28px] bg-white shadow-sm dark:bg-neutral-900" />
                <div className="h-80 rounded-[28px] bg-white shadow-sm dark:bg-neutral-900" />
              </div>
              <div className="space-y-6">
                <div className="h-56 rounded-[28px] bg-white shadow-sm dark:bg-neutral-900" />
                <div className="h-72 rounded-[28px] bg-white shadow-sm dark:bg-neutral-900" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f8f5ef,transparent_35%),linear-gradient(to_bottom,#faf7f2,#f6f7fb)] dark:bg-[radial-gradient(circle_at_top,#1a1408,transparent_22%),linear-gradient(to_bottom,#09090b,#0f1117)] dark:text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="mb-8 overflow-hidden rounded-[32px] border border-white/60 bg-white/80 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
          <div className="relative overflow-hidden px-6 py-8 sm:px-8 sm:py-10">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(201,168,76,0.18),rgba(255,255,255,0.05),rgba(0,0,0,0))] dark:bg-[linear-gradient(135deg,rgba(201,168,76,0.22),rgba(255,255,255,0.02),rgba(0,0,0,0))]" />
            <div className="relative flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-col gap-6 md:flex-row md:items-center">
                <div className="relative group">
                  <img
                    src={form.avatar || defaultAvatar}
                    alt={profile?.name || 'User Avatar'}
                    onError={(e) => {
                      e.currentTarget.src = defaultAvatar
                    }}
                    className="h-28 w-28 rounded-[24px] object-cover ring-4 ring-white/80 shadow-xl transition duration-300 group-hover:scale-[1.02] dark:ring-white/10 sm:h-32 sm:w-32"
                  />

                  <button
                    type="button"
                    onClick={handleAvatarUploadClick}
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black px-4 py-2 text-xs font-semibold text-white shadow-lg transition hover:scale-105 dark:bg-primary dark:text-black"
                  >
                    {uploadingAvatar ? 'Đang tải...' : 'Đổi ảnh'}
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarFileChange}
                  />
                </div>

                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold tracking-wide text-primary">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    Hồ sơ thành viên
                  </div>

                  <h1 className="mt-4 text-3xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-4xl">
                    {profile?.name || 'Người dùng StudioLens'}
                  </h1>

                  <p className="mt-2 text-base text-neutral-600 dark:text-neutral-300">
                    {profile?.email}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-3 text-sm text-neutral-600 dark:text-neutral-300">
                    <span className="rounded-full bg-black/5 px-3 py-1.5 dark:bg-white/10">
                      Thành viên từ {joinedDate}
                    </span>
                    <span className="rounded-full bg-black/5 px-3 py-1.5 dark:bg-white/10">
                      {profile?.isActive ? 'Tài khoản đang hoạt động' : 'Tài khoản tạm khóa'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-2xl border border-black/5 bg-white/80 px-5 py-4 text-center shadow-sm dark:border-white/10 dark:bg-white/5">
                  <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                    {bookings.length}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">
                    Booking
                  </p>
                </div>

                <div className="rounded-2xl border border-black/5 bg-white/80 px-5 py-4 text-center shadow-sm dark:border-white/10 dark:bg-white/5">
                  <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                    {completedBookings}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">
                    Hoàn thành
                  </p>
                </div>

                <div className="rounded-2xl border border-black/5 bg-white/80 px-5 py-4 text-center shadow-sm dark:border-white/10 dark:bg-white/5">
                  <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                    {galleries.length}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">
                    Gallery
                  </p>
                </div>

                <div className="rounded-2xl border border-black/5 bg-white/80 px-5 py-4 text-center shadow-sm dark:border-white/10 dark:bg-white/5">
                  <p className="text-xl font-bold text-neutral-900 dark:text-white">
                    {formatCurrency(totalSpent)}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">
                    Đã chi
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr]">
          <div className="space-y-6">
            <form
              onSubmit={handleSubmitProfile}
              className="group rounded-[28px] border border-black/5 bg-white/85 p-6 shadow-[0_12px_40px_rgba(15,23,42,0.05)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-[0_18px_50px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5 sm:p-8"
            >
              <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
                    Personal information
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">
                    Thông tin cá nhân
                  </h2>
                  <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                    Cập nhật hồ sơ để trải nghiệm đặt lịch và làm việc với studio thuận tiện hơn.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAvatarUploadClick}
                  className="inline-flex items-center justify-center rounded-xl border border-primary/25 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition hover:scale-[1.02] hover:bg-primary/15"
                >
                  {uploadingAvatar ? 'Đang upload avatar...' : 'Upload avatar từ máy'}
                </button>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Họ và tên
                  </label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Họ và tên"
                    className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-neutral-400 focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-white/10 dark:bg-neutral-950/70 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Email
                  </label>
                  <input
                    value={profile?.email || ''}
                    disabled
                    className="w-full rounded-2xl border border-neutral-200 bg-neutral-100 px-4 py-3.5 text-sm text-neutral-500 outline-none dark:border-white/10 dark:bg-white/5 dark:text-neutral-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Số điện thoại
                  </label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Số điện thoại"
                    className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-neutral-400 focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-white/10 dark:bg-neutral-950/70 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Địa chỉ
                  </label>
                  <input
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Địa chỉ"
                    className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-neutral-400 focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-white/10 dark:bg-neutral-950/70 dark:text-white"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Link avatar
                  </label>
                  <input
                    name="avatar"
                    value={form.avatar}
                    onChange={handleChange}
                    placeholder="Link avatar hoặc upload từ máy"
                    className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-neutral-400 focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-white/10 dark:bg-neutral-950/70 dark:text-white"
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-4 rounded-2xl bg-neutral-50 p-4 dark:bg-white/5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-neutral-900 dark:text-white">
                    Giao diện tối
                  </p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    Bật dark mode để giao diện dịu mắt và hiện đại hơn.
                  </p>
                </div>

                <label className="inline-flex cursor-pointer items-center gap-3">
                  <span className="text-sm text-neutral-600 dark:text-neutral-300">
                    {form.darkMode ? 'Đang bật' : 'Đang tắt'}
                  </span>
                  <input
                    type="checkbox"
                    name="darkMode"
                    checked={form.darkMode}
                    onChange={handleChange}
                    className="h-5 w-5 rounded border-neutral-300 text-primary focus:ring-primary"
                  />
                </label>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={savingProfile || uploadingAvatar}
                  className="inline-flex items-center justify-center rounded-2xl bg-black px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 dark:bg-primary dark:text-black dark:shadow-primary/20"
                >
                  {savingProfile ? 'Đang lưu hồ sơ...' : 'Lưu thay đổi'}
                </button>

                <button
                  type="button"
                  onClick={handleAvatarUploadClick}
                  disabled={uploadingAvatar}
                  className="inline-flex items-center justify-center rounded-2xl border border-neutral-200 bg-white px-6 py-3.5 text-sm font-semibold text-neutral-800 transition hover:-translate-y-0.5 hover:border-primary hover:text-primary dark:border-white/10 dark:bg-white/5 dark:text-white"
                >
                  {uploadingAvatar ? 'Đang tải ảnh...' : 'Chọn ảnh từ máy'}
                </button>
              </div>
            </form>

            <form
              onSubmit={handleSubmitPassword}
              className="group rounded-[28px] border border-black/5 bg-white/85 p-6 shadow-[0_12px_40px_rgba(15,23,42,0.05)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-[0_18px_50px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5 sm:p-8"
            >
              <div className="mb-8">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
                  Security
                </p>
                <h2 className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">
                  Đổi mật khẩu
                </h2>
                <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                  Tăng bảo mật cho tài khoản của bạn bằng cách cập nhật mật khẩu mới.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Mật khẩu hiện tại
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Nhập mật khẩu hiện tại"
                    className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-neutral-400 focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-white/10 dark:bg-neutral-950/70 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Mật khẩu mới
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Ít nhất 6 ký tự"
                    className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-neutral-400 focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-white/10 dark:bg-neutral-950/70 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Xác nhận mật khẩu mới
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Nhập lại mật khẩu mới"
                    className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-neutral-400 focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-white/10 dark:bg-neutral-950/70 dark:text-white"
                  />
                </div>
              </div>

              <div className="mt-8">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-primary to-yellow-400 px-6 py-3.5 text-sm font-semibold text-black shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {changingPassword ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
                </button>
              </div>
            </form>

            <div className="rounded-[28px] border border-black/5 bg-white/85 p-6 shadow-[0_12px_40px_rgba(15,23,42,0.05)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5 sm:p-8">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
                    Booking history
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">
                    Lịch sử lịch hẹn
                  </h2>
                </div>
              </div>

              {bookings.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-6 py-10 text-center text-neutral-500 dark:border-white/10 dark:bg-white/5 dark:text-neutral-400">
                  Bạn chưa có booking nào.
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.slice(0, 5).map((booking) => {
                    const statusInfo = statusMap[booking.status] || {
                      label: booking.status || 'Không rõ',
                      className:
                        'bg-neutral-100 text-neutral-700 ring-1 ring-inset ring-neutral-200 dark:bg-white/10 dark:text-neutral-300 dark:ring-white/10',
                    }

                    return (
                      <div
                        key={booking._id}
                        className="group flex flex-col gap-4 rounded-3xl border border-neutral-200/80 bg-white px-5 py-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-neutral-950/40 md:flex-row md:items-center md:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="text-lg font-semibold text-neutral-900 dark:text-white">
                            {booking.serviceName || 'Dịch vụ chụp ảnh'}
                          </p>
                          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                            {formatDateDisplay(booking.date)} • {booking.time}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <span className="rounded-full px-3 py-1.5 text-xs font-semibold">
                            <span className={`rounded-full px-3 py-1.5 ${statusInfo.className}`}>
                              {statusInfo.label}
                            </span>
                          </span>

                          <div className="rounded-2xl bg-neutral-50 px-4 py-2 text-sm font-semibold text-primary dark:bg-white/5">
                            {formatCurrency(booking.totalPrice || 0)}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="overflow-hidden rounded-[28px] border border-black/5 bg-[linear-gradient(135deg,#111111,#1f1f1f,#29210d)] p-6 text-white shadow-[0_14px_45px_rgba(0,0,0,0.18)] dark:border-white/10 sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/90">
                Upcoming
              </p>
              <h3 className="mt-2 text-2xl font-bold">Lịch hẹn sắp tới</h3>

              {upcomingBookings.length === 0 ? (
                <p className="mt-5 text-sm text-white/70">
                  Hiện chưa có lịch hẹn sắp tới.
                </p>
              ) : (
                <div className="mt-5 space-y-4">
                  {upcomingBookings.map((booking, index) => (
                    <div
                      key={booking._id}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition hover:bg-white/[0.08]"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                          Lịch #{index + 1}
                        </span>
                        <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                      </div>
                      <p className="font-semibold">{booking.serviceName}</p>
                      <p className="mt-1 text-sm text-white/70">
                        {formatDateDisplay(booking.date)} • {booking.time}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-[28px] border border-black/5 bg-white/85 p-6 shadow-[0_12px_40px_rgba(15,23,42,0.05)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5 sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
                Recent gallery
              </p>
              <h3 className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">
                Gallery gần đây
              </h3>

              {galleryPreviewImages.length === 0 ? (
                <div className="mt-5 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-6 py-10 text-center text-neutral-500 dark:border-white/10 dark:bg-white/5 dark:text-neutral-400">
                  Chưa có ảnh gallery.
                </div>
              ) : (
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {galleryPreviewImages.map((item) => (
                    <div
                      key={item.id}
                      className="group relative overflow-hidden rounded-2xl"
                    >
                      <img
                        src={item.url}
                        alt={item.title}
                        onError={(e) => {
                          e.currentTarget.src =
                            'https://via.placeholder.com/400x300?text=No+Image'
                        }}
                        className="h-36 w-full object-cover transition duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent p-3">
                        <p className="line-clamp-1 text-xs font-medium text-white">
                          {item.title}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-[28px] border border-black/5 bg-white/85 p-6 shadow-[0_12px_40px_rgba(15,23,42,0.05)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5 sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
                Account summary
              </p>
              <h3 className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">
                Tóm tắt tài khoản
              </h3>

              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between rounded-2xl bg-neutral-50 px-4 py-4 dark:bg-white/5">
                  <span className="text-sm text-neutral-600 dark:text-neutral-300">
                    Họ tên
                  </span>
                  <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                    {profile?.name || '--'}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-neutral-50 px-4 py-4 dark:bg-white/5">
                  <span className="text-sm text-neutral-600 dark:text-neutral-300">
                    Số điện thoại
                  </span>
                  <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                    {profile?.phone || '--'}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-neutral-50 px-4 py-4 dark:bg-white/5">
                  <span className="text-sm text-neutral-600 dark:text-neutral-300">
                    Địa chỉ
                  </span>
                  <span className="max-w-[180px] truncate text-sm font-semibold text-neutral-900 dark:text-white">
                    {profile?.address || '--'}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-neutral-50 px-4 py-4 dark:bg-white/5">
                  <span className="text-sm text-neutral-600 dark:text-neutral-300">
                    Chủ đề giao diện
                  </span>
                  <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                    {form.darkMode ? 'Dark mode' : 'Light mode'}
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage