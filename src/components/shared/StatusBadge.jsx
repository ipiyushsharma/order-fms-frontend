import { getPayStatusMeta, getPackStatusMeta, getDispStatusMeta, getGenericMeta } from '../../utils/helpers'
import clsx from 'clsx'

export function StatusBadge({ type, value }) {
  if (!value) return <span className="text-gray-300 text-xs">—</span>

  let meta = {}
  if (type === 'payment') meta = getPayStatusMeta(value)
  else if (type === 'packing') meta = getPackStatusMeta(value)
  else if (type === 'dispatch') meta = getDispStatusMeta(value)
  else meta = getGenericMeta(value)

  return (
    <span className={clsx('badge', meta.cls)}>
      {meta.dot && (
        <span className={clsx('w-1.5 h-1.5 rounded-full flex-shrink-0', meta.dot)} />
      )}
      {value}
    </span>
  )
}

export function DelayedBadge() {
  return (
    <span className="ml-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-200 text-red-800 animate-pulse-soft">
      ⚠ DELAYED
    </span>
  )
}
