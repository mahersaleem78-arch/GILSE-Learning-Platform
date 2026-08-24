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

function AdminPage() {
  return <div>Admin content</div>
}

function DashboardPage() {
  return <div>Dashboard page</div>
}

function LoginPage() {
  return <div>Login page</div>
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

function renderRoute(initialPath = '/admin') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="/admin"
          element={
            <RoleProtectedRoute roles={['admin', 'developer']}>
              <AdminPage />
            </RoleProtectedRoute>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('RoleProtectedRoute', () => {
  it('redirects to /login when there is no user', () => {
    mockedUseAuth.mockReturnValue(makeAuthValue({ loading: false, user: null, role: null }))
    renderRoute('/admin')
    expect(screen.getByText('Login page')).toBeInTheDocument()
  })

  it('redirects to /dashboard when user role is not allowed', () => {
    mockedUseAuth.mockReturnValue(
      makeAuthValue({
        loading: false,
        user: { id: 'test-user' } as User,
        role: 'student',
      }),
    )
    renderRoute('/admin')
    expect(screen.getByText('Dashboard page')).toBeInTheDocument()
  })

  it('renders children when user has an allowed role', () => {
    mockedUseAuth.mockReturnValue(
      makeAuthValue({
        loading: false,
        user: { id: 'test-user' } as User,
        role: 'admin',
      }),
    )
    renderRoute('/admin')
    expect(screen.getByText('Admin content')).toBeInTheDocument()
  })

  it('shows loading state while loading', () => {
    mockedUseAuth.mockReturnValue(makeAuthValue({ loading: true, user: null, role: null }))
    renderRoute('/admin')
    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })
})
