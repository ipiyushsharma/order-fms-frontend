import { useState } from 'react'
import { useHistory } from '../hooks/useOrders'
import { useAuth } from '../context/AuthContext'
import { StatusBadge } from '../components/shared/StatusBadge'
import { getEstimateTiming } from '../utils/helpers'
import { History, Search, RefreshCw, Trash2, Eye, X } from 'lucide-react'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import { fmtAgo, fmtDate, canDo } from '../utils/helpers'
import api from '../utils/api'
import ConfirmDialog from '../components/shared/ConfirmDialog'

function TimingBadge({ timing }) {
  if (!timing) return <span className="text-gray-300 text-xs">—</span>
  if (timing === 'ontime') return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800 border border-green-200">✓ On Time</span>
  return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800 border border-red-200">✗ Late</span>
}

function DispatchIndicator({ status }) {
  if (!status) return <span className="text-gray-300 text-xs">—</span>
  if (status === 'green') return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800 border border-green-200">✓ On Time</span>
  return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800 border border-red-200">✗ Late</span>
}

// Order detail modal
function OrderDetailModal({ order, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">{order.orderId} — {order.partyName}</h2>
            <p className="text-xs text-gray-400 mt-0.5">Order Details</p>
          </div>
          <button onClick={onClose} className="btn btn-ghost p-1.5"><X size={16} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              ['Order ID',       order.orderId],
              ['Party Name',     order.partyName],
              ['Contact',        order.contactNumber],
              ['Order Via',      order.orderVia],
              ['Products',       order.productName ? order.productName.split('|').filter(p=>p.trim()).join(', ') : '—'],
              ['Payment Mode',   order.paymentMode || '—'],
              ['Payment Status', order.paymentStatus],
              ['Packing Status', order.packingStatus],
              ['Dispatch',       order.dispatchStatus],
              ['Bill Status',    order.billStatus],
              ['Bilty Status',   order.biltyStatus],
              ['Ledger',         order.ledgerUpdated],
              ['Transport',      order.transportName || '—'],
              ['Order Created By', order.orderCreatedBy || '—'],
              ['Estimate Sent By', order.estimateSentBy || '—'],
              ['Dispatched By',    order.dispatchedBy || '—'],
              ['Submitted By',     order.submittedBy],
              ['Created',          fmtDate(order.orderCreatedTime)],
              ['Status',           order.orderStatus === 'cancelled' ? 'CX Rejected' : 'Completed'],
            ].map(([label, value]) => (
              <div key={label} className="flex flex-col gap-0.5">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</span>
                <span className="text-sm text-gray-800 font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const ROLE_MSG = {
  crr:      '📋 Showing your submitted orders',
  accounts: '📋 Showing orders where estimate was sent',
  dispatch: '📋 Showing orders that were confirmed',
}

export default function OrderHistoryPage() {
  const { user }                        = useAuth()
  const { history, loading, refetch }   = useHistory()
  const [search, setSearch]             = useState('')
  const [refreshing, setRefreshing]     = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [viewOrder, setViewOrder]       = useState(null)

  const filtered = search
    ? history.filter(o =>
        o.orderId.toLowerCase().includes(search.toLowerCase()) ||
        o.partyName.toLowerCase().includes(search.toLowerCase()) ||
        (o.productName || '').toLowerCase().includes(search.toLowerCase())
      )
    : history

  async function handleRefresh() {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
    toast.success('Refreshed')
  }

  async function confirmDelete() {
    try {
      await api.delete(`/history/${deleteTarget.orderId}`)
      await refetch()
      toast.success(`${deleteTarget.orderId} permanently deleted`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed')
    } finally {
      setDeleteTarget(null)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Topbar */}
      <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center gap-3 flex-shrink-0">
        <History size={16} className="text-gray-400" />
        <div>
          <h1 className="text-base font-semibold text-gray-900">Order History</h1>
          <p className="text-xs text-gray-400">{filtered.length} orders</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-8 w-52 py-1.5" placeholder="Search orders…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button onClick={handleRefresh} disabled={refreshing} className={clsx('btn btn-ghost p-2', refreshing && 'opacity-50')}>
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Role banner */}
      <div className="mx-6 mt-4 flex-shrink-0">
        {user?.role === 'admin'
          ? <div className="px-4 py-2.5 bg-purple-50 border border-purple-100 rounded-xl text-xs text-purple-700">👑 Admin view — all orders history</div>
          : <div className="px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">{ROLE_MSG[user?.role]}</div>
        }
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse" style={{ minWidth: 1100 }}>
              <thead>
                <tr>
                  {['Order ID','Party Name','Products','Payment','Packing','Dispatch','Est. Timing','Disp. Timing','Submitted By','Created','Actions'].map(h => (
                    <th key={h} className="table-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 11 }).map((_, j) => (
                      <td key={j} className="table-td"><div className="skeleton h-4 rounded w-3/4" /></td>
                    ))}</tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="table-td text-center py-16 text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <History size={32} className="opacity-20" />
                        <p className="text-sm font-medium text-gray-500">No history yet</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map(order => {
                    const isCancelled = order.orderStatus === 'cancelled'
                    const products = (order.productName || '').split('|').filter(p => p.trim())
                    return (
                      <tr key={order.orderId} className={clsx('transition-colors', isCancelled ? 'bg-red-50/40 hover:bg-red-50' : 'bg-green-50/20 hover:bg-green-50/40')}>
                        <td className="table-td">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-order-id">{order.orderId}</span>
                            {isCancelled
                              ? <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-200 text-red-800">✗ CX Rejected</span>
                              : <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-green-200 text-green-800">✓ Completed</span>
                            }
                          </div>
                        </td>
                        <td className="table-td font-medium text-gray-900">{order.partyName}</td>
                        <td className="table-td text-gray-600 text-xs">
                          {products.length > 0 ? products.join(', ') : '—'}
                        </td>
                        <td className="table-td"><StatusBadge type="payment" value={order.paymentStatus} /></td>
                        <td className="table-td"><StatusBadge type="packing" value={order.packingStatus} /></td>
                        <td className="table-td"><StatusBadge type="dispatch" value={order.dispatchStatus} /></td>
                        <td className="table-td"><TimingBadge timing={getEstimateTiming(order)} /></td>
                        <td className="table-td"><DispatchIndicator status={order.dispatchTimingStatus} /></td>
                        <td className="table-td text-gray-500 text-xs">{order.submittedBy}</td>
                        <td className="table-td text-gray-400 text-xs">{fmtAgo(order.orderCreatedTime)}</td>
                        <td className="table-td">
                          <div className="flex items-center gap-1.5">
                            {/* View button — sabko */}
                            <button
                              onClick={() => setViewOrder(order)}
                              className="btn btn-ghost p-1.5 text-gray-500 hover:text-brand-600 hover:bg-brand-50"
                              title="View details"
                            >
                              <Eye size={13} />
                            </button>
                            {/* Clear button — sirf Admin */}
                            {canDo(user?.role, 'delete') && (
                              <button
                                onClick={() => setDeleteTarget(order)}
                                className="btn btn-ghost p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                title="Permanently delete"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {!loading && filtered.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-50 text-xs text-gray-400 flex items-center gap-3">
              <span>{filtered.length} orders</span>
              <span className="text-green-600 font-medium">✓ {filtered.filter(o => o.orderStatus === 'complete').length} completed</span>
              <span className="text-red-600 font-medium">✗ {filtered.filter(o => o.orderStatus === 'cancelled').length} rejected</span>
            </div>
          )}
        </div>
      </div>

      {/* View Modal */}
      {viewOrder && <OrderDetailModal order={viewOrder} onClose={() => setViewOrder(null)} />}

      {/* Delete Confirm */}
      {deleteTarget && (
        <ConfirmDialog
          title="Permanently Delete"
          message={`${deleteTarget.orderId} — ${deleteTarget.partyName} ko permanently delete karein? Ye wapas nahi aayega.`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
          danger={true}
        />
      )}
    </div>
  )
}