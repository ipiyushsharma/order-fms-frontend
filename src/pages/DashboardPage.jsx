import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useOrders } from '../hooks/useOrders'
import { isDelayed, fmtAgo, canDo } from '../utils/helpers'
import { StatusBadge, DelayedBadge } from '../components/shared/StatusBadge'
import StatsRow from '../components/orders/StatsRow'
import { AlertTriangle, ArrowRight, Package, Clock } from 'lucide-react'
import clsx from 'clsx'

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { orders, total, loading } = useOrders()

  const stats = useMemo(() => ({
    total,
    paymentPending: orders.filter(o => o.paymentStatus !== 'Paid').length,
    delayed: orders.filter(isDelayed).length,
    dispatchPending: orders.filter(o => o.dispatchStatus === 'Pending').length,
    completed: orders.filter(o => o.dispatchStatus === 'Delivered' && o.paymentStatus === 'Paid').length,
    pendingEstimate: orders.filter(o => o.estimateSent === 'No').length,
  }), [orders, total])

  const delayed = useMemo(() => orders.filter(isDelayed).slice(0, 5), [orders])
  const recent  = useMemo(() => [...orders].slice(0, 8), [orders])

  return (
    <div className="flex flex-col h-full overflow-auto px-6 py-5">

      {/* Welcome */}
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-gray-900">
          Good {getGreeting()}, {user?.displayName?.split(' ')[0] || user?.username} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Here's what's happening with your orders today.</p>
      </div>

      <StatsRow stats={stats} loading={loading} />

      <div className="grid grid-cols-3 gap-4">

        {/* Delayed orders */}
        <div className="col-span-2 card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle size={14} className="text-red-600" />
              </div>
              <h2 className="text-sm font-semibold text-gray-900">Delayed Orders</h2>
              {stats.delayed > 0 && (
                <span className="badge badge-red">{stats.delayed}</span>
              )}
            </div>
            <button
              onClick={() => navigate('/orders?filter=delayed')}
              className="btn btn-ghost text-xs gap-1 text-brand-600 hover:text-brand-700"
            >
              View all <ArrowRight size={12} />
            </button>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({length: 3}).map((_,i) => (
                <div key={i} className="skeleton h-10 rounded-xl" />
              ))}
            </div>
          ) : delayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <span className="text-3xl mb-2">✅</span>
              <p className="text-sm font-medium text-gray-500">No delayed orders</p>
              <p className="text-xs">All orders are on track</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {delayed.map(order => (
                <div key={order.orderId} className="flex items-center gap-3 px-5 py-3 hover:bg-red-50/40 transition-colors">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-order-id">{order.orderId}</span>
                      <DelayedBadge />
                    </div>
                    <p className="text-sm font-medium text-gray-800 mt-0.5">{order.partyName}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <StatusBadge type="dispatch" value={order.dispatchStatus} />
                    <StatusBadge type="payment" value={order.paymentStatus} />
                    <span className="text-xs text-gray-400">{fmtAgo(order.orderCreatedTime)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick summary */}
        <div className="flex flex-col gap-4">
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Clock size={14} className="text-gray-400" />
              Action Required
            </h3>
            <div className="space-y-2">
              {[
                { label: 'Pending Estimates', value: stats.pendingEstimate, filter: 'pending_estimate', color: 'text-amber-600', bg: 'bg-amber-50' },
                { label: 'Payment Pending', value: stats.paymentPending, filter: 'payment_pending', color: 'text-orange-600', bg: 'bg-orange-50' },
                { label: 'Dispatch Pending', value: stats.dispatchPending, filter: 'dispatch_pending', color: 'text-blue-600', bg: 'bg-blue-50' },
              ].map(item => (
                <button
                  key={item.filter}
                  onClick={() => navigate(`/orders?filter=${item.filter}`)}
                  className={clsx('w-full flex items-center justify-between p-2.5 rounded-xl hover:opacity-80 transition-opacity', item.bg)}
                >
                  <span className="text-xs font-medium text-gray-700">{item.label}</span>
                  <span className={clsx('text-base font-semibold', item.color)}>{item.value}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="card p-4 flex-1">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Progress</h3>
            <p className="text-xs text-gray-400 mb-3">Completed vs total</p>
            {total > 0 && (
              <>
                <div className="text-2xl font-semibold text-green-700 mb-1">
                  {Math.round((stats.completed / total) * 100)}%
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(stats.completed / total) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400">{stats.completed} of {total} orders completed</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div className="card overflow-hidden mt-4">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Package size={15} className="text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900">Recent Orders</h2>
          </div>
          <button
            onClick={() => navigate('/orders')}
            className="btn btn-ghost text-xs gap-1 text-brand-600"
          >
            View all <ArrowRight size={12} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: 700 }}>
            <thead>
              <tr>
                {['Order ID', 'Party Name', 'Via', 'Payment', 'Dispatch', 'Created'].map(h => (
                  <th key={h} className="table-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({length:4}).map((_,i) => (
                    <tr key={i}><td colSpan={6} className="table-td"><div className="skeleton h-4 rounded w-3/4" /></td></tr>
                  ))
                : recent.map(order => (
                    <tr key={order.orderId} className={clsx(isDelayed(order) ? 'table-tr-delayed' : 'table-tr')}>
                      <td className="table-td">
                        <div className="flex items-center gap-1.5">
                          <span className="text-order-id">{order.orderId}</span>
                          {isDelayed(order) && <DelayedBadge />}
                        </div>
                      </td>
                      <td className="table-td font-medium text-gray-900">{order.partyName}</td>
                      <td className="table-td text-gray-500">{order.orderVia}</td>
                      <td className="table-td"><StatusBadge type="payment" value={order.paymentStatus} /></td>
                      <td className="table-td"><StatusBadge type="dispatch" value={order.dispatchStatus} /></td>
                      <td className="table-td text-gray-400 text-xs">{fmtAgo(order.orderCreatedTime)}</td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
