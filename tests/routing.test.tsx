import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import App from '@/App'

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

  it('renders the courses page at /courses', () => {
    renderApp('/courses')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Course Catalog/i)
  })

  it('renders the login page at /login', () => {
    renderApp('/login')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Sign in/i)
  })

  it('renders the signup page at /signup', () => {
    renderApp('/signup')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Create account/i)
  })

  it('renders 404 for unknown routes', () => {
    renderApp('/nonexistent')
    expect(screen.getByText('404')).toBeInTheDocument()
  })
})
