import { useState } from 'react'
import { useLogs } from '../hooks/useOrders'
import { fmtDate } from '../utils/helpers'
import { Clock, RefreshCw, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const FIELD_LABELS = {
  partyName: 'Party Name', contactNumber: 'Contact', orderVia: 'Via',
  orderReceiver: 'Receiver', estimateSent: 'Estimate Sent', estimateTimestamp: 'Estimate Time',
  customerConfirmation: 'Confirmation', paymentMode: 'Pay Mode', paymentStatus: 'Payment Status',
  packingStatus: 'Packing', dispatchStatus: 'Dispatch', dispatchDate: 'Dispatch Date',
  billStatus: 'Bill Status', biltyStatus: 'Bilty Status', ledgerUpdated: 'Ledger',
  ORDER: 'Order',
}

export default function LogsPage() {
  const { logs, loading, refetch } = useLogs()
  const [search, setSearch] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const filtered = search
    ? logs.filter(l =>
        l.orderId.toLowerCase().includes(search.toLowerCase()) ||
        l.updatedBy.toLowerCase().includes(search.toLowerCase()) ||
        l.fieldChanged.toLowerCase().includes(search.toLowerCase())
      )
    : logs

  async function handleRefresh() {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
    toast.success('Logs refreshed')
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Topbar */}
      <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center gap-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-gray-400" />
          <div>
            <h1 className="text-base font-semibold text-gray-900">Activity Log</h1>
            <p className="text-xs text-gray-400">{filtered.length} events</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-8 w-48 py-1.5"
              placeholder="Search logs…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={clsx('btn btn-ghost p-2', refreshing && 'opacity-50')}
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Log list */}
      <div className="flex-1 overflow-auto px-6 py-5">
        <div className="card overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[90px_100px_1fr_120px_140px] gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-500 uppercase tracking-wide">
            <span>Order</span>
            <span>Field</span>
            <span>Change</span>
            <span>Updated By</span>
            <span>Time</span>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({length: 8}).map((_,i) => (
                <div key={i} className="skeleton h-10 rounded-xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Clock size={32} className="mb-3 opacity-30" />
              <p className="text-sm font-medium text-gray-500">No activity yet</p>
              <p className="text-xs">Changes to orders will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map((log, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[90px_100px_1fr_120px_140px] gap-4 px-5 py-3.5 hover:bg-gray-50/60 transition-colors items-center"
                >
                  <span className="text-order-id">{log.orderId}</span>

                  <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded-lg inline-block truncate">
                    {FIELD_LABELS[log.fieldChanged] || log.fieldChanged}
                  </span>

                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-red-600 line-through truncate max-w-[120px]">
                      {log.oldValue || '—'}
                    </span>
                    <span className="text-gray-300 text-xs flex-shrink-0">→</span>
                    <span className="text-xs font-medium text-green-700 truncate max-w-[120px]">
                      {log.newValue || '—'}
                    </span>
                  </div>

                  <span className="text-xs text-gray-600 truncate">{log.updatedBy}</span>

                  <span className="text-xs text-gray-400">{fmtDate(log.timestamp)}</span>
                </div>
              ))}
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-50 text-xs text-gray-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse-soft" />
              Auto-refreshes every 10s · Showing last {filtered.length} events
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
