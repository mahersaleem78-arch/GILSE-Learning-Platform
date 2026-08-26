import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { ErrorState } from '@/components/ui/ErrorState'

export default function SignupPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get('ref')?.trim().toUpperCase()
    if (ref && /^GILSE-[A-Z0-9]{8}$/.test(ref)) {
      setReferralCode(ref)
      localStorage.setItem('gilse_referral_code', ref)
    }
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setError(null)
    if (password !== confirmPassword) { setError('Passwords do not match.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setSubmitting(true)
    const { error: signUpError } = await signUp(email, password)
    if (signUpError) { setError(signUpError); setSubmitting(false); return }
    navigate('/dashboard', { replace: true })
  }

  return <div>
    <h1 className="font-heading text-2xl font-bold text-neutral-900">Create account</h1>
    <p className="mt-2 text-sm text-neutral-600">Join GILSE and start your learning journey.</p>
    {referralCode && <div className="mt-5 rounded-lg border border-primary-100 bg-primary-50 p-3 text-sm text-primary-800">Referral code applied: <strong>{referralCode}</strong></div>}
    {error && <div className="mt-6"><ErrorState message={error} /></div>}
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div><label className="label" htmlFor="email">Email</label><input id="email" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="input" placeholder="you@example.com" /></div>
      <div><label className="label" htmlFor="password">Password</label><input id="password" type="password" required autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} className="input" placeholder="At least 6 characters" /></div>
      <div><label className="label" htmlFor="confirmPassword">Confirm password</label><input id="confirmPassword" type="password" required autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="input" placeholder="••••••••" /></div>
      <button type="submit" disabled={submitting} className="btn-primary w-full">{submitting ? 'Creating account…' : 'Create account'}</button>
    </form>
    <p className="mt-6 text-sm text-neutral-600">Already have an account? <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700">Sign in</Link></p>
  </div>
}
