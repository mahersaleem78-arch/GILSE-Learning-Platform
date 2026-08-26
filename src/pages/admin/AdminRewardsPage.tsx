import { useEffect, useState } from 'react'
import { listRewards, updateReward } from '@/services/referrals'

export default function AdminRewardsPage() {
  const [rewards, setRewards] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const load = () => listRewards().then(setRewards).catch(e => setError(e instanceof Error ? e.message : 'Failed to load rewards'))
  useEffect(() => { void load() }, [])
  const act = async (id: string, status: 'approved'|'paid'|'rejected') => { try { await updateReward(id, status); await load() } catch (e) { setError(e instanceof Error ? e.message : 'Update failed') } }
  return <div><h2 className="font-heading text-2xl font-bold text-neutral-900">Referral rewards</h2><p className="mt-1 text-sm text-neutral-600">A $40 reward is created only after a referred student's payment is verified. Admin approval is required before payment.</p>{error && <p className="mt-4 text-sm text-red-600">{error}</p>}<div className="mt-6 space-y-3">{rewards.map(r => <div key={r.id} className="rounded-lg border border-neutral-200 bg-white p-4"><div className="flex flex-wrap items-center justify-between gap-4"><div><div className="font-semibold text-neutral-900">{r.amount} {r.currency}</div><div className="text-xs text-neutral-500">Created {new Date(r.created_at).toLocaleString()}</div><div className="mt-1 text-xs">Status: <strong>{r.status}</strong></div></div><div className="flex gap-2">{r.status==='pending_approval' && <><button className="btn-primary" onClick={() => act(r.id,'approved')}>Approve</button><button className="btn-secondary" onClick={() => act(r.id,'rejected')}>Reject</button></>}{r.status==='approved' && <button className="btn-primary" onClick={() => act(r.id,'paid')}>Mark paid</button>}</div></div></div>)}{rewards.length===0 && <div className="rounded-lg border border-dashed p-8 text-center text-neutral-500">No referral rewards yet.</div>}</div></div>
}
