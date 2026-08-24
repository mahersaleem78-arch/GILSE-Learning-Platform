import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-700 via-primary-800 to-primary-900 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.12),transparent_60%)]" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          <div className="max-w-2xl animate-fade-in">
            <span className="badge bg-white/10 text-primary-100 ring-1 ring-inset ring-white/20">
              Global Institute for Learning Support and Education
            </span>
            <h1 className="mt-6 font-heading text-4xl font-bold leading-tight tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Learning support for every learner, everywhere.
            </h1>
            <p className="mt-6 text-lg text-primary-100">
              GILSE provides educational courses, learner support, and instructor tools — designed to help students with learning difficulties succeed.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link to="/courses" className="btn-lg bg-white text-primary-700 hover:bg-primary-50">
                Browse courses
              </Link>
              <Link to="/signup" className="btn-lg border border-white/30 text-white hover:bg-white/10">
                Create account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { title: 'Learning-support courses', desc: 'Courses designed for learners with diverse educational needs.', icon: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25' },
            { title: 'Progress tracking', desc: 'Monitor lesson completion and course progress in real time.', icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z' },
            { title: 'Certificates', desc: 'Earn verifiable certificates upon course completion.', icon: 'M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.001 3.001 0 01-1.186 3.568 3 3 0 01-3.443.744 3 3 0 01-3.14-.04 3 3 0 01-3.442-.744 3.001 3.001 0 01-1.187-3.568A3.001 3.001 0 013 12c0-1.268.63-2.39 1.593-3.068a3.001 3.001 0 011.186-3.568 3 3 0 013.443-.744 3 3 0 013.14.04 3 3 0 013.442.744 3.001 3.001 0 011.187 3.568A3.001 3.001 0 0121 12z' },
            { title: 'Multilingual', desc: 'Content available in 20 languages with full RTL support.', icon: 'M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21a9 9 0 009-9 9 9 0 00-9 9zm0 0a9 9 0 01-9-9 9 9 0 019 9zm-9-9a9.004 9.004 0 016.747-8.716M21 12a9.004 9.004 0 00-6.747-8.716' },
            { title: 'Instructor tools', desc: 'Manage courses, modules, and lessons with intuitive tools.', icon: 'M4.5 12.75l6 6 9-13.5' },
            { title: 'Secure payments', desc: 'Crypto and QR payment options with blockchain verification.', icon: 'M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z' },
          ].map((f) => (
            <div key={f.title} className="card-hover p-6 animate-slide-up">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-50">
                <svg className="h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
                </svg>
              </div>
              <h3 className="mt-4 font-heading text-lg font-semibold text-neutral-900">{f.title}</h3>
              <p className="mt-2 text-sm text-neutral-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-neutral-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 rounded-2xl bg-neutral-900 p-10 text-center sm:flex-row sm:text-left">
            <div>
              <h2 className="font-heading text-2xl font-bold text-white">Ready to start learning?</h2>
              <p className="mt-2 text-neutral-400">Create an account and browse our course catalog today.</p>
            </div>
            <Link to="/signup" className="btn-lg bg-primary-600 text-white hover:bg-primary-700">Get started</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
