import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

function ProtectedPage() {
  return <div>Protected content</div>
}

function renderProtectedRoute(initialPath = '/dashboard') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider>
        <Routes>
          <Route element={<ProtectedRoute><ProtectedPage /></ProtectedRoute>}>
            <Route path="/dashboard" element={<ProtectedPage />} />
          </Route>
          <Route path="/login" element={<div>Login page</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  it('redirects to /login when no user is present', async () => {
    renderProtectedRoute('/dashboard')
    // While loading, it shows a spinner; once settled without a user it redirects.
    // Give it time to resolve the session check.
    expect(await screen.findByText(/Login page/i, {}, { timeout: 3000 })).toBeInTheDocument()
  })
})
