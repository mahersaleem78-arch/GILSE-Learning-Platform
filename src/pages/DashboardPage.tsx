import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getMyReferralProfile, getMyRewards } from '@/services/referrals'

export default function DashboardPage() {
  const { profile } = useAuth()
  const [referralCode, setReferralCode] = useState<string | null>(null)
  const [rewards, setRewards] = useState<any[]>([])
  useEffect(() => { if (!profile?.id) return; getMyReferralProfile(profile.id).then(r => setReferralCode(r.referral_code)).catch(() => {}); getMyRewards(profile.id).then(setRewards).catch(() => {}) }, [profile?.id])
  const referralUrl = referralCode ? `${window.location.origin}/r/${referralCode}` : ''
  return <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
    <div className="mb-8"><h1 className="font-heading text-3xl font-bold text-neutral-900">Welcome, {profile?.full_name || profile?.email}</h1><p className="mt-2 text-neutral-600">Your learning dashboard.</p></div>
    <div className="grid gap-6 md:grid-cols-2">
      <div className="card p-6"><h2 className="font-heading text-lg font-semibold">Your referral link</h2><p className="mt-2 text-sm text-neutral-600">Invite another student. When their course payment is verified, a $40 reward is created for admin approval.</p><div className="mt-4 break-all rounded-lg bg-neutral-50 p-3 font-mono text-xs">{referralUrl || 'Loading…'}</div>{referralUrl && <button className="btn-secondary mt-3" onClick={() => navigator.clipboard.writeText(referralUrl)}>Copy link</button>}</div>
      <div className="card p-6"><h2 className="font-heading text-lg font-semibold">Referral rewards</h2>{rewards.length===0 ? <p className="mt-2 text-sm text-neutral-500">No rewards yet.</p> : <div className="mt-3 space-y-2">{rewards.map(r => <div key={r.id} className="flex justify-between rounded bg-neutral-50 p-3 text-sm"><span>{r.amount} {r.currency}</span><strong>{r.status}</strong></div>)}</div>}</div>
    </div>
  </div>
}
