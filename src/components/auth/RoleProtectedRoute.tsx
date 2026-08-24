import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { LoadingState } from '@/components/ui/LoadingState'
import type { UserRole } from '@/types'

export default function RoleProtectedRoute({
  roles,
  children,
}: {
  roles: UserRole[]
  children: ReactNode
}) {
  const { user, role, loading } = useAuth()
  const location = useLocation()

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

  if (!role || !roles.includes(role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
