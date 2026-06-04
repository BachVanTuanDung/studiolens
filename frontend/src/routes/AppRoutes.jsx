import { Routes, Route } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout.jsx'
import HomePage from '../pages/HomePage.jsx'
import ConceptPage from '../pages/ConceptPage.jsx'
import DiscoverPage from '../pages/DiscoverPage.jsx'
import BookingPage from '../pages/BookingPage.jsx'
import ProfilePage from '../pages/ProfilePage.jsx'
import LoginPage from '../pages/LoginPage.jsx'
import RegisterPage from '../pages/RegisterPage.jsx'
import GalleryPage from '../pages/GalleryPage.jsx'
import ProtectedRoute from '../components/common/ProtectedRoute.jsx'
import MyBookingsPage from '../pages/MyBookingsPage.jsx'

import AdminLayout from '../layouts/AdminLayout.jsx'
import AdminDashboardPage from '../pages/admin/AdminDashboardPage.jsx'
import AdminSelectedImagesPage from '../pages/admin/AdminSelectedImagesPage.jsx'
import AdminBookingsPage from '../pages/admin/AdminBookingsPage.jsx'
import AdminServicesPage from '../pages/admin/AdminServicesPage.jsx'
import AdminConceptsPage from '../pages/admin/AdminConceptsPage.jsx'
import AdminGalleriesPage from '../pages/admin/AdminGalleriesPage.jsx'
import AdminUsersPage from '../pages/admin/AdminUsersPage.jsx'
import AdminBookingCalendarPage from '../pages/admin/AdminBookingCalendarPage.jsx'

import VerifyEmailPage from '../pages/VerifyEmailPage.jsx'
import ForgotPasswordPage from '../pages/ForgotPasswordPage.jsx'
import ChangePasswordPage from '../pages/ChangePasswordPage.jsx'
import NotificationsPage from '../pages/NotificationsPage.jsx'
import PaymentSuccessPage from '../pages/PaymentSuccessPage.jsx'
import PaymentCancelPage from '../pages/PaymentCancelPage.jsx'

import AdminChatsPage from '../pages/admin/AdminChatsPage.jsx'

const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/concept" element={<ConceptPage />} />
        <Route path="/services" element={<DiscoverPage />} />

        <Route
          path="/booking"
          element={
            <ProtectedRoute>
              <BookingPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/gallery"
          element={
            <ProtectedRoute>
              <GalleryPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-bookings"
          element={
            <ProtectedRoute>
              <MyBookingsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/payment-success"
          element={
            <ProtectedRoute>
              <PaymentSuccessPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/payment-cancel"
          element={
            <ProtectedRoute>
              <PaymentCancelPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="selected-images" element={<AdminSelectedImagesPage />} />
        <Route path="bookings" element={<AdminBookingsPage />} />
        <Route path="services" element={<AdminServicesPage />} />
        <Route path="concepts" element={<AdminConceptsPage />} />
        <Route path="galleries" element={<AdminGalleriesPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="booking-calendar" element={<AdminBookingCalendarPage />} />
        <Route path="chats" element={<AdminChatsPage />} />
      </Route>

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/change-password" element={<ChangePasswordPage />} />
      
    </Routes>
  )
}

export default AppRoutes