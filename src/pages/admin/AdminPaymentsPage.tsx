import { useEffect, useState } from 'react'
import { listAdminPayments } from '@/services/admin'
import type { Payment } from '@/types'

const statuses = ['all', 'pending', 'submitted', 'verified', 'failed', 'cancelled']

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true); setError(null)
    try { setPayments(await listAdminPayments({ status, search: search.trim() })) }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed to load payments') }
    finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [status])

  return <div>
    <h2 className="font-heading text-2xl font-bold text-neutral-900">Payments</h2>
    <p className="mt-1 text-sm text-neutral-600">Review USDT/TRON payment requests. Verification is authoritative and cannot be manually forged from the student client.</p>
    <div className="mt-6 flex flex-wrap gap-3"><input className="input max-w-md" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') void load() }} placeholder="Search transaction hash or payment ID" /><select className="input w-auto" value={status} onChange={e => setStatus(e.target.value)}>{statuses.map(s => <option key={s} value={s}>{s}</option>)}</select><button className="btn-secondary" onClick={() => void load()} disabled={loading}>{loading ? 'Loading…' : 'Search'}</button></div>
    {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    <div className="mt-6 overflow-x-auto rounded-lg border border-neutral-200 bg-white"><table className="min-w-full text-left text-sm"><thead className="bg-neutral-50"><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Student</th><th className="px-4 py-3">Course</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Network</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">TX hash</th></tr></thead><tbody className="divide-y divide-neutral-100">{payments.map(p => <tr key={p.id}><td className="px-4 py-3 whitespace-nowrap">{new Date(p.created_at).toLocaleString()}</td><td className="px-4 py-3 font-mono text-xs">{p.student_id.slice(0, 8)}…</td><td className="px-4 py-3 font-mono text-xs">{p.course_id.slice(0, 8)}…</td><td className="px-4 py-3 font-semibold">{p.amount} {p.asset}</td><td className="px-4 py-3">{p.network}</td><td className="px-4 py-3">{p.status}</td><td className="max-w-xs truncate px-4 py-3 font-mono text-xs" title={p.tx_hash ?? ''}>{p.tx_hash ?? '—'}</td></tr>)}{payments.length===0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-neutral-500">No payments found.</td></tr>}</tbody></table></div>
  </div>
}
