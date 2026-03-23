import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useOrders } from '../hooks/useOrders'
import { isDelayed, canDo, downloadCSV } from '../utils/helpers'
import OrdersTable from '../components/orders/OrdersTable'
import OrderFormModal from '../components/orders/OrderFormModal'
import StatsRow from '../components/orders/StatsRow'
import ConfirmDialog from '../components/shared/ConfirmDialog'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { Search, Plus, Download, RefreshCw } from 'lucide-react'
import clsx from 'clsx'

const FILTERS = [
  { key: 'all',              label: 'All Orders' },
  { key: 'pending_estimate', label: 'Pending Estimate' },
  { key: 'payment_pending',  label: 'Payment Pending' },
  { key: 'dispatch_pending', label: 'Dispatch Pending' },
  { key: 'completed',        label: 'Completed' },
  { key: 'delayed',          label: 'Delayed', danger: true },
]

export default function OrdersPage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch]           = useState('')
  const [activeFilter, setActiveFilter] = useState(searchParams.get('filter') || 'all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editOrder, setEditOrder]     = useState(null)
  const [clearTarget, setClearTarget] = useState(null)
  const [refreshing, setRefreshing]   = useState(false)

  const { orders, total, cxRejected, loading, refetch, createOrder, updateOrder, deleteOrder } = useOrders(activeFilter, search)

  useEffect(() => {
    const f = searchParams.get('filter')
    if (f) setActiveFilter(f)
  }, [searchParams])

  function setFilter(key) {
    setActiveFilter(key)
    if (key === 'all') setSearchParams({})
    else setSearchParams({ filter: key })
  }

  const stats = useMemo(() => ({
  total,
  pendingEstimate: orders.filter(o => o.estimateSent === 'No').length,
  cxRejected,
  delayed:         orders.filter(isDelayed).length,
  dispatchPending: orders.filter(o => o.dispatchStatus === 'Pending').length,
  completed:       orders.filter(o => o.orderStatus === 'complete').length,
}), [orders, total, cxRejected])

  async function handleRefresh() {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
    toast.success('Refreshed')
  }

  async function handleCreate(formData) {
    const res = await createOrder(formData)
    toast.success(res.message || 'Order created')
  }

  async function handleUpdate(formData) {
    const res = await updateOrder(editOrder.orderId, formData)
    toast.success(res.message || 'Order updated')
  }

  async function handleDelete(orderId) {
    await deleteOrder(orderId)
  }

  async function confirmClear() {
    try {
      await api.post(`/orders/${clearTarget.orderId}/clear`)
      await refetch()
      toast.success(`${clearTarget.orderId} moved to Order History ✓`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to clear order')
    } finally {
      setClearTarget(null)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Topbar */}
      <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center gap-3 flex-shrink-0">
        <div>
          <h1 className="text-base font-semibold text-gray-900">Orders</h1>
          <p className="text-xs text-gray-400">{total} total records</p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mr-1">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse-soft" />
            Live
          </div>

          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-8 w-52 py-1.5"
              placeholder="Search order or party…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <button
            onClick={handleRefresh}
            className={clsx('btn btn-ghost p-2', refreshing && 'opacity-50')}
            disabled={refreshing}
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </button>

          <button onClick={() => downloadCSV(orders)} className="btn gap-1.5">
            <Download size={13} />
            Export
          </button>

          {canDo(user?.role, 'create') && (
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary gap-1.5">
              <Plus size={14} />
              New Order
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-5">
        <StatsRow stats={stats} loading={loading} />

        {/* Filter chips */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={clsx(
                'px-3 py-1.5 rounded-xl text-xs font-medium border transition-all',
                activeFilter === f.key
                  ? f.danger ? 'bg-red-100 text-red-800 border-red-200' : 'bg-brand-500 text-white border-brand-500'
                  : f.danger ? 'bg-white text-red-500 border-red-200 hover:bg-red-50' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <OrdersTable
            orders={orders}
            loading={loading}
            onEdit={setEditOrder}
            onDelete={handleDelete}
            onClear={canDo(user?.role, 'delete') ? (order) => setClearTarget(order) : null}
          />
          {!loading && orders.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-50 flex items-center gap-2 text-xs text-gray-400">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse-soft" />
              Auto-refreshing every 8s · Showing {orders.length} orders
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <OrderFormModal
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreate}
        />
      )}

      {/* Edit Modal */}
      {editOrder && (
        <OrderFormModal
          order={editOrder}
          onClose={() => setEditOrder(null)}
          onSave={handleUpdate}
        />
      )}

      {/* Clear to History Confirm */}
      {clearTarget && (
        <ConfirmDialog
          title="Move to Order History"
          message={`${clearTarget.orderId} — ${clearTarget.partyName} ko Order History mein move karein? Ye active orders se hata diya jaayega.`}
          onConfirm={confirmClear}
          onCancel={() => setClearTarget(null)}
          danger={false}
        />
      )}
    </div>
  )
}