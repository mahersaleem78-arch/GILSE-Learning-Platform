import { useParams, Link } from 'react-router-dom'
import { EmptyState } from '@/components/ui/EmptyState'

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <Link to="/courses" className="mb-6 inline-flex items-center gap-1.5 text-sm text-neutral-600 hover:text-neutral-900">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
        Back to courses
      </Link>

      <EmptyState
        title="Course not available yet"
        message={`Course ID "${id}" — course details and enrollment will be available here once the course system is built.`}
      />
    </div>
  )
}
