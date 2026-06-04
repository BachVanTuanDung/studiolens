import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  deleteUserByAdmin,
  searchUsers,
  updateUserByAdmin,
} from '../../api/userApi'

const roleOptions = ['all', 'user', 'admin']
const statusOptions = ['all', 'active', 'inactive']

const roleBadgeMap = {
  admin:
    'bg-purple-100 text-purple-800 ring-1 ring-inset ring-purple-200 dark:bg-purple-500/15 dark:text-purple-300 dark:ring-purple-500/30',
  user:
    'bg-neutral-100 text-neutral-700 ring-1 ring-inset ring-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:ring-neutral-700',
}

const statusBadgeMap = {
  active:
    'bg-green-100 text-green-800 ring-1 ring-inset ring-green-200 dark:bg-green-500/15 dark:text-green-300 dark:ring-green-500/30',
  inactive:
    'bg-red-100 text-red-800 ring-1 ring-inset ring-red-200 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-500/30',
}

const StatCard = ({ title, value, tone = 'neutral' }) => {
  const toneMap = {
    neutral: 'from-neutral-950 via-neutral-900 to-neutral-800 text-white',
    yellow: 'from-yellow-600 via-amber-500 to-orange-500 text-white',
    blue: 'from-blue-700 via-sky-600 to-cyan-500 text-white',
    green: 'from-green-700 via-emerald-600 to-teal-500 text-white',
  }

  return (
    <div
      className={`rounded-[28px] bg-gradient-to-br p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg ${toneMap[tone]}`}
    >
      <p className="text-xs uppercase tracking-[0.25em] opacity-80">{title}</p>
      <p className="mt-3 text-3xl font-bold">{value}</p>
    </div>
  )
}

const Field = ({ label, children }) => (
  <div>
    <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
      {label}
    </label>
    {children}
  </div>
)

const getAvatarFallback = (name = '') => {
  return (name.trim().charAt(0) || 'U').toUpperCase()
}

const AdminUsersPage = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState('')
  const [saving, setSaving] = useState(false)

  const [searchKeyword, setSearchKeyword] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await searchUsers()
      setUsers(res.data?.data || res.data?.users || [])
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.message || 'Không thể tải danh sách user')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const stats = useMemo(() => {
    const total = users.length
    const admins = users.filter((user) => user.role === 'admin').length
    const active = users.filter((user) => user.isActive).length
    const inactive = users.filter((user) => !user.isActive).length

    return { total, admins, active, inactive }
  }, [users])

  const filteredUsers = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase()

    return users.filter((user) => {
      const matchesKeyword =
        !keyword ||
        user.name?.toLowerCase().includes(keyword) ||
        user.email?.toLowerCase().includes(keyword) ||
        user.phone?.toLowerCase().includes(keyword) ||
        user.address?.toLowerCase().includes(keyword)

      const matchesRole = roleFilter === 'all' ? true : user.role === roleFilter

      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'active'
          ? user.isActive
          : !user.isActive

      return matchesKeyword && matchesRole && matchesStatus
    })
  }, [users, searchKeyword, roleFilter, statusFilter])

  const handleChangeField = (id, field, value) => {
    setUsers((prev) =>
      prev.map((user) =>
        user._id === id
          ? {
              ...user,
              [field]: value,
            }
          : user
      )
    )
  }

  const handleSaveUser = async (user) => {
    try {
      setSaving(true)

      const payload = {
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        avatar: user.avatar,
        role: user.role,
        isActive: user.isActive,
      }

      const res = await updateUserByAdmin(user._id, payload)
      const updatedUser = res.data?.data

      setUsers((prev) =>
        prev.map((item) => (item._id === user._id ? updatedUser : item))
      )

      setEditingId('')
      toast.success('Cập nhật user thành công')
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.message || 'Cập nhật user thất bại')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteUser = async (id) => {
    const confirmed = window.confirm('Bạn có chắc muốn xóa user này không?')
    if (!confirmed) return

    try {
      await deleteUserByAdmin(id)
      setUsers((prev) => prev.filter((item) => item._id !== id))
      toast.success('Xóa user thành công')
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.message || 'Xóa user thất bại')
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 dark:text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-yellow-700 dark:text-yellow-400">
            Quản lý người dùng
          </p>
          <div className="mt-3 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h1 className="text-5xl font-bold tracking-tight">Danh sách người dùng</h1>
              <p className="mt-3 max-w-3xl text-neutral-600 dark:text-neutral-300">
                Quản lý tài khoản, avatar, phân quyền và trạng thái hoạt động của người dùng
                theo dạng danh sách gọn, đẹp và dễ thao tác hơn.
              </p>
            </div>

            <div className="inline-flex rounded-full border border-yellow-200 bg-yellow-50 px-4 py-2 text-sm font-medium text-yellow-800 dark:border-yellow-900/40 dark:bg-yellow-900/20 dark:text-yellow-300">
              User list manager
            </div>
          </div>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Tổng người dùng" value={stats.total} tone="neutral" />
          <StatCard title="Tài khoản admin" value={stats.admins} tone="yellow" />
          <StatCard title="Đang hoạt động" value={stats.active} tone="green" />
          <StatCard title="Đã khóa" value={stats.inactive} tone="blue" />
        </div>

        <div className="mb-6 rounded-[28px] border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                Bộ lọc nhanh
              </h2>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                Tìm theo tên, email, số điện thoại và lọc theo role hoặc trạng thái tài khoản.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <input
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Tìm theo tên, email, SĐT..."
                className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm transition focus:border-yellow-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
              />

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm transition focus:border-yellow-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
              >
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {role === 'all' ? 'Tất cả role' : role}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm transition focus:border-yellow-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status === 'all'
                      ? 'Tất cả trạng thái'
                      : status === 'active'
                      ? 'Hoạt động'
                      : 'Đã khóa'}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => {
                  setSearchKeyword('')
                  setRoleFilter('all')
                  setStatusFilter('all')
                }}
                className="rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-semibold transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
              >
                Đặt lại bộ lọc
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-[28px] border bg-white p-10 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:text-white">
            Đang tải danh sách người dùng...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="rounded-[28px] border bg-white p-10 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:text-white">
            Không có người dùng phù hợp.
          </div>
        ) : (
          <div className="overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {filteredUsers.map((user) => {
                const isEditing = editingId === user._id
                const roleClass = roleBadgeMap[user.role] || roleBadgeMap.user
                const statusClass = user.isActive
                  ? statusBadgeMap.active
                  : statusBadgeMap.inactive

                return (
                  <div key={user._id} className="p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.name || 'avatar'}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-lg font-bold text-neutral-500 dark:text-neutral-300">
                              {getAvatarFallback(user.name)}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-lg font-semibold text-neutral-900 dark:text-white">
                              {user.name || '--'}
                            </h3>

                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${roleClass}`}
                            >
                              {user.role}
                            </span>

                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}
                            >
                              {user.isActive ? 'Hoạt động' : 'Đã khóa'}
                            </span>
                          </div>

                          <div className="mt-2 flex flex-col gap-1 text-sm text-neutral-500 dark:text-neutral-400 md:flex-row md:flex-wrap md:gap-x-6">
                            <span className="truncate">{user.email || '--'}</span>
                            <span>{user.phone || '--'}</span>
                            <span className="truncate">{user.address || '--'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => handleSaveUser(user)}
                              disabled={saving}
                              className="rounded-2xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-60 dark:bg-yellow-700 dark:hover:bg-yellow-800"
                            >
                              {saving ? 'Đang lưu...' : 'Lưu'}
                            </button>

                            <button
                              onClick={() => {
                                setEditingId('')
                                fetchUsers()
                              }}
                              className="rounded-2xl border border-neutral-200 px-4 py-2.5 text-sm font-semibold transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                            >
                              Hủy
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setEditingId(user._id)}
                              className="rounded-2xl border border-neutral-200 px-4 py-2.5 text-sm font-semibold transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                            >
                              Sửa
                            </button>

                            <button
                              onClick={() => handleDeleteUser(user._id)}
                              className="rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
                            >
                              Xóa
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="mt-5 grid gap-4 rounded-3xl border border-neutral-200 bg-neutral-50 p-5 dark:border-neutral-800 dark:bg-neutral-950 md:grid-cols-2 xl:grid-cols-3">
                        <Field label="Tên">
                          <input
                            value={user.name || ''}
                            onChange={(e) => handleChangeField(user._id, 'name', e.target.value)}
                            className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                          />
                        </Field>

                        <Field label="Email">
                          <input
                            value={user.email || ''}
                            onChange={(e) => handleChangeField(user._id, 'email', e.target.value)}
                            className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                          />
                        </Field>

                        <Field label="Số điện thoại">
                          <input
                            value={user.phone || ''}
                            onChange={(e) => handleChangeField(user._id, 'phone', e.target.value)}
                            className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                          />
                        </Field>

                        <Field label="Địa chỉ">
                          <input
                            value={user.address || ''}
                            onChange={(e) => handleChangeField(user._id, 'address', e.target.value)}
                            className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                          />
                        </Field>

                        <Field label="Avatar URL">
                          <input
                            value={user.avatar || ''}
                            onChange={(e) => handleChangeField(user._id, 'avatar', e.target.value)}
                            className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                          />
                        </Field>

                        <Field label="Role">
                          <select
                            value={user.role || 'user'}
                            onChange={(e) => handleChangeField(user._id, 'role', e.target.value)}
                            className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                          >
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                          </select>
                        </Field>

                        <Field label="Trạng thái">
                          <select
                            value={String(user.isActive)}
                            onChange={(e) =>
                              handleChangeField(user._id, 'isActive', e.target.value === 'true')
                            }
                            className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                          >
                            <option value="true">Hoạt động</option>
                            <option value="false">Đã khóa</option>
                          </select>
                        </Field>
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminUsersPage