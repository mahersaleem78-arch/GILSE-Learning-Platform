import { EmptyState } from '@/components/ui/EmptyState'
import { Link } from 'react-router-dom'

export default function CoursesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-neutral-900">Course Catalog</h1>
        <p className="mt-2 text-neutral-600">Browse available learning-support courses.</p>
      </div>

      <EmptyState
        title="No courses available yet"
        message="The course catalog will appear here once courses are published."
        action={
          <Link to="/" className="btn-primary btn-sm mt-2">Back to home</Link>
        }
      />
    </div>
  )
}
