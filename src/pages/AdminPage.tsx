import { EmptyState } from '@/components/ui/EmptyState'

export default function AdminPage() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="font-heading text-2xl font-bold text-neutral-900">Overview</h2>
        <p className="mt-1 text-sm text-neutral-600">Manage courses, users, payments, and certificates.</p>
      </div>

      <EmptyState
        title="Admin tools coming soon"
        message="Course management, user administration, payment tracking, and analytics will be built here by subsequent agents."
      />
    </div>
  )
}
