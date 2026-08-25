import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import CourseDetailPage from '@/pages/CourseDetailPage'
import type { AuthContextValue } from '@/types/auth'
import type { User, Session } from '@supabase/supabase-js'

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('@/services/courses', () => ({
  getCourse: vi.fn(),
}))

vi.mock('@/services/modules', () => ({
  listModules: vi.fn(),
}))

vi.mock('@/services/lessons', () => ({
  listLessons: vi.fn(),
}))

vi.mock('@/services/enrollments', () => ({
  getEnrollmentByCourse: vi.fn(),
  enrollStudent: vi.fn(),
}))

import { useAuth } from '@/contexts/AuthContext'
import { getCourse } from '@/services/courses'
import { listModules } from '@/services/modules'
import { listLessons } from '@/services/lessons'
import { getEnrollmentByCourse, enrollStudent } from '@/services/enrollments'

const mockedUseAuth = vi.mocked(useAuth)
const mockedGetCourse = vi.mocked(getCourse)
const mockedListModules = vi.mocked(listModules)
const mockedListLessons = vi.mocked(listLessons)
const mockedGetEnrollment = vi.mocked(getEnrollmentByCourse)
const mockedEnrollStudent = vi.mocked(enrollStudent)

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

function renderCourseDetail(courseId = 'c1') {
  return render(
    <MemoryRouter initialEntries={[`/courses/${courseId}`]}>
      <Routes>
        <Route path="/courses/:id" element={<CourseDetailPage />} />
        <Route path="/courses" element={<div>Courses list</div>} />
        <Route path="/login" element={<div>Login page</div>} />
        <Route path="/dashboard" element={<div>Dashboard page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

const SAMPLE_COURSE = {
  id: 'c1',
  title: 'Test Course',
  slug: 'test-course',
  description: 'A test course',
  thumbnail_url: null,
  price: 0,
  currency: 'USD',
  total_hours: 90,
  status: 'published',
  created_by: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

describe('CourseDetailPage enrollment states', () => {
  it('shows sign-in prompt for unauthenticated users', async () => {
    mockedUseAuth.mockReturnValue(makeAuthValue({ user: null }))
    mockedGetCourse.mockResolvedValue(SAMPLE_COURSE as never)
    mockedListModules.mockResolvedValue([])
    mockedListLessons.mockResolvedValue([])

    renderCourseDetail()
    expect(await screen.findByText('Sign in to enroll in this course.')).toBeInTheDocument()
  })

  it('shows Enroll now button for authenticated non-enrolled users', async () => {
    mockedUseAuth.mockReturnValue(makeAuthValue({ user: { id: 'u1' } as User }))
    mockedGetCourse.mockResolvedValue(SAMPLE_COURSE as never)
    mockedListModules.mockResolvedValue([])
    mockedListLessons.mockResolvedValue([])
    mockedGetEnrollment.mockResolvedValue(null)

    renderCourseDetail()
    expect(await screen.findByText('Enroll now')).toBeInTheDocument()
  })

  it('shows enrolled state for already-enrolled users', async () => {
    mockedUseAuth.mockReturnValue(makeAuthValue({ user: { id: 'u1' } as User }))
    mockedGetCourse.mockResolvedValue(SAMPLE_COURSE as never)
    mockedListModules.mockResolvedValue([])
    mockedListLessons.mockResolvedValue([])
    mockedGetEnrollment.mockResolvedValue({
      id: 'e1',
      student_id: 'u1',
      course_id: 'c1',
      status: 'active',
      enrolled_at: '2026-08-25T00:00:00Z',
      completed_at: null,
      created_at: '2026-08-25T00:00:00Z',
      updated_at: '2026-08-25T00:00:00Z',
    } as never)

    renderCourseDetail()
    expect(await screen.findByText('You are enrolled in this course')).toBeInTheDocument()
    expect(screen.getByText('Go to dashboard')).toBeInTheDocument()
  })

  it('enrolls successfully and shows enrolled state', async () => {
    mockedUseAuth.mockReturnValue(makeAuthValue({ user: { id: 'u1' } as User }))
    mockedGetCourse.mockResolvedValue(SAMPLE_COURSE as never)
    mockedListModules.mockResolvedValue([])
    mockedListLessons.mockResolvedValue([])
    mockedGetEnrollment.mockResolvedValue(null)
    mockedEnrollStudent.mockResolvedValue({
      id: 'e1',
      student_id: 'u1',
      course_id: 'c1',
      status: 'active',
      enrolled_at: '2026-08-25T00:00:00Z',
      completed_at: null,
      created_at: '2026-08-25T00:00:00Z',
      updated_at: '2026-08-25T00:00:00Z',
    } as never)

    renderCourseDetail()
    const enrollBtn = await screen.findByText('Enroll now')
    enrollBtn.click()
    await waitFor(() => {
      expect(screen.getByText('You are enrolled in this course')).toBeInTheDocument()
    })
    expect(mockedEnrollStudent).toHaveBeenCalledWith('c1')
  })

  it('shows error when enrollment fails', async () => {
    mockedUseAuth.mockReturnValue(makeAuthValue({ user: { id: 'u1' } as User }))
    mockedGetCourse.mockResolvedValue(SAMPLE_COURSE as never)
    mockedListModules.mockResolvedValue([])
    mockedListLessons.mockResolvedValue([])
    mockedGetEnrollment.mockResolvedValue(null)
    mockedEnrollStudent.mockRejectedValue(new Error('Already enrolled'))

    renderCourseDetail()
    const enrollBtn = await screen.findByText('Enroll now')
    enrollBtn.click()
    await waitFor(() => {
      expect(screen.getByText('Already enrolled')).toBeInTheDocument()
    })
  })
})
