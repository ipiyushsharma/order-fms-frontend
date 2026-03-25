import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { StatusBadge, DelayedBadge } from '../shared/StatusBadge'
import ConfirmDialog from '../shared/ConfirmDialog'
import { SkeletonRow } from '../shared/Skeleton'
import { isDelayed, fmtAgo, canDo, getEstimateTiming, getDispatchTiming } from '../../utils/helpers'
import { Pencil, Trash2, CheckCircle } from 'lucide-react'
import clsx from 'clsx'
import toast from 'react-hot-toast'

function TimingBadge({ timing }) {
  if (!timing) return <span className="text-gray-300 text-xs">—</span>
  if (timing === 'ontime') return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800 border border-green-200">✓ On Time</span>
  )
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800 border border-red-200">✗ Late</span>
  )
}

function isOrderComplete(order) {
  return (
    order.paymentStatus  === 'Paid'      &&
    order.packingStatus  === 'Completed' &&
    order.dispatchStatus === 'Complete'  &&
    order.billStatus     === 'Generated' &&
    order.biltyStatus    === 'Created'   &&
    order.ledgerUpdated  === 'Yes'
  )
}

function CountdownTimer({ startTime, durationMs }) {
  const [remaining, setRemaining] = useState(null)

  useEffect(() => {
    if (!startTime) return
    function calc() {
      const elapsed = Date.now() - new Date(startTime).getTime()
      const left = durationMs - elapsed
      setRemaining(left)
    }
    calc()
    const interval = setInterval(calc, 1000)
    return () => clearInterval(interval)
  }, [startTime, durationMs])

  if (remaining === null) return null

  if (remaining <= 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800 border border-red-200">
        ⚠ OVERDUE
      </span>
    )
  }

  const totalSecs = Math.floor(remaining / 1000)
  const hrs  = Math.floor(totalSecs / 3600)
  const mins = Math.floor((totalSecs % 3600) / 60)
  const secs = totalSecs % 60
  const pct       = (remaining / durationMs) * 100
  const isWarning = pct < 25
  const isDanger  = pct < 10
  const display = hrs > 0
    ? `${hrs}h ${String(mins).padStart(2,'0')}m`
    : `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`

  return (
    <span className={clsx(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold border',
      isDanger  ? 'bg-red-100 text-red-800 border-red-200' :
      isWarning ? 'bg-amber-100 text-amber-800 border-amber-200' :
                  'bg-blue-50 text-blue-700 border-blue-200'
    )}>
      ⏱ {display}
    </span>
  )
}

// ── Mobile Card ─────────────────────────────────────────────────────────────
function OrderCard({ order, role, onEdit, onDelete, onClear, canDelete }) {
  const delayed  = isDelayed(order)
  const complete = isOrderComplete(order)
  const products = (order.productName || '').split('|').filter(p => p.trim())

  let timerStart    = null
  let timerDuration = null
  if (role === 'accounts' || role === 'admin') {
    if (order.estimateSent !== 'Yes') {
      timerStart    = order.orderCreatedTime
      timerDuration = 7200000
    }
  }
  if (role === 'dispatch' || role === 'admin') {
    if (order.customerConfirmation === 'Confirmed' && order.dispatchStatus !== 'Complete') {
      timerStart    = order.estimateTimestamp
      timerDuration = 21600000
    }
  }

  return (
    <div className={clsx(
      'bg-white rounded-2xl border p-4 space-y-3 shadow-sm',
      delayed  ? 'border-red-200 bg-red-50/30' :
      complete ? 'border-green-200 bg-green-50/20' :
      'border-gray-100'
    )}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-bold text-brand-600">{order.orderId}</span>
            {delayed && <DelayedBadge />}
            {complete && !delayed && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-green-200 text-green-800">✓ Complete</span>
            )}
          </div>
          <p className="text-base font-semibold text-gray-900 mt-0.5">{order.partyName}</p>
          <p className="text-xs text-gray-400">{order.contactNumber}</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => onEdit(order)} className="p-2 rounded-xl hover:bg-brand-50 text-gray-400 hover:text-brand-600 transition-colors">
            <Pencil size={14} />
          </button>
          {canDelete && complete && onClear && (
            <button onClick={() => onClear(order)} className="p-2 rounded-xl bg-green-50 text-green-600 hover:bg-green-100 transition-colors">
              <CheckCircle size={14} />
            </button>
          )}
          {canDelete && (
            <button onClick={() => onDelete(order)} className="p-2 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Products */}
      {products.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {products.map((p, i) => (
            <span key={i} className="px-2 py-0.5 bg-brand-50 text-brand-700 text-xs font-medium rounded-lg">{p}</span>
          ))}
        </div>
      )}

      {/* Timer */}
      {timerStart && timerDuration && (
        <div>
          <CountdownTimer startTime={timerStart} durationMs={timerDuration} />
        </div>
      )}

      {/* Status grid */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-50">
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Payment</p>
          <StatusBadge type="payment" value={order.paymentStatus} />
        </div>
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Packing</p>
          <StatusBadge type="packing" value={order.packingStatus} />
        </div>
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Dispatch</p>
          <StatusBadge type="dispatch" value={order.dispatchStatus} />
        </div>
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Confirmed</p>
          <StatusBadge type="generic" value={order.customerConfirmation} />
        </div>
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Bill</p>
          <StatusBadge type="generic" value={order.billStatus} />
        </div>
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Bilty</p>
          <StatusBadge type="generic" value={order.biltyStatus} />
        </div>
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Est. Time</p>
          <TimingBadge timing={getEstimateTiming(order)} />
        </div>
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Via</p>
          <span className="text-xs text-gray-600">{order.orderVia || '—'}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-gray-50">
        <span className="text-xs text-gray-400">{order.submittedBy}</span>
        <span className="text-xs text-gray-400">{fmtAgo(order.orderCreatedTime)}</span>
      </div>
    </div>
  )
}

// ── Desktop Table ────────────────────────────────────────────────────────────
const COLUMNS = [
  { key: 'orderId',              label: 'Order ID',        sticky: true },
  { key: 'partyName',            label: 'Party Name' },
  { key: 'productName',          label: 'Products' },
  { key: 'contactNumber',        label: 'Contact' },
  { key: 'orderVia',             label: 'Via' },
  { key: 'estimateTiming',       label: 'Estimate Time' },
  { key: 'customerConfirmation', label: 'Confirmed' },
  { key: 'paymentStatus',        label: 'Payment' },
  { key: 'packingStatus',        label: 'Packing' },
  { key: 'dispatchTiming',       label: 'Dispatch Time' },
  { key: 'dispatchStatus',       label: 'Dispatch' },
  { key: 'billStatus',           label: 'Bill' },
  { key: 'biltyStatus',          label: 'Bilty' },
  { key: 'submittedBy',          label: 'Submitted By' },
  { key: 'orderCreatedTime',     label: 'Created' },
]

export default function OrdersTable({ orders, loading, onEdit, onDelete, onClear }) {
  const { user } = useAuth()
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [clearTarget,  setClearTarget]  = useState(null)

  async function confirmDelete() {
    try {
      await onDelete(deleteTarget.orderId)
      toast.success(`${deleteTarget.orderId} deleted`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed')
    } finally {
      setDeleteTarget(null)
    }
  }

  async function confirmClear() {
    try {
      await onClear(clearTarget)
      setClearTarget(null)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Clear failed')
    } finally {
      setClearTarget(null)
    }
  }

  const validOrders = orders.filter(o =>
    o.orderId &&
    o.partyName &&
    o.orderId !== 'Order ID' &&
    o.partyName !== 'Party Name' &&
    o.orderId.startsWith('ORD')
  )

  const role = user?.role

  if (!loading && validOrders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
          <span className="text-2xl">📋</span>
        </div>
        <p className="text-sm font-medium text-gray-500">No orders found</p>
        <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filter</p>
      </div>
    )
  }

  return (
    <>
      {/* Mobile Card View */}
      <div className="block lg:hidden p-4 space-y-3">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-5 bg-gray-200 rounded w-2/3" />
                <div className="grid grid-cols-2 gap-2">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="h-8 bg-gray-100 rounded-xl" />
                  ))}
                </div>
              </div>
            ))
          : validOrders.map(order => (
              <OrderCard
                key={order.orderId}
                order={order}
                role={role}
                onEdit={onEdit}
                onDelete={(o) => setDeleteTarget(o)}
                onClear={(o) => setClearTarget(o)}
                canDelete={canDo(role, 'delete')}
              />
            ))
        }
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full border-collapse" style={{ minWidth: '1400px' }}>
          <thead>
            <tr>
              {COLUMNS.map(col => (
                <th
                  key={col.key}
                  className={clsx('table-th', col.sticky && 'sticky-col bg-gray-50 z-10')}
                  style={col.sticky ? { left: 0, minWidth: 160 } : {}}
                >
                  {col.label}
                </th>
              ))}
              {(role === 'accounts' || role === 'dispatch' || role === 'admin') && (
                <th className="table-th">Timer</th>
              )}
              <th className="table-th text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonRow key={i} cols={COLUMNS.length + 2} />
                ))
              : validOrders.map(order => {
                  const delayed        = isDelayed(order)
                  const complete       = isOrderComplete(order)
                  const estimateTiming = getEstimateTiming(order)
                  const dispatchTiming = getDispatchTiming(order)

                  let timerStart    = null
                  let timerDuration = null
                  if (role === 'accounts' || role === 'admin') {
                    if (order.estimateSent !== 'Yes') {
                      timerStart    = order.orderCreatedTime
                      timerDuration = 7200000
                    }
                  }
                  if (role === 'dispatch' || role === 'admin') {
                    if (order.customerConfirmation === 'Confirmed' && order.dispatchStatus !== 'Complete') {
                      timerStart    = order.estimateTimestamp
                      timerDuration = 21600000
                    }
                  }

                  return (
                    <tr
                      key={order.orderId}
                      className={clsx(
                        delayed  ? 'table-tr-delayed' :
                        complete ? 'bg-green-50/40 hover:bg-green-50' :
                        'table-tr'
                      )}
                    >
                      <td
                        className={clsx(
                          'table-td sticky-col',
                          delayed  ? 'bg-red-50/60'   :
                          complete ? 'bg-green-50/40' :
                          'bg-white'
                        )}
                        style={{ left: 0 }}
                      >
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-order-id">{order.orderId}</span>
                          {delayed && <DelayedBadge />}
                          {complete && !delayed && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-green-200 text-green-800">✓ Complete</span>
                          )}
                        </div>
                      </td>
                      <td className="table-td font-medium text-gray-900 max-w-[160px] truncate">{order.partyName}</td>
                      <td className="table-td">
                        {order.productName
                          ? <span className="text-xs text-gray-700">{order.productName.split('|').filter(p => p.trim()).join(', ')}</span>
                          : <span className="text-gray-300">—</span>
                        }
                      </td>
                      <td className="table-td text-gray-500 font-mono text-xs">{order.contactNumber}</td>
                      <td className="table-td text-gray-500">{order.orderVia}</td>
                      <td className="table-td"><TimingBadge timing={estimateTiming} /></td>
                      <td className="table-td"><StatusBadge type="generic" value={order.customerConfirmation} /></td>
                      <td className="table-td"><StatusBadge type="payment" value={order.paymentStatus} /></td>
                      <td className="table-td"><StatusBadge type="packing" value={order.packingStatus} /></td>
                      <td className="table-td"><TimingBadge timing={dispatchTiming} /></td>
                      <td className="table-td"><StatusBadge type="dispatch" value={order.dispatchStatus} /></td>
                      <td className="table-td"><StatusBadge type="generic" value={order.billStatus} /></td>
                      <td className="table-td"><StatusBadge type="generic" value={order.biltyStatus} /></td>
                      <td className="table-td text-gray-500">{order.submittedBy}</td>
                      <td className="table-td text-gray-400 text-xs">{fmtAgo(order.orderCreatedTime)}</td>
                      {(role === 'accounts' || role === 'dispatch' || role === 'admin') && (
                        <td className="table-td">
                          {timerStart && timerDuration
                            ? <CountdownTimer startTime={timerStart} durationMs={timerDuration} />
                            : <span className="text-gray-300 text-xs">—</span>
                          }
                        </td>
                      )}
                      <td className="table-td">
                        <div className="flex items-center gap-1.5 justify-end">
                          <button onClick={() => onEdit(order)} className="btn btn-ghost p-1.5 text-gray-500 hover:text-brand-600 hover:bg-brand-50">
                            <Pencil size={13} />
                          </button>
                          {canDo(role, 'delete') && complete && onClear && (
                            <button onClick={() => setClearTarget(order)} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-green-100 text-green-700 hover:bg-green-200 border border-green-200 transition-all">
                              <CheckCircle size={11} />
                              Clear
                            </button>
                          )}
                          {canDo(role, 'delete') && (
                            <button onClick={() => setDeleteTarget(order)} className="btn btn-ghost p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50">
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
            }
          </tbody>
        </table>
      </div>

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Order"
          message={`Are you sure you want to delete ${deleteTarget.orderId} — ${deleteTarget.partyName}?`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {clearTarget && (
        <ConfirmDialog
          title="Move to Order History"
          message={`${clearTarget.orderId} — ${clearTarget.partyName} ko Order History mein move karein?`}
          onConfirm={confirmClear}
          onCancel={() => setClearTarget(null)}
          danger={false}
        />
      )}
    </>
  )
}