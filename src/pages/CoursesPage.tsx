import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Course } from '@/types'
import { listPublishedCourses } from '@/services/courses'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await listPublishedCourses()
        setCourses(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load courses')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingState label="Loading courses…" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <ErrorState message={error} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-neutral-900">Course Catalog</h1>
        <p className="mt-2 text-neutral-600">Browse available learning-support courses.</p>
      </div>

      {courses.length === 0 ? (
        <EmptyState
          title="No courses available yet"
          message="The course catalog will appear here once courses are published."
          action={<Link to="/" className="btn-primary btn-sm mt-2">Back to home</Link>}
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Link key={course.id} to={`/courses/${course.id}`} className="card-hover overflow-hidden group">
              {course.thumbnail_url ? (
                <div className="aspect-video w-full overflow-hidden bg-neutral-100">
                  <img src={course.thumbnail_url} alt={course.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                </div>
              ) : (
                <div className="flex aspect-video w-full items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
                  <svg className="h-12 w-12 text-primary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                </div>
              )}
              <div className="p-5">
                <h3 className="font-heading text-lg font-semibold text-neutral-900 group-hover:text-primary-700 transition-colors">{course.title}</h3>
                {course.description && <p className="mt-2 line-clamp-2 text-sm text-neutral-600">{course.description}</p>}
                <div className="mt-4 flex items-center gap-4 text-sm text-neutral-500">
                  <span className="flex items-center gap-1">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {course.total_hours}h
                  </span>
                  <span className="font-semibold text-neutral-900">{course.price > 0 ? `${course.price} ${course.currency}` : 'Free'}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
