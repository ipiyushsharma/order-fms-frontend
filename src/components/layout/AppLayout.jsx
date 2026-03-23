import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function AppLayout({ stats }) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar stats={stats} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Outlet context={stats} />
      </main>
    </div>
  )
}