import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { getStudentEnrollments, type DashboardEnrollment } from '@/services/enrollments'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-success-100 text-success-700',
  completed: 'bg-primary-100 text-primary-700',
  cancelled: 'bg-neutral-100 text-neutral-600',
}

export default function DashboardPage() {
  const { profile } = useAuth()
  const displayName = profile?.full_name || profile?.email

  const [enrollments, setEnrollments] = useState<DashboardEnrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getStudentEnrollments()
      setEnrollments(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load your enrollments')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Profile summary */}
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100">
          <span className="font-heading text-lg font-bold text-primary-700">
            {displayName?.charAt(0).toUpperCase() ?? '?'}
          </span>
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold text-neutral-900">Welcome, {displayName}</h1>
          <p className="text-sm text-neutral-600">{profile?.email}</p>
        </div>
      </div>

      {/* Enrolled courses */}
      <div className="mb-6">
        <h2 className="font-heading text-xl font-semibold text-neutral-900">Your courses</h2>
        <p className="mt-1 text-sm text-neutral-600">Courses you are enrolled in.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <LoadingState label="Loading your courses…" />
        </div>
      ) : error ? (
        <ErrorState message={error} action={<button onClick={() => void load()} className="btn-primary btn-sm mt-2">Retry</button>} />
      ) : enrollments.length === 0 ? (
        <EmptyState
          title="No enrollments yet"
          message="Browse the course catalog and enroll in a course to get started."
          action={<Link to="/courses" className="btn-primary btn-sm mt-2">Browse courses</Link>}
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {enrollments.map((enrollment) => (
            <div key={enrollment.id} className="card-hover overflow-hidden flex flex-col">
              {enrollment.course.thumbnail_url ? (
                <div className="aspect-video w-full overflow-hidden bg-neutral-100">
                  <img src={enrollment.course.thumbnail_url} alt={enrollment.course.title} className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="flex aspect-video w-full items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
                  <svg className="h-12 w-12 text-primary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                </div>
              )}
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-center justify-between">
                  <span className={`badge ${STATUS_STYLES[enrollment.status] ?? ''}`}>{enrollment.status}</span>
                  <span className="text-xs text-neutral-400">
                    Enrolled {new Date(enrollment.enrolled_at).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="mt-3 font-heading text-lg font-semibold text-neutral-900">{enrollment.course.title}</h3>
                {enrollment.course.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-neutral-600">{enrollment.course.description}</p>
                )}
                <div className="mt-3 flex items-center gap-4 text-sm text-neutral-500">
                  <span className="flex items-center gap-1">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {enrollment.course.total_hours}h
                  </span>
                </div>

                {/* Progress placeholder — Bolt #7 will implement real progress tracking */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-neutral-500">
                    <span>Progress</span>
                    <span>0%</span>
                  </div>
                  <div className="mt-1 h-2 w-full rounded-full bg-neutral-200">
                    <div className="h-2 rounded-full bg-primary-500" style={{ width: '0%' }} />
                  </div>
                </div>

                <div className="mt-auto pt-4">
                  <Link to={`/courses/${enrollment.course_id}`} className="btn-primary btn-sm w-full">
                    Continue course
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
