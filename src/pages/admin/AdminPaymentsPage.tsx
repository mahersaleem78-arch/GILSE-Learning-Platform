import { useEffect, useState } from 'react'
import { listAllPayments } from '@/services/payments'
import type { Payment } from '@/types'

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { listAllPayments().then(setPayments).catch(e => setError(e instanceof Error ? e.message : 'Failed to load payments')) }, [])
  return <div><h2 className="font-heading text-2xl font-bold text-neutral-900">Payments</h2><p className="mt-1 text-sm text-neutral-600">Review submitted USDT/TRON payments. Automatic verification is authoritative.</p>{error && <p className="mt-4 text-sm text-red-600">{error}</p>}<div className="mt-6 overflow-x-auto rounded-lg border border-neutral-200 bg-white"><table className="min-w-full text-left text-sm"><thead className="bg-neutral-50"><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Network</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">TX hash</th></tr></thead><tbody className="divide-y divide-neutral-100">{payments.map(p => <tr key={p.id}><td className="px-4 py-3">{new Date(p.created_at).toLocaleString()}</td><td className="px-4 py-3 font-semibold">{p.amount} USDT</td><td className="px-4 py-3">{p.network}</td><td className="px-4 py-3">{p.status}</td><td className="max-w-xs truncate px-4 py-3 font-mono text-xs">{p.tx_hash ?? '—'}</td></tr>)}{payments.length===0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-neutral-500">No payments yet.</td></tr>}</tbody></table></div></div>
}
