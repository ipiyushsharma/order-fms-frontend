import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { canDo } from '../../utils/helpers'
import { Package, LayoutDashboard, ClipboardList, Clock, Filter, AlertTriangle, CheckCircle, LogOut, BarChart2, History, X } from 'lucide-react'
import clsx from 'clsx'

const ROLE_META = {
  admin:    { label: 'Admin',         color: 'bg-purple-100 text-purple-700' },
  crr:      { label: 'CRR Team',      color: 'bg-teal-100 text-teal-700' },
  accounts: { label: 'Accounts Team', color: 'bg-amber-100 text-amber-700' },
  dispatch: { label: 'Dispatch Team', color: 'bg-blue-100 text-blue-700' },
}

function NavItem({ to, icon: Icon, label, badge, badgeColor, end, onClick }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        clsx('flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm cursor-pointer transition-all duration-150',
          isActive ? 'bg-brand-50 text-brand-600 font-medium' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900')
      }
    >
      <Icon size={15} className="flex-shrink-0" />
      <span className="flex-1">{label}</span>
      {badge > 0 && (
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${badgeColor || 'bg-gray-100 text-gray-600'}`}>
          {badge}
        </span>
      )}
    </NavLink>
  )
}

export default function Sidebar({ stats, onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const roleMeta = ROLE_META[user?.role] || ROLE_META.crr

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const initials = (user?.displayName || user?.username || 'U')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <aside className="w-56 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col h-full">

      {/* Logo */}
      <div className="px-4 py-5 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-500 rounded-xl flex items-center justify-center shadow-sm">
              <Package size={15} className="text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900 leading-none">Order FMS</div>
              <div className="text-[10px] text-gray-400 mt-0.5">Management System</div>
            </div>
          </div>
          {/* Close button — sirf mobile pe */}
          {onClose && (
            <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100">
              <X size={16} className="text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">

        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider px-3 mb-2">Main</p>
        <NavItem to="/" end icon={LayoutDashboard} label="Dashboard" onClick={onClose} />
        <NavItem to="/orders" icon={ClipboardList} label="All Orders" badge={stats?.total} badgeColor="bg-gray-100 text-gray-600" onClick={onClose} />
        {canDo(user?.role, 'view_logs') && (
          <NavItem to="/logs" icon={Clock} label="Activity Log" onClick={onClose} />
        )}
        <NavItem to="/analytics" icon={BarChart2} label="Analytics" onClick={onClose} />
        <NavItem to="/history" icon={History} label="Order History" onClick={onClose} />

        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider px-3 mb-2 mt-5">Filters</p>

        <NavLink
          to="/orders?filter=pending_estimate"
          onClick={onClose}
          className={({ isActive }) => clsx('flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm cursor-pointer transition-all', isActive ? 'bg-brand-50 text-brand-600 font-medium' : 'text-gray-600 hover:bg-gray-100')}
        >
          <Filter size={15} className="flex-shrink-0" />
          <span className="flex-1">Pending Estimate</span>
          {stats?.pendingEstimate > 0 && (
            <span className="bg-amber-100 text-amber-700 text-[10px] font-medium px-1.5 py-0.5 rounded-full">{stats.pendingEstimate}</span>
          )}
        </NavLink>

        <NavLink
          to="/orders?filter=payment_pending"
          onClick={onClose}
          className={({ isActive }) => clsx('flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm cursor-pointer transition-all', isActive ? 'bg-brand-50 text-brand-600 font-medium' : 'text-gray-600 hover:bg-gray-100')}
        >
          <Filter size={15} className="flex-shrink-0" />
          <span className="flex-1">Payment Pending</span>
          {stats?.paymentPending > 0 && (
            <span className="bg-amber-100 text-amber-700 text-[10px] font-medium px-1.5 py-0.5 rounded-full">{stats.paymentPending}</span>
          )}
        </NavLink>

        <NavLink
          to="/orders?filter=dispatch_pending"
          onClick={onClose}
          className={({ isActive }) => clsx('flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm cursor-pointer transition-all', isActive ? 'bg-brand-50 text-brand-600 font-medium' : 'text-gray-600 hover:bg-gray-100')}
        >
          <Filter size={15} className="flex-shrink-0" />
          <span>Dispatch Pending</span>
        </NavLink>

        <NavLink
          to="/orders?filter=completed"
          onClick={onClose}
          className={({ isActive }) => clsx('flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm cursor-pointer transition-all', isActive ? 'bg-brand-50 text-brand-600 font-medium' : 'text-gray-600 hover:bg-gray-100')}
        >
          <CheckCircle size={15} className="flex-shrink-0" />
          <span>Completed</span>
        </NavLink>

        <NavLink
          to="/orders?filter=delayed"
          onClick={onClose}
          className={({ isActive }) => clsx('flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm cursor-pointer transition-all text-red-500', isActive ? 'bg-red-50 font-medium' : 'hover:bg-red-50')}
        >
          <AlertTriangle size={15} className="flex-shrink-0" />
          <span className="flex-1">Delayed</span>
          {stats?.delayed > 0 && (
            <span className="bg-red-100 text-red-700 text-[10px] font-medium px-1.5 py-0.5 rounded-full">{stats.delayed}</span>
          )}
        </NavLink>

      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-gray-100 space-y-3">
        <div className="flex items-center gap-2.5 px-2">
          <div className="w-8 h-8 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-semibold flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate leading-none">
              {user?.displayName || user?.username}
            </div>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md mt-0.5 inline-block ${roleMeta.color}`}>
              {roleMeta.label}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 hover:text-red-600 w-full transition-all"
        >
          <LogOut size={14} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  )
}