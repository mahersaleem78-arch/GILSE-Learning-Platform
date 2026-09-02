import { useEffect, useState } from 'react'
import { listAdminRewards, setRewardStatus } from '@/services/admin'
import type { ReferralReward } from '@/types'

export default function AdminRewardsPage() {
  const [rewards, setRewards] = useState<ReferralReward[]>([])
  const [status, setStatus] = useState<'all' | ReferralReward['status']>('all')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      setRewards(await listAdminRewards(status))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load rewards')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [status])

  const act = async (id: string, next: 'approved' | 'paid' | 'rejected') => {
    try {
      await setRewardStatus(id, next)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed')
    }
  }

  return (
    <div>
      <h2 className="font-heading text-2xl font-bold text-neutral-900">Referral rewards</h2>
      <p className="mt-1 text-sm text-neutral-600">
        A $40 reward is created only after a referred student's payment is verified. Approval and payout are administrator-only operations.
      </p>
      <div className="mt-6">
        <select
          className="input w-auto"
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          disabled={loading}
        >
          {['all', 'pending_approval', 'approved', 'paid', 'rejected'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {loading && <p className="mt-6 text-sm text-neutral-500">Loading rewards…</p>}
      {!loading && (
        <div className="mt-6 space-y-3">
          {rewards.map((r) => (
            <div key={r.id} className="rounded-lg border border-neutral-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="font-semibold text-neutral-900">{r.amount} {r.currency}</div>
                  <div className="mt-1 text-xs text-neutral-500">Referrer: {r.referrer_id}</div>
                  <div className="text-xs text-neutral-500">Referred student: {r.referred_student_id}</div>
                  <div className="text-xs text-neutral-500">Payment: {r.payment_id}</div>
                  <div className="mt-1 text-xs">Status: <strong>{r.status}</strong></div>
                </div>
                <div className="flex gap-2">
                  {r.status === 'pending_approval' && (
                    <>
                      <button className="btn-primary" onClick={() => void act(r.id, 'approved')}>Approve</button>
                      <button className="btn-secondary" onClick={() => void act(r.id, 'rejected')}>Reject</button>
                    </>
                  )}
                  {r.status === 'approved' && (
                    <button className="btn-primary" onClick={() => void act(r.id, 'paid')}>Mark paid</button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {rewards.length === 0 && (
            <div className="rounded-lg border border-dashed p-8 text-center text-neutral-500">No referral rewards found.</div>
          )}
        </div>
      )}
    </div>
  )
}
