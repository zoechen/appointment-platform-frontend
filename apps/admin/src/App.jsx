import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage.jsx'
import DashboardLayout from './pages/DashboardLayout.jsx'
import StaffListPage from './pages/StaffListPage.jsx'
import BusinessListPage from './pages/BusinessListPage.jsx'
import BusinessDetailPage from './pages/BusinessDetailPage.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Navigate to="/staff" replace />} />
          <Route path="/staff" element={<StaffListPage />} />
          <Route path="/businesses" element={<BusinessListPage />} />
          <Route path="/businesses/:id" element={<BusinessDetailPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
