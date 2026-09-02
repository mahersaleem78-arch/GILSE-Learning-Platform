import { Routes, Route } from 'react-router-dom'
import PublicLayout from './layouts/PublicLayout'
import AuthLayout from './layouts/AuthLayout'
import StudentLayout from './layouts/StudentLayout'
import AdminLayout from './layouts/AdminLayout'
import ProtectedRoute from './components/auth/ProtectedRoute'
import RoleProtectedRoute from './components/auth/RoleProtectedRoute'
import HomePage from './pages/HomePage'
import CoursesPage from './pages/CoursesPage'
import CourseDetailPage from './pages/CourseDetailPage'
import PaymentPage from './pages/PaymentPage'
import ReferralLandingPage from './pages/ReferralLandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import InstructorCoursesPage from './pages/InstructorCoursesPage'
import AdminPage from './pages/AdminPage'
import AdminCoursesPage from './pages/admin/AdminCoursesPage'
import AdminCourseDetailPage from './pages/admin/AdminCourseDetailPage'
import AdminPaymentsPage from './pages/admin/AdminPaymentsPage'
import AdminRewardsPage from './pages/admin/AdminRewardsPage'
import CertificatePage from './pages/CertificatePage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return <Routes>
    <Route element={<PublicLayout />}>
      <Route path="/" element={<HomePage />} />
      <Route path="/courses" element={<CoursesPage />} />
      <Route path="/courses/:id" element={<CourseDetailPage />} />
      <Route path="/certificates/:id" element={<CertificatePage />} />
      <Route path="/r/:code" element={<ReferralLandingPage />} />
    </Route>
    <Route element={<AuthLayout />}><Route path="/login" element={<LoginPage />} /><Route path="/signup" element={<SignupPage />} /></Route>
    <Route path="/dashboard" element={<ProtectedRoute><StudentLayout /></ProtectedRoute>}><Route index element={<DashboardPage />} /></Route>
    <Route path="/courses/:id/pay" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
    <Route path="/instructor/courses" element={<RoleProtectedRoute roles={['instructor']}><StudentLayout /></RoleProtectedRoute>}><Route index element={<InstructorCoursesPage />} /></Route>
    <Route path="/admin" element={<RoleProtectedRoute roles={['admin','developer']}><AdminLayout /></RoleProtectedRoute>}>
      <Route index element={<AdminPage />} /><Route path="courses" element={<AdminCoursesPage />} /><Route path="courses/:id" element={<AdminCourseDetailPage />} /><Route path="payments" element={<AdminPaymentsPage />} /><Route path="rewards" element={<AdminRewardsPage />} />
    </Route>
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
}
