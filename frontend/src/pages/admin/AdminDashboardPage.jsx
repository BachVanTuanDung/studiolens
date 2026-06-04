import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import {
  getBookingsChart,
  getDashboardStats,
  getRevenueChart,
  getBookingStatusChart,
  getPaymentMethodChart,
  getSessionChart,
  getTopServices,
  getRecentUsers,
} from '../../api/dashboardApi'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

const formatCurrency = (value) => {
  return Number(value || 0).toLocaleString('vi-VN') + 'đ'
}

const statusMap = {
  pending: {
    label: 'Chờ xác nhận',
    className:
      'bg-yellow-100 text-yellow-800 ring-1 ring-inset ring-yellow-200 dark:bg-yellow-500/15 dark:text-yellow-300 dark:ring-yellow-500/30',
  },
  confirmed: {
    label: 'Đã xác nhận',
    className:
      'bg-blue-100 text-blue-800 ring-1 ring-inset ring-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-500/30',
  },
  completed: {
    label: 'Hoàn thành',
    className:
      'bg-green-100 text-green-800 ring-1 ring-inset ring-green-200 dark:bg-green-500/15 dark:text-green-300 dark:ring-green-500/30',
  },
  cancelled: {
    label: 'Đã hủy',
    className:
      'bg-red-100 text-red-800 ring-1 ring-inset ring-red-200 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-500/30',
  },
}

const paymentStatusMap = {
  unpaid: {
    label: 'Chưa thanh toán',
    className:
      'bg-neutral-100 text-neutral-700 ring-1 ring-inset ring-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:ring-neutral-700',
  },
  pending: {
    label: 'Chờ đối soát',
    className:
      'bg-yellow-100 text-yellow-800 ring-1 ring-inset ring-yellow-200 dark:bg-yellow-500/15 dark:text-yellow-300 dark:ring-yellow-500/30',
  },
  paid: {
    label: 'Đã thanh toán',
    className:
      'bg-green-100 text-green-800 ring-1 ring-inset ring-green-200 dark:bg-green-500/15 dark:text-green-300 dark:ring-green-500/30',
  },
}

const CardShell = ({ children, className = '' }) => (
  <div
    className={`rounded-[28px] border border-neutral-200 bg-white shadow-sm transition duration-300 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900 ${className}`}
  >
    {children}
  </div>
)

const MetricCard = ({ title, value, subtitle, tone = 'neutral' }) => {
  const toneMap = {
    neutral: 'from-neutral-950 via-neutral-900 to-neutral-800 text-white',
    yellow: 'from-yellow-600 via-amber-500 to-orange-500 text-white',
    blue: 'from-blue-700 via-sky-600 to-cyan-500 text-white',
    green: 'from-green-700 via-emerald-600 to-teal-500 text-white',
    purple: 'from-violet-700 via-fuchsia-600 to-pink-500 text-white',
    slate: 'from-slate-700 via-slate-600 to-slate-500 text-white',
  }

  return (
    <div
      className={`rounded-[28px] bg-gradient-to-br p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg ${toneMap[tone]}`}
    >
      <p className="text-xs uppercase tracking-[0.25em] opacity-80">{title}</p>
      <p className="mt-3 text-3xl font-bold">{value}</p>
      <p className="mt-2 text-sm opacity-85">{subtitle}</p>
    </div>
  )
}

const InsightItem = ({ label, value, accent = 'neutral' }) => {
  const accentMap = {
    neutral: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200',
    yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/15 dark:text-yellow-300',
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300',
    green: 'bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300',
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
      <span className="text-sm text-neutral-500 dark:text-neutral-400">{label}</span>
      <span className={`rounded-full px-3 py-1 text-sm font-semibold ${accentMap[accent]}`}>
        {value}
      </span>
    </div>
  )
}

const AdminDashboardPage = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBookings: 0,
    totalServices: 0,
    totalGalleries: 0,
    totalSelections: 0,
    totalRevenue: 0,
    bookingsThisMonth: 0,
    revenueThisMonth: 0,
    totalPaidBookings: 0,
    totalCompletedBookings: 0,
    totalConfirmedBookings: 0,
    totalPendingBookings: 0,
    totalCancelledBookings: 0,
    paidRate: 0,
    completionRate: 0,
    recentBookings: [],
    recentUsers: [],
  })
  const [bookingsChart, setBookingsChart] = useState([])
  const [revenueChart, setRevenueChart] = useState([])
  const [statusChart, setStatusChart] = useState([])
  const [paymentMethodChart, setPaymentMethodChart] = useState([])
  const [sessionChart, setSessionChart] = useState([])
  const [topServices, setTopServices] = useState([])
  const [recentUsers, setRecentUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [
          statsRes,
          bookingsChartRes,
          revenueChartRes,
          statusChartRes,
          paymentMethodChartRes,
          sessionChartRes,
          topServicesRes,
          recentUsersRes,
        ] = await Promise.all([
          getDashboardStats(),
          getBookingsChart(),
          getRevenueChart(),
          getBookingStatusChart(),
          getPaymentMethodChart(),
          getSessionChart(),
          getTopServices(),
          getRecentUsers(),
        ])

        setStats(
          statsRes.data?.data || {
            totalUsers: 0,
            totalBookings: 0,
            totalServices: 0,
            totalGalleries: 0,
            totalSelections: 0,
            totalRevenue: 0,
            bookingsThisMonth: 0,
            revenueThisMonth: 0,
            totalPaidBookings: 0,
            totalCompletedBookings: 0,
            totalConfirmedBookings: 0,
            totalPendingBookings: 0,
            totalCancelledBookings: 0,
            paidRate: 0,
            completionRate: 0,
            recentBookings: [],
            recentUsers: [],
          }
        )

        setBookingsChart(bookingsChartRes.data?.data || [])
        setRevenueChart(revenueChartRes.data?.data || [])
        setStatusChart(statusChartRes.data?.data || [])
        setPaymentMethodChart(paymentMethodChartRes.data?.data || [])
        setSessionChart(sessionChartRes.data?.data || [])
        setTopServices(topServicesRes.data?.data || [])
        setRecentUsers(recentUsersRes.data?.data || [])
      } catch (error) {
        console.error(error)
        toast.error(error.response?.data?.message || 'Không thể tải dữ liệu dashboard')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const recentBookings = stats.recentBookings || []

  const cards = [
    {
      title: 'Tổng khách hàng',
      value: stats.totalUsers,
      subtitle: 'Số lượng tài khoản khách hàng đã đăng ký',
      tone: 'neutral',
    },
    {
      title: 'Booking tháng này',
      value: stats.bookingsThisMonth,
      subtitle: 'Tổng booking phát sinh trong tháng hiện tại',
      tone: 'yellow',
    },
    {
      title: 'Doanh thu tháng này',
      value: formatCurrency(stats.revenueThisMonth),
      subtitle: 'Doanh thu tạo ra trong tháng hiện tại',
      tone: 'green',
    },
    {
      title: 'Tỉ lệ đã thanh toán',
      value: `${stats.paidRate}%`,
      subtitle: 'Tỷ lệ booking đã được thanh toán',
      tone: 'blue',
    },
    {
      title: 'Tổng gallery',
      value: stats.totalGalleries,
      subtitle: 'Số gallery đang lưu trong hệ thống',
      tone: 'purple',
    },
    {
      title: 'Tỉ lệ hoàn thành',
      value: `${stats.completionRate}%`,
      subtitle: 'Tỷ lệ booking đã hoàn thành',
      tone: 'slate',
    },
  ]

  const bookingsChartData = useMemo(
    () => ({
      labels: bookingsChart.map((item) => item.label),
      datasets: [
        {
          label: 'Số booking',
          data: bookingsChart.map((item) => item.totalBookings),
          borderRadius: 12,
          barThickness: 24,
          backgroundColor: [
            '#111827',
            '#374151',
            '#4b5563',
            '#6b7280',
            '#9ca3af',
            '#ca8a04',
            '#f59e0b',
            '#fbbf24',
            '#fcd34d',
            '#fde68a',
            '#f59e0b',
            '#ca8a04',
          ],
        },
      ],
    }),
    [bookingsChart]
  )

  const revenueChartData = useMemo(
    () => ({
      labels: revenueChart.map((item) => item.label),
      datasets: [
        {
          label: 'Doanh thu',
          data: revenueChart.map((item) => item.totalRevenue),
          tension: 0.35,
          fill: true,
          borderWidth: 3,
          borderColor: '#ca8a04',
          backgroundColor: 'rgba(202, 138, 4, 0.12)',
          pointBackgroundColor: '#ca8a04',
          pointBorderColor: '#ca8a04',
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    }),
    [revenueChart]
  )

  const statusChartData = useMemo(
    () => ({
      labels: statusChart.map((item) => item.label),
      datasets: [
        {
          data: statusChart.map((item) => item.value),
          backgroundColor: ['#f59e0b', '#2563eb', '#16a34a', '#dc2626'],
          borderWidth: 0,
        },
      ],
    }),
    [statusChart]
  )

  const paymentMethodChartData = useMemo(
    () => ({
      labels: paymentMethodChart.map((item) => item.label),
      datasets: [
        {
          data: paymentMethodChart.map((item) => item.value),
          backgroundColor: ['#111827', '#ca8a04'],
          borderWidth: 0,
        },
      ],
    }),
    [paymentMethodChart]
  )

  const sessionChartData = useMemo(
    () => ({
      labels: sessionChart.map((item) => item.label),
      datasets: [
        {
          label: 'Số booking',
          data: sessionChart.map((item) => item.value),
          borderRadius: 12,
          backgroundColor: ['#fde68a', '#93c5fd', '#c4b5fd'],
        },
      ],
    }),
    [sessionChart]
  )

  const chartCommonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          boxWidth: 12,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
    },
  }

  const lineOptions = {
    ...chartCommonOptions,
    scales: {
      y: {
        ticks: {
          callback: (value) => Number(value).toLocaleString('vi-VN'),
        },
      },
    },
  }

  const barOptions = {
    ...chartCommonOptions,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 12,
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 16,
        },
      },
    },
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 dark:text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-yellow-700 dark:text-yellow-400">
            Quản trị hệ thống
          </p>

          <div className="mt-3 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h1 className="text-5xl font-bold tracking-tight">Dashboard Admin</h1>
              <p className="mt-3 max-w-3xl text-neutral-600 dark:text-neutral-300">
                Theo dõi toàn cảnh hoạt động của StudioLens: khách hàng, booking,
                doanh thu, thanh toán, hiệu suất buổi chụp và dịch vụ nổi bật theo
                giao diện trực quan hơn.
              </p>
            </div>

            <div className="inline-flex rounded-full border border-yellow-200 bg-yellow-50 px-4 py-2 text-sm font-medium text-yellow-800 dark:border-yellow-900/40 dark:bg-yellow-900/20 dark:text-yellow-300">
              Bảng điều khiển tổng hợp theo dữ liệu thực tế
            </div>
          </div>
        </div>

        {loading ? (
          <CardShell className="p-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-2xl dark:bg-neutral-800">
              📊
            </div>
            <p className="text-lg font-semibold">Đang tải dữ liệu dashboard...</p>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              Hệ thống đang tổng hợp số liệu thống kê và biểu đồ.
            </p>
          </CardShell>
        ) : (
          <>
            <div className="mb-8 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
              <CardShell className="overflow-hidden">
                <div className="grid h-full gap-0 lg:grid-cols-[1.08fr_0.92fr]">
                  <div className="bg-gradient-to-br from-neutral-950 via-neutral-900 to-black p-7 text-white">
                    <p className="text-xs uppercase tracking-[0.3em] text-yellow-400">
                      StudioLens Overview
                    </p>
                    <h2 className="mt-4 text-3xl font-bold leading-tight">
                      Điều hành studio bằng dữ liệu thay vì cảm tính.
                    </h2>
                    <p className="mt-4 max-w-xl text-sm leading-6 text-neutral-300">
                      Theo dõi số lượng booking, doanh thu, tỷ lệ hoàn thành và mức độ
                      thanh toán để tối ưu vận hành, nhân sự và kế hoạch kinh doanh.
                    </p>

                    <div className="mt-8 grid gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl bg-white/10 p-4">
                        <p className="text-sm text-neutral-300">Tổng doanh thu</p>
                        <p className="mt-2 text-2xl font-bold text-yellow-400">
                          {formatCurrency(stats.totalRevenue)}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white/10 p-4">
                        <p className="text-sm text-neutral-300">Tổng booking</p>
                        <p className="mt-2 text-2xl font-bold">{stats.totalBookings}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-7">
                    <p className="text-xs uppercase tracking-[0.25em] text-neutral-500 dark:text-neutral-400">
                      Insight nhanh
                    </p>
                    <h3 className="mt-3 text-2xl font-bold">Tình hình hiện tại</h3>

                    <div className="mt-6 space-y-3">
                      <InsightItem
                        label="Booking chờ xác nhận"
                        value={stats.totalPendingBookings}
                        accent="yellow"
                      />
                      <InsightItem
                        label="Booking đã xác nhận"
                        value={stats.totalConfirmedBookings}
                        accent="blue"
                      />
                      <InsightItem
                        label="Booking đã hoàn thành"
                        value={stats.totalCompletedBookings}
                        accent="green"
                      />
                      <InsightItem
                        label="Booking đã hủy"
                        value={stats.totalCancelledBookings}
                        accent="neutral"
                      />
                    </div>
                  </div>
                </div>
              </CardShell>

              <CardShell className="p-6">
                <p className="text-xs uppercase tracking-[0.25em] text-neutral-500 dark:text-neutral-400">
                  Trạng thái booking
                </p>
                <h3 className="mt-3 text-2xl font-bold">Phân bố tổng thể</h3>
                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
                  Tỷ lệ các trạng thái booking hiện có trong hệ thống.
                </p>

                <div className="mt-6 h-[300px]">
                  {statusChart.length === 0 ? (
                    <div className="flex h-full items-center justify-center rounded-2xl bg-neutral-50 text-center text-neutral-500 dark:bg-neutral-950 dark:text-neutral-400">
                      Chưa có dữ liệu trạng thái booking.
                    </div>
                  ) : (
                    <Doughnut data={statusChartData} options={doughnutOptions} />
                  )}
                </div>
              </CardShell>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {cards.map((card) => (
                <MetricCard
                  key={card.title}
                  title={card.title}
                  value={card.value}
                  subtitle={card.subtitle}
                  tone={card.tone}
                />
              ))}
            </div>

            <div className="mt-8 grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
              <CardShell className="p-6">
                <div className="mb-6">
                  <p className="text-xs uppercase tracking-[0.25em] text-neutral-500 dark:text-neutral-400">
                    Biểu đồ booking
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold">Booking theo tháng</h2>
                  <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
                    Theo dõi xu hướng số lượng booking theo từng tháng trong năm hiện tại.
                  </p>
                </div>

                <div className="h-[360px]">
                  {bookingsChart.length === 0 ? (
                    <div className="flex h-full items-center justify-center rounded-2xl bg-neutral-50 p-6 text-center text-neutral-500 dark:bg-neutral-950 dark:text-neutral-400">
                      Chưa có dữ liệu biểu đồ booking.
                    </div>
                  ) : (
                    <Bar data={bookingsChartData} options={barOptions} />
                  )}
                </div>
              </CardShell>

              <CardShell className="p-6">
                <div className="mb-6">
                  <p className="text-xs uppercase tracking-[0.25em] text-neutral-500 dark:text-neutral-400">
                    Biểu đồ doanh thu
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold">Doanh thu theo tháng</h2>
                  <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
                    Tổng hợp doanh thu từ các booking đã xác nhận hoặc hoàn thành.
                  </p>
                </div>

                <div className="h-[360px]">
                  {revenueChart.length === 0 ? (
                    <div className="flex h-full items-center justify-center rounded-2xl bg-neutral-50 p-6 text-center text-neutral-500 dark:bg-neutral-950 dark:text-neutral-400">
                      Chưa có dữ liệu biểu đồ doanh thu.
                    </div>
                  ) : (
                    <Line data={revenueChartData} options={lineOptions} />
                  )}
                </div>
              </CardShell>
            </div>

            <div className="mt-8 grid gap-8 xl:grid-cols-3">
              <CardShell className="p-6">
                <div className="mb-5">
                  <p className="text-xs uppercase tracking-[0.25em] text-neutral-500 dark:text-neutral-400">
                    Thanh toán
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold">Phương thức thanh toán</h3>
                </div>

                <div className="h-[280px]">
                  {paymentMethodChart.length === 0 ? (
                    <div className="flex h-full items-center justify-center rounded-2xl bg-neutral-50 text-center text-neutral-500 dark:bg-neutral-950 dark:text-neutral-400">
                      Chưa có dữ liệu thanh toán.
                    </div>
                  ) : (
                    <Doughnut data={paymentMethodChartData} options={doughnutOptions} />
                  )}
                </div>
              </CardShell>

              <CardShell className="p-6">
                <div className="mb-5">
                  <p className="text-xs uppercase tracking-[0.25em] text-neutral-500 dark:text-neutral-400">
                    Buổi chụp
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold">Phân bổ theo buổi</h3>
                </div>

                <div className="h-[280px]">
                  {sessionChart.length === 0 ? (
                    <div className="flex h-full items-center justify-center rounded-2xl bg-neutral-50 text-center text-neutral-500 dark:bg-neutral-950 dark:text-neutral-400">
                      Chưa có dữ liệu buổi chụp.
                    </div>
                  ) : (
                    <Bar data={sessionChartData} options={barOptions} />
                  )}
                </div>
              </CardShell>

              <CardShell className="p-6">
                <div className="mb-5">
                  <p className="text-xs uppercase tracking-[0.25em] text-neutral-500 dark:text-neutral-400">
                    Top dịch vụ
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold">Dịch vụ được đặt nhiều</h3>
                </div>

                <div className="space-y-3">
                  {topServices.length === 0 ? (
                    <div className="rounded-2xl bg-neutral-50 p-6 text-center text-neutral-500 dark:bg-neutral-950 dark:text-neutral-400">
                      Chưa có dữ liệu dịch vụ.
                    </div>
                  ) : (
                    topServices.map((item, index) => (
                      <div
                        key={item._id || index}
                        className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                              {item.serviceName}
                            </p>
                            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                              {item.totalBookings} booking
                            </p>
                          </div>
                          <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800 dark:bg-yellow-500/15 dark:text-yellow-300">
                            {formatCurrency(item.totalRevenue)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardShell>
            </div>

            <div className="mt-8 grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
              <CardShell className="p-6">
                <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-neutral-500 dark:text-neutral-400">
                      Booking gần đây
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold">Hoạt động mới nhất</h2>
                    <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
                      Danh sách booking mới nhất để theo dõi nhanh trạng thái và thanh toán.
                    </p>
                  </div>

                  <div className="inline-flex rounded-full bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                    {recentBookings.length} booking gần đây
                  </div>
                </div>

                {recentBookings.length === 0 ? (
                  <div className="rounded-2xl bg-neutral-50 p-8 text-center text-neutral-500 dark:bg-neutral-950 dark:text-neutral-400">
                    Chưa có booking gần đây.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentBookings.map((booking) => {
                      const statusInfo = statusMap[booking.status] || {
                        label: booking.status || 'Không rõ',
                        className:
                          'bg-neutral-100 text-neutral-700 ring-1 ring-inset ring-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:ring-neutral-700',
                      }

                      const paymentInfo = paymentStatusMap[booking.paymentStatus] || {
                        label: booking.paymentStatus || 'Không rõ',
                        className:
                          'bg-neutral-100 text-neutral-700 ring-1 ring-inset ring-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:ring-neutral-700',
                      }

                      return (
                        <div
                          key={booking._id}
                          className="rounded-3xl border border-neutral-200 bg-gradient-to-r from-white to-neutral-50 p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-neutral-800 dark:from-neutral-900 dark:to-neutral-950"
                        >
                          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                            <div>
                              <p className="text-xs uppercase tracking-[0.25em] text-yellow-700 dark:text-yellow-400">
                                {booking.bookingCode || 'BOOKING'}
                              </p>
                              <h3 className="mt-2 text-xl font-semibold text-neutral-900 dark:text-white">
                                {booking.userId?.name || '--'}
                              </h3>
                              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
                                {booking.serviceId?.name || '--'}
                              </p>
                              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                                {booking.date || '--'} • {booking.time || '--'}
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusInfo.className}`}
                              >
                                {statusInfo.label}
                              </span>
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${paymentInfo.className}`}
                              >
                                {paymentInfo.label}
                              </span>
                            </div>
                          </div>

                          <div className="mt-4 grid gap-3 md:grid-cols-3">
                            <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-neutral-900">
                              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                Giá booking
                              </p>
                              <p className="mt-2 font-semibold text-neutral-900 dark:text-white">
                                {formatCurrency(booking.totalPrice || 0)}
                              </p>
                            </div>

                            <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-neutral-900">
                              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                Email khách
                              </p>
                              <p className="mt-2 break-words font-semibold text-neutral-900 dark:text-white">
                                {booking.userId?.email || '--'}
                              </p>
                            </div>

                            <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-neutral-900">
                              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                Số điện thoại
                              </p>
                              <p className="mt-2 font-semibold text-neutral-900 dark:text-white">
                                {booking.userId?.phone || '--'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardShell>

              <CardShell className="p-6">
                <div className="mb-6 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-neutral-500 dark:text-neutral-400">
                      Khách hàng mới
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold">Tài khoản mới gần đây</h2>
                  </div>

                  <div className="inline-flex rounded-full bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                    {recentUsers.length} tài khoản
                  </div>
                </div>

                {recentUsers.length === 0 ? (
                  <div className="rounded-2xl bg-neutral-50 p-8 text-center text-neutral-500 dark:bg-neutral-950 dark:text-neutral-400">
                    Chưa có tài khoản khách hàng mới.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentUsers.map((user) => (
                      <div
                        key={user._id}
                        className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
                      >
                        <img
                          src={user.avatar || 'https://via.placeholder.com/100?text=AVT'}
                          alt={user.name}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-neutral-900 dark:text-white">
                            {user.name}
                          </p>
                          <p className="truncate text-sm text-neutral-500 dark:text-neutral-400">
                            {user.email}
                          </p>
                          <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
                            {new Date(user.createdAt).toLocaleString('vi-VN')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardShell>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default AdminDashboardPage