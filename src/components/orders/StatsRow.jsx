import { SkeletonCard } from '../shared/Skeleton'
import { Package, AlertTriangle, Clock, CheckCircle, FileText, XCircle } from 'lucide-react'

function StatCard({ label, value, sub, icon: Icon, iconBg, iconColor, valueColor }) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
          <p className={`text-2xl font-semibold mt-1 ${valueColor || 'text-gray-900'}`}>{value ?? '—'}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon size={16} className={iconColor} />
        </div>
      </div>
    </div>
  )
}

export default function StatsRow({ stats, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-6 gap-3 mb-5">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
      <StatCard
        label="Total Orders"
        value={stats.total}
        sub="Active orders"
        icon={Package}
        iconBg="bg-blue-100"
        iconColor="text-blue-600"
        valueColor="text-blue-700"
      />
      <StatCard
        label="Estimate Pending"
        value={stats.pendingEstimate}
        sub="Awaiting estimate"
        icon={FileText}
        iconBg="bg-amber-100"
        iconColor="text-amber-600"
        valueColor="text-amber-700"
      />
      <StatCard
        label="CX Rejected"
        value={stats.cxRejected}
        sub="Customer rejected"
        icon={XCircle}
        iconBg="bg-red-100"
        iconColor="text-red-600"
        valueColor="text-red-600"
      />
      <StatCard
        label="Delayed"
        value={stats.delayed}
        sub="Needs attention"
        icon={AlertTriangle}
        iconBg="bg-orange-100"
        iconColor="text-orange-600"
        valueColor="text-orange-600"
      />
      <StatCard
        label="Dispatch Pending"
        value={stats.dispatchPending}
        sub="In pipeline"
        icon={Clock}
        iconBg="bg-gray-100"
        iconColor="text-gray-600"
      />
      <StatCard
        label="Completed"
        value={stats.completed}
        sub="Delivered"
        icon={CheckCircle}
        iconBg="bg-green-100"
        iconColor="text-green-600"
        valueColor="text-green-700"
      />
    </div>
  )
}