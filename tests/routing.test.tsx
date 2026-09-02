import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import App from '@/App'

vi.mock('@/services/courses', () => ({
  listPublishedCourses: vi.fn().mockResolvedValue([]),
}))

function renderApp(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('Application routing', () => {
  it('renders the home page at /', () => {
    renderApp('/')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Learning support for every learner/i)
  })

  it('renders the courses page at /courses', async () => {
    renderApp('/courses')
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(/Course Catalog/i)
  })

  it('renders the login page at /login', () => {
    renderApp('/login')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Sign in/i)
  })

  it('renders the paid-first signup page at /signup', () => {
    renderApp('/signup')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/التسجيل المدفوع في GILSE/i)
  })

  it('renders 404 for unknown routes', () => {
    renderApp('/nonexistent')
    expect(screen.getByText('404')).toBeInTheDocument()
  })
})
