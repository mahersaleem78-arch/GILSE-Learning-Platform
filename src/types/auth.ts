export type AuthContextValue = {
  session: import('@supabase/supabase-js').Session | null
  user: import('@supabase/supabase-js').User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}
