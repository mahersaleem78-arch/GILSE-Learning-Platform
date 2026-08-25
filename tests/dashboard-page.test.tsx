import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import DashboardPage from '@/pages/DashboardPage'
import type { AuthContextValue } from '@/types/auth'
import type { User, Session } from '@supabase/supabase-js'

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('@/services/enrollments', () => ({
  getStudentEnrollments: vi.fn(),
}))

import { useAuth } from '@/contexts/AuthContext'
import { getStudentEnrollments } from '@/services/enrollments'

const mockedUseAuth = vi.mocked(useAuth)
const mockedGetEnrollments = vi.mocked(getStudentEnrollments)

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

function renderDashboard() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/courses" element={<div>Courses page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('DashboardPage', () => {
  it('shows loading state initially', () => {
    mockedUseAuth.mockReturnValue(makeAuthValue({}))
    mockedGetEnrollments.mockReturnValue(new Promise(() => {}))
    renderDashboard()
    expect(screen.getByText('Loading your courses…')).toBeInTheDocument()
  })

  it('shows empty state when no enrollments', async () => {
    mockedUseAuth.mockReturnValue(
      makeAuthValue({
        profile: { id: 'u1', email: 'test@test.com', full_name: 'Test User', avatar_url: null, role: 'student', status: 'active', created_at: '', updated_at: '' },
      }),
    )
    mockedGetEnrollments.mockResolvedValue([])
    renderDashboard()
    expect(await screen.findByText('No enrollments yet')).toBeInTheDocument()
  })

  it('shows enrolled courses', async () => {
    mockedUseAuth.mockReturnValue(
      makeAuthValue({
        profile: { id: 'u1', email: 'test@test.com', full_name: 'Test User', avatar_url: null, role: 'student', status: 'active', created_at: '', updated_at: '' },
      }),
    )
    mockedGetEnrollments.mockResolvedValue([
      {
        id: 'e1',
        student_id: 'u1',
        course_id: 'c1',
        status: 'active',
        enrolled_at: '2026-08-25T00:00:00Z',
        completed_at: null,
        created_at: '2026-08-25T00:00:00Z',
        updated_at: '2026-08-25T00:00:00Z',
        course: {
          id: 'c1',
          title: 'Test Course',
          description: 'A test course',
          thumbnail_url: null,
          total_hours: 90,
          price: 0,
          currency: 'USD',
          status: 'published',
          slug: 'test-course',
        },
      },
    ])
    renderDashboard()
    expect(await screen.findByText('Test Course')).toBeInTheDocument()
    expect(screen.getByText('Continue course')).toBeInTheDocument()
    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('shows error state on failure', async () => {
    mockedUseAuth.mockReturnValue(
      makeAuthValue({
        profile: { id: 'u1', email: 'test@test.com', full_name: 'Test User', avatar_url: null, role: 'student', status: 'active', created_at: '', updated_at: '' },
      }),
    )
    mockedGetEnrollments.mockRejectedValue(new Error('Failed to load'))
    renderDashboard()
    expect(await screen.findByText('Failed to load')).toBeInTheDocument()
  })
})
