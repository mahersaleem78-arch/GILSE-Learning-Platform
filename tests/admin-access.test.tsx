import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import RoleProtectedRoute from '@/components/auth/RoleProtectedRoute'
import type { AuthContextValue } from '@/types/auth'
import type { User, Session } from '@supabase/supabase-js'

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

import { useAuth } from '@/contexts/AuthContext'

const mockedUseAuth = vi.mocked(useAuth)

function AdminCoursesPage() {
  return <div>Admin courses</div>
}

function DashboardPage() {
  return <div>Dashboard</div>
}

function LoginPage() {
  return <div>Login</div>
}

function makeAuthValue(overrides: Partial<AuthContextValue>): AuthContextValue {
  return {
    session: null as Session | null,
    user: null as User | null,
    profile: null,
    role: null,
    loading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    ...overrides,
  }
}

function renderAdminRoute(initialPath = '/admin/courses') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="/admin/courses"
          element={
            <RoleProtectedRoute roles={['admin', 'developer']}>
              <AdminCoursesPage />
            </RoleProtectedRoute>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Admin access control', () => {
  it('allows admin to access admin courses route', () => {
    mockedUseAuth.mockReturnValue(
      makeAuthValue({ user: { id: 'admin-1' } as User, role: 'admin' }),
    )
    renderAdminRoute()
    expect(screen.getByText('Admin courses')).toBeInTheDocument()
  })

  it('allows developer to access admin courses route', () => {
    mockedUseAuth.mockReturnValue(
      makeAuthValue({ user: { id: 'dev-1' } as User, role: 'developer' }),
    )
    renderAdminRoute()
    expect(screen.getByText('Admin courses')).toBeInTheDocument()
  })

  it('redirects student to dashboard', () => {
    mockedUseAuth.mockReturnValue(
      makeAuthValue({ user: { id: 'student-1' } as User, role: 'student' }),
    )
    renderAdminRoute()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('redirects instructor to dashboard', () => {
    mockedUseAuth.mockReturnValue(
      makeAuthValue({ user: { id: 'inst-1' } as User, role: 'instructor' }),
    )
    renderAdminRoute()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('redirects unauthenticated user to login', () => {
    mockedUseAuth.mockReturnValue(makeAuthValue({ user: null, role: null }))
    renderAdminRoute()
    expect(screen.getByText('Login')).toBeInTheDocument()
  })
})
