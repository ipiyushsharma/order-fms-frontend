import { formatDistanceToNow, format, parseISO } from 'date-fns'

export function fmtAgo(ts) {
  if (!ts) return '—'
  try {
    const d = typeof ts === 'string' ? parseISO(ts) : new Date(ts)
    return formatDistanceToNow(d, { addSuffix: true })
  } catch { return '—' }
}

export function fmtDate(ts) {
  if (!ts) return '—'
  try {
    const d = typeof ts === 'string' ? parseISO(ts) : new Date(ts)
    return format(d, 'dd MMM, HH:mm')
  } catch { return '—' }
}

export function fmtDateOnly(ts) {
  if (!ts) return '—'
  try {
    const d = typeof ts === 'string' ? parseISO(ts) : new Date(ts)
    return format(d, 'dd MMM yyyy')
  } catch { return '—' }
}

export function isDelayed(order) {
  if (!order.orderCreatedTime) return false
  const created = new Date(order.orderCreatedTime).getTime()
  const now = Date.now()
  // Accounts: 2hr se zyada ho gaya aur estimate nahi bheja
  const estimateDelay = order.estimateSent === 'No' && (now - created) > 7200000
  // Dispatch: Customer confirmed ke baad 6hr se zyada
  const confirmTime = order.customerConfirmation === 'Confirmed' && order.estimateTimestamp
    ? new Date(order.estimateTimestamp).getTime() : null
  const dispatchDelay = confirmTime &&
    order.orderStatus !== 'complete' &&
    order.orderStatus !== 'cancelled' &&
    order.dispatchStatus !== 'Complete' &&
    (now - confirmTime) > 21600000
  return estimateDelay || dispatchDelay
}

// Estimate timing: 2hrs se andar = On Time, baad mein = Late
export function getEstimateTiming(order) {
  if (!order.estimateTimestamp || order.estimateSent !== 'Yes') return null
  const created  = new Date(order.orderCreatedTime).getTime()
  const estimated = new Date(order.estimateTimestamp).getTime()
  const diff = estimated - created
  return diff <= 7200000 ? 'ontime' : 'late' // 2hr
}

// Dispatch timing: dispatchTimingStatus field use karo (backend ne set kiya hai)
export function getDispatchTiming(order) {
  if (!order.dispatchTimingStatus) return null
  if (order.dispatchTimingStatus === 'green') return 'ontime'
  if (order.dispatchTimingStatus === 'red')   return 'late'
  return null
}

export function getPayStatusMeta(v) {
  if (v === 'Paid')    return { cls: 'badge-green',  dot: 'bg-green-500' }
  if (v === 'Partial') return { cls: 'badge-yellow', dot: 'bg-amber-500' }
  return { cls: 'badge-red', dot: 'bg-red-500' }
}

export function getPackStatusMeta(v) {
  if (v === 'Completed')   return { cls: 'badge-green',  dot: 'bg-green-500' }
  if (v === 'In Progress') return { cls: 'badge-yellow', dot: 'bg-amber-500' }
  return { cls: 'badge-gray', dot: 'bg-gray-400' }
}

export function getDispStatusMeta(v) {
  if (v === 'Complete')   return { cls: 'badge-green', dot: 'bg-green-500' }
  if (v === 'Dispatched') return { cls: 'badge-teal',  dot: 'bg-teal-500' }
  return { cls: 'badge-red', dot: 'bg-red-500' }
}

export function getGenericMeta(v) {
  if (v === 'Yes' || v === 'Generated' || v === 'Created' || v === 'Confirmed')
    return { cls: 'badge-green' }
  if (v === 'No' || v === 'Pending' || v === 'Rejected')
    return { cls: 'badge-gray' }
  return { cls: 'badge-blue' }
}

export function canDo(role, perm) {
  const map = {
    admin:    ['create','read','update_all','delete','view_logs'],
    crr:      ['create','read','update_basic'],
    accounts: ['read','update_estimate','update_payment'],
    dispatch: ['read','update_packing','update_dispatch'],
  }
  return (map[role] || []).includes(perm)
}

export function downloadCSV(orders) {
  const cols = [
    'orderId','partyName','contactNumber','orderVia',
    'productName',
    'estimateSent','customerConfirmation','paymentMode','paymentStatus',
    'packingStatus','dispatchStatus','dispatchDate','billStatus','biltyStatus',
    'ledgerUpdated','submittedBy','orderCreatedTime','lastUpdatedBy','lastUpdatedTime',
    'orderCreatedBy','estimateSentBy','dispatchedBy','transportName'
  ]
  const header = cols.join(',')
  const rows = orders.map(o =>
    cols.map(c => `"${(o[c] || '').toString().replace(/"/g, '""')}"`).join(',')
  )
  const csv = [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `orders_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}