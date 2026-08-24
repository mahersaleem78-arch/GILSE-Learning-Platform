import { describe, it, expect } from 'vitest'
import { supabase } from '@/lib/supabase'

describe('Supabase client', () => {
  it('should be initialized without throwing', () => {
    expect(supabase).toBeDefined()
    expect(supabase.auth).toBeDefined()
  })

  it('should have auth methods available', () => {
    expect(typeof supabase.auth.getSession).toBe('function')
    expect(typeof supabase.auth.signInWithPassword).toBe('function')
    expect(typeof supabase.auth.signUp).toBe('function')
    expect(typeof supabase.auth.signOut).toBe('function')
    expect(typeof supabase.auth.onAuthStateChange).toBe('function')
  })
})
