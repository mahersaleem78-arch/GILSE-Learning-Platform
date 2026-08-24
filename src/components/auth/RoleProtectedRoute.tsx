import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { LoadingState } from '@/components/ui/LoadingState'
import type { UserRole } from '@/types'

/**
 * Role-based route guard.
 *
 * NOTE: The profiles table and role column do not exist yet (Task 03+).
 * This component is structurally ready — once the `profiles` table is
 * created and a role-fetch hook is wired in, replace the placeholder
 * `currentRole` with the real value from the database.
 */
export default function RoleProtectedRoute({
  roles,
  children,
}: {
  roles: UserRole[]
  children: ReactNode
}) {
  const { user, loading } = useAuth()
  const location = useLocation()

  // Placeholder — will be replaced by a profile query in Task 03
  const currentRole: UserRole | null = null

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState label="Loading…" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (!currentRole || !roles.includes(currentRole)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
