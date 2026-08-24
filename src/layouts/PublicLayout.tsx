import { Link, Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export default function PublicLayout() {
  const { user, signOut } = useAuth()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <span className="font-heading text-lg font-bold text-neutral-900">GILSE</span>
          </Link>

          <nav className="hidden items-center gap-1 sm:flex">
            <NavLink to="/" end className={({ isActive }) => `px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive ? 'text-primary-700 bg-primary-50' : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'}`}>
              Home
            </NavLink>
            <NavLink to="/courses" className={({ isActive }) => `px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive ? 'text-primary-700 bg-primary-50' : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'}`}>
              Courses
            </NavLink>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link to="/dashboard" className="btn-ghost btn-sm hidden sm:inline-flex">Dashboard</Link>
                <button onClick={() => void signOut()} className="btn-outline btn-sm">Sign out</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost btn-sm">Sign in</Link>
                <Link to="/signup" className="btn-primary btn-sm">Get started</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-neutral-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-neutral-500">
              &copy; {new Date().getFullYear()} GILSE — Global Institute for Learning Support and Education
            </p>
            <nav className="flex gap-6 text-sm text-neutral-500">
              <Link to="/courses" className="hover:text-neutral-900 transition-colors">Courses</Link>
              <Link to="/login" className="hover:text-neutral-900 transition-colors">Sign in</Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  )
}
