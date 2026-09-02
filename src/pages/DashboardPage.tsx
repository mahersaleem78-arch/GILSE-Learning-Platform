import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { getMyReferralProfile, getMyRewards } from '@/services/referrals'
import { listMyEnrollments, type EnrollmentWithCourse } from '@/services/enrollments'
import type { ReferralReward } from '@/types'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'

export default function DashboardPage() {
  const { profile } = useAuth()
  const [referralCode, setReferralCode] = useState<string | null>(null)
  const [rewards, setRewards] = useState<ReferralReward[]>([])
  const [enrollments, setEnrollments] = useState<EnrollmentWithCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!profile?.id) return
    let mounted = true
    setLoading(true); setError(null)
    Promise.all([getMyReferralProfile(profile.id), getMyRewards(profile.id), listMyEnrollments(profile.id)])
      .then(([referral, rewardData, enrollmentData]) => {
        if (!mounted) return
        setReferralCode(referral.referral_code); setRewards(rewardData); setEnrollments(enrollmentData)
      })
      .catch((err) => { if (mounted) setError(err instanceof Error ? err.message : 'Failed to load your dashboard.') })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [profile?.id])

  const referralUrl = referralCode ? `${window.location.origin}/r/${referralCode}` : ''

  if (loading) return <div className="flex items-center justify-center py-20"><LoadingState label="Loading your dashboard…" /></div>

  return <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
    <div className="mb-8"><h1 className="font-heading text-3xl font-bold text-neutral-900">Welcome, {profile?.full_name || profile?.email}</h1><p className="mt-2 text-neutral-600">Your learning dashboard.</p></div>
    {error && <div className="mb-6"><ErrorState message={error} /></div>}
    <section className="mb-8"><div className="mb-4 flex items-center justify-between"><h2 className="font-heading text-xl font-semibold text-neutral-900">My courses</h2><Link to="/courses" className="text-sm font-medium text-primary-600 hover:text-primary-700">Browse courses</Link></div>{enrollments.length === 0 ? <EmptyState title="No enrolled courses yet" message="Choose a course from the catalog to start learning." action={<Link to="/courses" className="btn-primary btn-sm mt-2">Browse courses</Link>} /> : <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{enrollments.map((item) => <Link key={item.id} to={`/courses/${item.course_id}`} className="card-hover p-5"><h3 className="font-heading font-semibold text-neutral-900">{item.course.title}</h3><p className="mt-2 text-sm text-neutral-600">{item.course.total_hours} hours · {item.status}</p>{item.status === 'completed' && <p className="mt-2 text-xs font-semibold text-success-700">Completed</p>}</Link>)}</div>}</section>
    <div className="grid gap-6 md:grid-cols-2">
      <div className="card p-6"><h2 className="font-heading text-lg font-semibold">Your referral link</h2><p className="mt-2 text-sm text-neutral-600">Invite another student. When their eligible course payment is verified, a reward is created for admin approval.</p><div className="mt-4 break-all rounded-lg bg-neutral-50 p-3 font-mono text-xs">{referralUrl || 'No referral code available yet.'}</div>{referralUrl && <button className="btn-secondary mt-3" onClick={() => void navigator.clipboard.writeText(referralUrl)}>Copy link</button>}</div>
      <div className="card p-6"><h2 className="font-heading text-lg font-semibold">Referral rewards</h2>{rewards.length === 0 ? <p className="mt-2 text-sm text-neutral-500">No rewards yet.</p> : <div className="mt-3 space-y-2">{rewards.map(r => <div key={r.id} className="flex justify-between rounded bg-neutral-50 p-3 text-sm"><span>{r.amount} {r.currency}</span><strong>{r.status}</strong></div>)}</div>}</div>
    </div>
  </div>
}
