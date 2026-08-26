import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

const navClass = ({ isActive }: { isActive: boolean }) => `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive ? 'bg-primary-50 text-primary-700' : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'}`

export default function AdminLayout() {
  const { user, signOut } = useAuth(); const navigate = useNavigate()
  const handleSignOut = async () => { await signOut(); navigate('/') }
  return <div className="flex min-h-screen bg-neutral-50">
    <aside className="hidden w-64 flex-col border-r border-neutral-200 bg-white lg:flex">
      <Link to="/admin" className="flex h-16 items-center gap-2.5 border-b border-neutral-200 px-6"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white font-bold">G</div><span className="font-heading text-base font-bold text-neutral-900">GILSE Admin</span></Link>
      <nav className="flex-1 space-y-1 p-4"><NavLink to="/admin" end className={navClass}>Overview</NavLink><NavLink to="/admin/courses" end className={navClass}>Courses</NavLink><NavLink to="/admin/payments" className={navClass}>Payments</NavLink><NavLink to="/admin/rewards" className={navClass}>Referral rewards</NavLink></nav>
      <div className="border-t border-neutral-200 p-4"><p className="truncate text-xs text-neutral-500">{user?.email}</p><button onClick={handleSignOut} className="mt-2 w-full btn-ghost btn-sm justify-start">Sign out</button></div>
    </aside>
    <div className="flex flex-1 flex-col"><header className="flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-4 sm:px-6 lg:px-8"><h1 className="font-heading text-lg font-semibold text-neutral-900">Admin Dashboard</h1><Link to="/" className="btn-ghost btn-sm">Back to site</Link></header><main className="flex-1 p-4 sm:p-6 lg:p-8"><Outlet /></main></div>
  </div>
}
