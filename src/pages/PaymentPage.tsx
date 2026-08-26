import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { getCourse } from '@/services/courses'
import { createPayment, getPaymentConfig, verifyTransaction } from '@/services/payments'
import type { Course, Payment, PaymentConfig } from '@/types'

export default function PaymentPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [course, setCourse] = useState<Course | null>(null)
  const [config, setConfig] = useState<PaymentConfig | null>(null)
  const [payment, setPayment] = useState<Payment | null>(null)
  const [txHash, setTxHash] = useState('')
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user || !id) return
    Promise.all([getCourse(id), getPaymentConfig()]).then(([c, cfg]) => { setCourse(c); setConfig(cfg) }).catch(e => setError(e instanceof Error ? e.message : 'Unable to load payment details')).finally(() => setLoading(false))
  }, [id, user])

  const startPayment = async () => {
    if (!user || !course) return
    setWorking(true); setError(null)
    try {
      // Referral attribution is fixed at signup and derived by the database.
      // Never trust a referral code supplied by the payment page URL/localStorage.
      const p = await createPayment(user.id, course.id, Number(course.price))
      setPayment(p)
      localStorage.removeItem('gilse_referral_code')
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not create payment request.') } finally { setWorking(false) }
  }

  const handleVerify = async () => {
    if (!payment || !txHash.trim()) return
    setWorking(true); setError(null); setMessage(null)
    try {
      const result = await verifyTransaction(payment.id, txHash)
      if (!result.verified) throw new Error(result.message)
      setMessage(result.message)
      setTimeout(() => navigate('/dashboard', { replace: true }), 1500)
    } catch (e) { setError(e instanceof Error ? e.message : 'Verification failed.') } finally { setWorking(false) }
  }

  if (!user) return <div className="mx-auto max-w-xl px-4 py-16 text-center"><h1 className="text-2xl font-bold">Sign in required</h1><Link className="mt-4 inline-block text-primary-600" to="/login">Sign in</Link></div>
  if (loading) return <div className="mx-auto max-w-xl px-4 py-16 text-center">Loading payment details…</div>
  if (error && !course) return <div className="mx-auto max-w-xl px-4 py-16 text-center text-red-600">{error}</div>
  if (!course || !config) return null

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(config.wallet_address)}`

  return <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
    <Link to={`/courses/${course.id}`} className="text-sm text-neutral-600">← Back to course</Link>
    <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h1 className="font-heading text-2xl font-bold text-neutral-900">Pay for {course.title}</h1>
      <p className="mt-2 text-neutral-600">Pay exactly <strong>{course.price} USDT</strong> on the <strong>{config.network}</strong> network.</p>
      {!payment ? <button onClick={startPayment} disabled={working} className="btn-primary mt-6">{working ? 'Preparing…' : 'Show payment address'}</button> : <>
        <div className="mt-6 grid gap-6 md:grid-cols-2"><div className="flex flex-col items-center rounded-lg bg-neutral-50 p-4"><img src={qrUrl} alt="USDT payment QR code" className="h-56 w-56" /><p className="mt-2 text-xs text-neutral-500">Scan with Binance</p></div><div><div className="text-xs font-semibold uppercase text-neutral-500">USDT / {config.network}</div><div className="mt-2 break-all rounded-lg border bg-neutral-50 p-3 font-mono text-xs">{config.wallet_address}</div><button className="btn-secondary mt-3" onClick={() => navigator.clipboard.writeText(config.wallet_address)}>Copy address</button><div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">Send USDT on {config.network} only. Sending another asset or network may permanently lose the funds.</div></div></div>
        <div className="mt-6 border-t pt-6"><label className="label" htmlFor="txHash">Transaction hash</label><input id="txHash" className="input mt-1" value={txHash} onChange={e => setTxHash(e.target.value)} placeholder="Paste the TRON transaction hash" /><button onClick={handleVerify} disabled={working || !txHash.trim()} className="btn-primary mt-3">{working ? 'Verifying on TRON…' : 'Verify payment'}</button>{message && <p className="mt-3 text-sm text-emerald-700">{message}</p>}{error && <p className="mt-3 text-sm text-red-600">{error}</p>}</div>
      </>}
    </div>
  </div>
}
