import { useAuth } from '@/contexts/AuthContext'
import { EmptyState } from '@/components/ui/EmptyState'

export default function DashboardPage() {
  const { profile } = useAuth()
  const displayName = profile?.full_name || profile?.email

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-neutral-900">
          Welcome, {displayName}
        </h1>
        <p className="mt-2 text-neutral-600">Your learning dashboard.</p>
      </div>

      <EmptyState
        title="No enrollments yet"
        message="Your enrolled courses and progress will appear here once the course system is built."
      />
    </div>
  )
}
