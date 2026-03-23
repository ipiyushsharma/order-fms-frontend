import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useMemo } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { useOrders } from './hooks/useOrders'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import OrdersPage from './pages/OrdersPage'
import LogsPage from './pages/LogsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import OrderHistoryPage from './pages/OrderHistoryPage'
import { isDelayed } from './utils/helpers'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
          <span className="text-sm text-gray-500">Loading…</span>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  return children
}

function LayoutWithStats() {
  const { orders, total } = useOrders()
  const stats = useMemo(() => ({
    total,
    delayed:         orders.filter(isDelayed).length,
    paymentPending:  orders.filter(o => o.paymentStatus !== 'Paid').length,
    pendingEstimate: orders.filter(o => o.estimateSent === 'No').length,
    dispatchPending: orders.filter(o => o.dispatchStatus === 'Pending').length,
  }), [orders, total])

  return <AppLayout stats={stats} />
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <LayoutWithStats />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="logs" element={<LogsPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="history" element={<OrderHistoryPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}