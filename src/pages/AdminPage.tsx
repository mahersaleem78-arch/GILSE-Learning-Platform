import { Link } from 'react-router-dom'

export default function AdminPage() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="font-heading text-2xl font-bold text-neutral-900">Overview</h2>
        <p className="mt-1 text-sm text-neutral-600">Manage courses, users, payments, and certificates.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Link to="/admin/courses" className="card-hover p-6 group">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-50">
            <svg className="h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <h3 className="mt-4 font-heading text-lg font-semibold text-neutral-900 group-hover:text-primary-700 transition-colors">Courses</h3>
          <p className="mt-2 text-sm text-neutral-600">Create, edit, and manage courses, modules, and lessons.</p>
        </Link>

        <div className="card p-6 opacity-60">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-neutral-100">
            <svg className="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.243m0 0V15M18 18.75c0 .621-.504 1.125-1.125 1.125H5.25A1.125 1.125 0 014.125 18.75v-7.5A1.125 1.125 0 015.25 10.125h11.25c.621 0 1.125.504 1.125 1.125v7.5z" />
            </svg>
          </div>
          <h3 className="mt-4 font-heading text-lg font-semibold text-neutral-900">Users</h3>
          <p className="mt-2 text-sm text-neutral-600">User management coming in a future task.</p>
        </div>

        <div className="card p-6 opacity-60">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-neutral-100">
            <svg className="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
            </svg>
          </div>
          <h3 className="mt-4 font-heading text-lg font-semibold text-neutral-900">Payments</h3>
          <p className="mt-2 text-sm text-neutral-600">Payment tracking coming in a future task.</p>
        </div>
      </div>
    </div>
  )
}
