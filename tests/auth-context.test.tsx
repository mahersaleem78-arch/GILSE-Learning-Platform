import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'

function TestConsumer() {
  const auth = useAuth()
  return (
    <div>
      <span data-testid="loading">{String(auth.loading)}</span>
      <span data-testid="session">{String(auth.session !== null)}</span>
      <span data-testid="user">{String(auth.user !== null)}</span>
      <span data-testid="profile">{String(auth.profile !== null)}</span>
      <span data-testid="role">{String(auth.role)}</span>
      <span data-testid="has-signin">{String(typeof auth.signIn === 'function')}</span>
      <span data-testid="has-signup">{String(typeof auth.signUp === 'function')}</span>
      <span data-testid="has-signout">{String(typeof auth.signOut === 'function')}</span>
    </div>
  )
}

describe('AuthContext', () => {
  it('provides initial loading state and auth methods', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(screen.getByTestId('has-signin')).toHaveTextContent('true')
    expect(screen.getByTestId('has-signup')).toHaveTextContent('true')
    expect(screen.getByTestId('has-signout')).toHaveTextContent('true')
  })

  it('exposes profile and role fields (null when no session)', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByTestId('role')).toHaveTextContent('null')
  })

  it('throws when useAuth is used outside provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<TestConsumer />)).toThrow('useAuth must be used within an AuthProvider')
    spy.mockRestore()
  })
})
