import { Link, Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 lg:grid lg:grid-cols-2">
      {/* Left: branding */}
      <div className="relative hidden flex-col justify-between bg-primary-700 p-12 text-white lg:flex">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-700 via-primary-800 to-primary-950" />
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 backdrop-blur">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <span className="font-heading text-lg font-bold">GILSE</span>
          </Link>
        </div>
        <div className="relative z-10 space-y-4">
          <h2 className="font-heading text-3xl font-bold leading-tight">
            Learning support for every learner.
          </h2>
          <p className="max-w-sm text-primary-100">
            Global Institute for Learning Support and Education — empowering students and instructors worldwide.
          </p>
        </div>
        <p className="relative z-10 text-sm text-primary-200">
          &copy; {new Date().getFullYear()} GILSE
        </p>
      </div>

      {/* Right: form area */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <span className="font-heading text-lg font-bold text-neutral-900">GILSE</span>
            </Link>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
