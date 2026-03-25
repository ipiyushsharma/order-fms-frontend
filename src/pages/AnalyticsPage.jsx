import { useState, useMemo, useEffect, useRef } from 'react'
import { useOrders, useHistory } from '../hooks/useOrders'
import { getEstimateTiming, fmtDateOnly, fmtAgo, isDelayed } from '../utils/helpers'
import { BarChart2, Users, Package, Calendar, X } from 'lucide-react'
import { format, startOfDay, endOfDay, isWithinInterval, parseISO, startOfMonth } from 'date-fns'
import { StatusBadge, DelayedBadge } from '../components/shared/StatusBadge'
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function getYear(ts) { return ts ? new Date(ts).getFullYear() : null }

function inRange(ts, from, to) {
  if (!ts) return false
  try {
    const d = typeof ts === 'string' ? parseISO(ts) : new Date(ts)
    return isWithinInterval(d, { start: startOfDay(new Date(from)), end: endOfDay(new Date(to)) })
  } catch { return false }
}

function inMonthRange(ts, fromY, fromM, toY, toM) {
  if (!ts) return false
  const d = new Date(ts)
  const val  = d.getFullYear() * 12 + d.getMonth()
  const from = fromY * 12 + fromM
  const to   = toY   * 12 + toM
  return val >= from && val <= to
}

// ── Bar Chart ─────────────────────────────────────────────────────────────
function ProductBarChart({ products }) {
  const canvasRef = useRef(null)
  const chartRef  = useRef(null)

  useEffect(() => {
    if (!canvasRef.current || products.length === 0) return
    if (chartRef.current) chartRef.current.destroy()

    const top10 = products.slice(0, 10)
    const colors = [
      '#185FA5','#1D9E75','#BA7517','#534AB7','#A32D2D',
      '#0F6E56','#993C1D','#3B6D11','#0C447C','#D85A30'
    ]

    chartRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels: top10.map(p => p.name.length > 16 ? p.name.slice(0,16)+'…' : p.name),
        datasets: [{
          label: 'Orders',
          data: top10.map(p => p.count),
          backgroundColor: top10.map((_, i) => colors[i % colors.length] + '99'),
          borderColor:     top10.map((_, i) => colors[i % colors.length]),
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1e293b',
            padding: 10,
            callbacks: {
              label: ctx => `  ${ctx.raw} order${ctx.raw !== 1 ? 's' : ''}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, font: { size: 11 }, color: '#9ca3af' },
            grid: { color: '#f3f4f6' }
          },
          x: {
            ticks: { font: { size: 11 }, color: '#6b7280' },
            grid: { display: false }
          }
        }
      }
    })

    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null } }
  }, [products])

  if (products.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        No product data for this period
      </div>
    )
  }

  return <div style={{ height: 300 }}><canvas ref={canvasRef} /></div>
}

// ── Orders Drill-down Modal ───────────────────────────────────────────────
function OrdersModal({ title, orders, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">{title}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{orders.length} orders</p>
          </div>
          <button onClick={onClose} className="btn btn-ghost p-1.5"><X size={16} /></button>
        </div>
        <div className="overflow-auto flex-1">
          {orders.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-gray-400 text-sm">No orders</div>
          ) : (
            <table className="w-full" style={{ minWidth: 700 }}>
              <thead>
                <tr>
                  {['Order ID','Party Name','Product','Qty','Estimate','Dispatch','Payment','Created'].map(h => (
                    <th key={h} className="table-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.orderId} className={isDelayed(order) ? 'table-tr-delayed' : 'table-tr'}>
                    <td className="table-td">
                      <div className="flex items-center gap-1">
                        <span className="text-order-id">{order.orderId}</span>
                        {isDelayed(order) && <DelayedBadge />}
                      </div>
                    </td>
                    <td className="table-td font-medium text-gray-900">{order.partyName}</td>
                    <td className="table-td text-gray-600">
                      {order.productName
                        ? <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-brand-100 text-brand-700">
                            {order.productName.split('|').filter(p => p.trim()).length} items
                          </span>
                        : '—'}
                    </td>
                    <td className="table-td text-gray-600 font-mono text-xs">
                      {order.quantity ? order.quantity.split('|').reduce((s,q) => s+(parseInt(q)||0), 0) : '—'}
                    </td>
                    <td className="table-td">
                      {getEstimateTiming(order) === 'ontime'
                        ? <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800 border border-green-200">✓ On Time</span>
                        : getEstimateTiming(order) === 'late'
                        ? <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800 border border-red-200">✗ Late</span>
                        : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="table-td">
                      {order.dispatchTimingStatus === 'green'
                        ? <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800 border border-green-200">✓ On Time</span>
                        : order.dispatchTimingStatus === 'red'
                        ? <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800 border border-red-200">✗ Late</span>
                        : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="table-td"><StatusBadge type="payment" value={order.paymentStatus} /></td>
                    <td className="table-td text-gray-400 text-xs">{fmtAgo(order.orderCreatedTime)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Clickable Stat Card ───────────────────────────────────────────────────
function StatCard({ label, value, sub, valueColor, orders, onCardClick }) {
  const clickable = orders && orders.length > 0
  return (
    <div
      onClick={() => clickable && onCardClick(label, orders)}
      className={`stat-card transition-all duration-150 ${clickable ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5 hover:border-brand-200' : ''}`}
    >
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-semibold mt-1 ${valueColor || 'text-gray-900'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      {clickable && <p className="text-[10px] text-brand-500 mt-1 font-medium">Click to view →</p>}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const { orders } = useOrders()
  const { history: completedOrders } = useHistory()
  const [tab, setTab] = useState('performance')
  const [filterType, setFilterType] = useState('month_range')
  const [modal, setModal] = useState(null)

  const today     = format(new Date(), 'yyyy-MM-dd')
  const thisYear  = new Date().getFullYear()
  const thisMonth = new Date().getMonth()

  const [dateFrom,   setDateFrom]   = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [dateTo,     setDateTo]     = useState(today)
  const [monthFromY, setMonthFromY] = useState(thisYear)
  const [monthFromM, setMonthFromM] = useState(thisMonth)
  const [monthToY,   setMonthToY]   = useState(thisYear)
  const [monthToM,   setMonthToM]   = useState(thisMonth)
  const [selectedYear, setSelectedYear] = useState(thisYear)

  const allOrders = useMemo(() => [...orders, ...completedOrders], [orders, completedOrders])

  const years = useMemo(() => {
    const ys = new Set(allOrders.map(o => getYear(o.orderCreatedTime)).filter(Boolean))
    if (!ys.size) ys.add(thisYear)
    return [...ys].sort((a, b) => b - a)
  }, [allOrders])

  const filteredOrders = useMemo(() => {
    return allOrders.filter(o => {
      if (!o.orderCreatedTime) return false
      if (filterType === 'date_range')  return inRange(o.orderCreatedTime, dateFrom, dateTo)
      if (filterType === 'month_range') return inMonthRange(o.orderCreatedTime, monthFromY, monthFromM, monthToY, monthToM)
     if (filterType === 'year') return getYear(o.orderCreatedTime) === selectedYear
if (filterType === 'quarter') {
  const d = new Date(o.orderCreatedTime)
  const q = Math.floor(d.getMonth() / 3)
  const tq = Math.floor(thisMonth / 3)
  return d.getFullYear() === thisYear && q === tq
}
return true
    })
  }, [allOrders, filterType, dateFrom, dateTo, monthFromY, monthFromM, monthToY, monthToM, selectedYear])

  const estOnTimeOrders   = useMemo(() => filteredOrders.filter(o => getEstimateTiming(o) === 'ontime'),        [filteredOrders])
  const estLateOrders     = useMemo(() => filteredOrders.filter(o => getEstimateTiming(o) === 'late'),          [filteredOrders])
  const dispOnTimeOrders  = useMemo(() => filteredOrders.filter(o => o.dispatchTimingStatus === 'green'),       [filteredOrders])
  const dispLateOrders    = useMemo(() => filteredOrders.filter(o => o.dispatchTimingStatus === 'red'),         [filteredOrders])
  const completedFiltered = useMemo(() => filteredOrders.filter(o => o.orderStatus === 'complete'),             [filteredOrders])

  const estPct  = estOnTimeOrders.length + estLateOrders.length > 0
    ? Math.round((estOnTimeOrders.length  / (estOnTimeOrders.length  + estLateOrders.length))  * 100) : 0
  const dispPct = dispOnTimeOrders.length + dispLateOrders.length > 0
    ? Math.round((dispOnTimeOrders.length / (dispOnTimeOrders.length + dispLateOrders.length)) * 100) : 0

  const dayWise = useMemo(() => {
    const map = {}
    filteredOrders.forEach(o => {
      const day = fmtDateOnly(o.orderCreatedTime)
      if (!map[day]) map[day] = { label: day, total: 0, estOnTime: 0, estLate: 0, dispOnTime: 0, dispLate: 0, completed: 0, _orders: [] }
      map[day].total++
      map[day]._orders.push(o)
      if (getEstimateTiming(o) === 'ontime')      map[day].estOnTime++
      if (getEstimateTiming(o) === 'late')        map[day].estLate++
      if (o.dispatchTimingStatus === 'green')     map[day].dispOnTime++
      if (o.dispatchTimingStatus === 'red')       map[day].dispLate++
      if (o.orderStatus === 'complete')           map[day].completed++
    })
    return Object.values(map).sort((a, b) => new Date(a.label) - new Date(b.label))
  }, [filteredOrders])

  const monthWise = useMemo(() => {
    const map = {}
    filteredOrders.forEach(o => {
      const d = new Date(o.orderCreatedTime)
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2,'0')}`
      const label = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`
      if (!map[key]) map[key] = { label, total: 0, estOnTime: 0, estLate: 0, dispOnTime: 0, dispLate: 0, completed: 0, _orders: [] }
      map[key].total++
      map[key]._orders.push(o)
      if (getEstimateTiming(o) === 'ontime')      map[key].estOnTime++
      if (getEstimateTiming(o) === 'late')        map[key].estLate++
      if (o.dispatchTimingStatus === 'green')     map[key].dispOnTime++
      if (o.dispatchTimingStatus === 'red')       map[key].dispLate++
      if (o.orderStatus === 'complete')           map[key].completed++
    })
    return Object.values(map).sort((a, b) => a.label.localeCompare(b.label))
  }, [filteredOrders])

  const tableRows  = filterType === 'date_range' ? dayWise : monthWise
  const tableLabel = filterType === 'date_range' ? 'Date' : 'Month'

  const repeatProducts = useMemo(() => {
    const map = {}
    filteredOrders.forEach(o => {
      const parts = (o.productName || '').split('|').filter(p => p.trim())
      parts.forEach(p => {
        const name = p.trim()
        if (!map[name]) map[name] = { name, count: 0, orders: [] }
        map[name].count++
        if (!map[name].orders.find(x => x.orderId === o.orderId)) map[name].orders.push(o)
      })
    })
    return Object.values(map).sort((a, b) => b.count - a.count)
  }, [filteredOrders])

  const repeatCustomers = useMemo(() => {
    const map = {}
    filteredOrders.forEach(o => {
      const c = (o.partyName || '').trim()
      if (!c) return
      if (!map[c]) map[c] = { name: c, count: 0, orders: [] }
      map[c].count++
      map[c].orders.push(o)
    })
    return Object.values(map).sort((a, b) => b.count - a.count)
  }, [filteredOrders])

  function openModal(title, orders) { setModal({ title, orders }) }

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Topbar */}
      <div className="bg-white border-b border-gray-100 px-6 py-3 flex-shrink-0">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <BarChart2 size={16} className="text-gray-400" />
            <div>
              <h1 className="text-base font-semibold text-gray-900">Analytics</h1>
              <p className="text-xs text-gray-400">{filteredOrders.length} orders in selected period</p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2 flex-wrap">
            <div className="flex rounded-xl border border-gray-200 overflow-hidden">
              {[
                { key: 'date_range',  label: 'Date Range' },
                { key: 'month_range', label: 'Month Range' },
                { key: 'year',        label: 'Year' },
              ].map(f => (
                <button key={f.key} onClick={() => setFilterType(f.key)}
                  className={`px-3 py-1.5 text-xs font-medium transition-all ${filterType === f.key ? 'bg-brand-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                  {f.label}
                </button>
              ))}
            </div>

            {filterType === 'date_range' && (
              <div className="flex items-center gap-2">
                <Calendar size={13} className="text-gray-400" />
                <input type="date" className="input py-1.5 w-36 text-xs" value={dateFrom} max={dateTo} onChange={e => setDateFrom(e.target.value)} />
                <span className="text-gray-400 text-xs">to</span>
                <input type="date" className="input py-1.5 w-36 text-xs" value={dateTo} min={dateFrom} max={today} onChange={e => setDateTo(e.target.value)} />
              </div>
            )}

            {filterType === 'month_range' && (
              <div className="flex items-center gap-2">
                <Calendar size={13} className="text-gray-400" />
                <select className="select-input py-1.5 text-xs w-24" value={monthFromM} onChange={e => setMonthFromM(Number(e.target.value))}>
                  {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
                <select className="select-input py-1.5 text-xs w-20" value={monthFromY} onChange={e => setMonthFromY(Number(e.target.value))}>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <span className="text-gray-400 text-xs">to</span>
                <select className="select-input py-1.5 text-xs w-24" value={monthToM} onChange={e => setMonthToM(Number(e.target.value))}>
                  {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
                <select className="select-input py-1.5 text-xs w-20" value={monthToY} onChange={e => setMonthToY(Number(e.target.value))}>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            )}

            {filterType === 'year' && (
              <select className="select-input py-1.5 text-xs w-24" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 py-5">

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {[
            { key: 'performance', label: 'Performance' },
            { key: 'repeat',      label: 'Repeat Orders' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${tab === t.key ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'performance' && (
          <>
            {/* Row 1 */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-3">
              <StatCard label="Total Orders"     value={filteredOrders.length}    orders={filteredOrders}     onCardClick={openModal} />
              <StatCard label="Total Completed"  value={completedFiltered.length} sub="moved to history"      valueColor="text-green-700" orders={completedFiltered} onCardClick={openModal} />
              <StatCard label="Estimate On Time" value={estOnTimeOrders.length}   sub="within 2hr of order"   valueColor="text-green-700" orders={estOnTimeOrders}   onCardClick={openModal} />
              <StatCard label="Estimate Late"    value={estLateOrders.length}     sub="after 2hr of order"    valueColor="text-red-600"   orders={estLateOrders}     onCardClick={openModal} />
              <StatCard label="Dispatch On Time" value={dispOnTimeOrders.length}  sub="within 6hrs"          valueColor="text-green-700" orders={dispOnTimeOrders}  onCardClick={openModal} />
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <StatCard label="Dispatch Late" value={dispLateOrders.length} sub="after 24hrs" valueColor="text-red-600" orders={dispLateOrders} onCardClick={openModal} />
              <div className="stat-card">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Est. On Time %</p>
                <p className={`text-2xl font-semibold mt-1 ${estPct >= 80 ? 'text-green-700' : estPct >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{estPct}%</p>
              </div>
              <div className="stat-card">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Disp. On Time %</p>
                <p className={`text-2xl font-semibold mt-1 ${dispPct >= 80 ? 'text-green-700' : dispPct >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{dispPct}%</p>
              </div>
              <div className="stat-card">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Completion Rate</p>
                <p className={`text-2xl font-semibold mt-1 ${filteredOrders.length > 0 ? (Math.round((completedFiltered.length/filteredOrders.length)*100) >= 80 ? 'text-green-700' : 'text-amber-600') : 'text-gray-400'}`}>
                  {filteredOrders.length > 0 ? Math.round((completedFiltered.length / filteredOrders.length) * 100) : 0}%
                </p>
              </div>
            </div>

            {/* Breakdown table */}
            <div className="card overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">
                  {filterType === 'date_range' ? 'Day-wise Breakdown' : 'Month-wise Breakdown'}
                </h2>
                <span className="text-xs text-gray-400">{tableRows.length} rows</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="table-th">{tableLabel}</th>
                      <th className="table-th">Total</th>
                      <th className="table-th">Completed</th>
                      <th className="table-th"><span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800 border border-green-200">Est. On Time</span></th>
                      <th className="table-th"><span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800 border border-red-200">Est. Late</span></th>
                      <th className="table-th"><span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800 border border-green-200">Disp. On Time</span></th>
                      <th className="table-th"><span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800 border border-red-200">Disp. Late</span></th>
                      <th className="table-th">Est. %</th>
                      <th className="table-th">Disp. %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.length === 0 ? (
                      <tr><td colSpan={9} className="table-td text-center text-gray-400 py-10">No data for selected period</td></tr>
                    ) : tableRows.map((row, i) => {
                      const ep = row.estOnTime + row.estLate > 0 ? Math.round((row.estOnTime / (row.estOnTime + row.estLate)) * 100) : null
                      const dp = row.dispOnTime + row.dispLate > 0 ? Math.round((row.dispOnTime / (row.dispOnTime + row.dispLate)) * 100) : null
                      return (
                        <tr key={i} className="table-tr">
                          <td className="table-td font-medium text-gray-800">{row.label}</td>
                          <td className="table-td">
                            <button onClick={() => openModal(`All Orders — ${row.label}`, row._orders)} className="font-semibold text-brand-600 hover:underline">{row.total}</button>
                          </td>
                          <td className="table-td">
                            {row.completed > 0
                              ? <button onClick={() => openModal(`Completed — ${row.label}`, row._orders.filter(o => o.orderStatus === 'complete'))} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800 border border-green-200 hover:bg-green-200">{row.completed}</button>
                              : <span className="text-gray-300">—</span>}
                          </td>
                          <td className="table-td">
                            {row.estOnTime > 0
                              ? <button onClick={() => openModal(`Est. On Time — ${row.label}`, row._orders.filter(o => getEstimateTiming(o) === 'ontime'))} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800 border border-green-200 hover:bg-green-200">{row.estOnTime}</button>
                              : <span className="text-gray-300">—</span>}
                          </td>
                          <td className="table-td">
                            {row.estLate > 0
                              ? <button onClick={() => openModal(`Est. Late — ${row.label}`, row._orders.filter(o => getEstimateTiming(o) === 'late'))} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800 border border-red-200 hover:bg-red-200">{row.estLate}</button>
                              : <span className="text-gray-300">—</span>}
                          </td>
                          <td className="table-td">
                            {row.dispOnTime > 0
                              ? <button onClick={() => openModal(`Disp. On Time — ${row.label}`, row._orders.filter(o => o.dispatchTimingStatus === 'green'))} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800 border border-green-200 hover:bg-green-200">{row.dispOnTime}</button>
                              : <span className="text-gray-300">—</span>}
                          </td>
                          <td className="table-td">
                            {row.dispLate > 0
                              ? <button onClick={() => openModal(`Disp. Late — ${row.label}`, row._orders.filter(o => o.dispatchTimingStatus === 'red'))} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800 border border-red-200 hover:bg-red-200">{row.dispLate}</button>
                              : <span className="text-gray-300">—</span>}
                          </td>
                          <td className="table-td">
                            {ep !== null ? <span className={`text-xs font-semibold ${ep >= 80 ? 'text-green-700' : ep >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{ep}%</span> : <span className="text-gray-300">—</span>}
                          </td>
                          <td className="table-td">
                            {dp !== null ? <span className={`text-xs font-semibold ${dp >= 80 ? 'text-green-700' : dp >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{dp}%</span> : <span className="text-gray-300">—</span>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {tab === 'repeat' && (
  <div className="space-y-4">

    {/* Filter bar */}
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-gray-500">Period:</span>
      {[
        { key: 'month_range', label: 'Monthly' },
        { key: 'quarter',     label: 'Quarterly' },
        { key: 'year',        label: 'Yearly' },
      ].map(f => (
        <button
          key={f.key}
          onClick={() => setFilterType(f.key)}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${filterType === f.key ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
        >
          {f.label}
        </button>
      ))}
    </div>

    {/* Best Selling Products Bar Chart */}
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100">
        <BarChart2 size={15} className="text-gray-400" />
        <h2 className="text-sm font-semibold text-gray-900">Best Selling Products</h2>
        <span className="ml-auto text-xs text-gray-400">Top {Math.min(repeatProducts.length, 10)}</span>
      </div>
      <div className="px-5 py-4">
        <ProductBarChart products={repeatProducts} />
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">

      {/* Top 5 Customers */}
      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100">
          <Users size={15} className="text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-900">Top Customers</h2>
          <span className="ml-auto text-xs text-gray-400">Top 5</span>
        </div>
        {repeatCustomers.length === 0
          ? <div className="py-10 text-center text-gray-400 text-sm">No customer data</div>
          : <div className="divide-y divide-gray-50">
              {repeatCustomers.slice(0, 5).map((c, i) => {
                const isVip     = c.count >= 3
                const isRegular = c.count >= 2

                // Most ordered product by this customer
                const prodMap = {}
                c.orders.forEach(o => {
                  const parts = (o.productName || '').split('|').filter(p => p.trim())
                  parts.forEach(p => { prodMap[p.trim()] = (prodMap[p.trim()] || 0) + 1 })
                })
                const topProduct = Object.entries(prodMap).sort((a,b) => b[1]-a[1])[0]

                return (
                  <div key={i} onClick={() => openModal(`Orders — ${c.name}`, c.orders)} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                        {i === 0 ? '🥇' : i+1}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-medium text-gray-800 truncate">{c.name}</span>
                          {isVip && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 flex-shrink-0">
                              ⭐ VIP
                            </span>
                          )}
                          {!isVip && isRegular && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 flex-shrink-0">
                              Regular
                            </span>
                          )}
                        </div>
                        {topProduct && (
                          <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                            Mostly: {topProduct[0]}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <span className="text-sm font-semibold text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-lg">{c.count} orders</span>
                    </div>
                  </div>
                )
              })}
            </div>
        }
      </div>

      {/* Top 5 Products list */}
      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100">
          <Package size={15} className="text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-900">Top Products</h2>
          <span className="ml-auto text-xs text-gray-400">Top 5</span>
        </div>
        {repeatProducts.length === 0
          ? <div className="py-10 text-center text-gray-400 text-sm">No product data</div>
          : <div className="divide-y divide-gray-50">
              {repeatProducts.slice(0, 5).map((p, i) => (
                <div key={i} onClick={() => openModal(`Orders — ${p.name}`, p.orders)} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      i === 0 ? 'bg-green-100 text-green-700' :
                      i === 1 ? 'bg-blue-100 text-blue-700' :
                      i === 2 ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {i === 0 ? '🏆' : i+1}
                    </span>
                    <div>
                      <span className="text-sm font-medium text-gray-800">{p.name}</span>
                      {i === 0 && (
                        <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">
                          Best Seller
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-green-700 bg-green-50 px-2.5 py-0.5 rounded-lg">{p.count} orders →</span>
                </div>
              ))}
            </div>
        }
      </div>
    </div>
  </div>
)}
      </div>

      {modal && <OrdersModal title={modal.title} orders={modal.orders} onClose={() => setModal(null)} />}
    </div>
  )
}