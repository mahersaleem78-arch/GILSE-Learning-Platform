import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export default function StudentLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <span className="font-heading text-lg font-bold text-neutral-900">GILSE</span>
          </Link>

          <nav className="flex items-center gap-1">
            <NavLink to="/dashboard" className={({ isActive }) => `px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive ? 'text-primary-700 bg-primary-50' : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'}`}>
              Dashboard
            </NavLink>
            <NavLink to="/courses" className={({ isActive }) => `px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive ? 'text-primary-700 bg-primary-50' : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'}`}>
              Courses
            </NavLink>
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-neutral-600 sm:inline">
              {user?.email}
            </span>
            <button onClick={handleSignOut} className="btn-outline btn-sm">Sign out</button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
