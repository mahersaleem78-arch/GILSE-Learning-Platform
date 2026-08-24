import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { AuthContextValue } from '@/types/auth'
import type { Profile, UserRole } from '@/types'

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, avatar_url, role, status, created_at, updated_at')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.error('[auth] Failed to fetch profile:', error.message)
    return null
  }
  return data as Profile | null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (!mounted) return
        setSession(data.session)
        setUser(data.session?.user ?? null)

        if (data.session?.user) {
          const p = await fetchProfile(data.session.user.id)
          if (mounted) setProfile(p)
        }

        if (mounted) setLoading(false)
      })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession)
        setUser(newSession?.user ?? null)

        if (newSession?.user) {
          (async () => {
            const p = await fetchProfile(newSession.user.id)
            if (mounted) setProfile(p)
          })()
        } else {
          setProfile(null)
        }

        if (mounted) setLoading(false)
      },
    )

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const role: UserRole | null = profile?.role ?? null

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      profile,
      role,
      loading,
      async signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        return { error: error?.message ?? null }
      },
      async signUp(email, password) {
        const { error } = await supabase.auth.signUp({ email, password })
        return { error: error?.message ?? null }
      },
      async signOut() {
        await supabase.auth.signOut()
        setProfile(null)
      },
    }),
    [session, user, profile, role, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
