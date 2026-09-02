import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ErrorState } from '@/components/ui/ErrorState'
import { listPublishedCourses } from '@/services/courses'
import { completeRegistration, createRegistrationOrder, getRegistrationPaymentConfig, verifyRegistrationPayment, type RegistrationOrder, type RegistrationRole } from '@/services/registration'
import type { Course } from '@/types'

const roleBenefits: Record<RegistrationRole, string[]> = {
  student: [
    'التسجيل في دورة مدفوعة واحدة على الأقل وفتح حساب الطالب بعد تأكيد الدفع فقط.',
    'الوصول إلى محتوى الدورة المسجل بها ومتابعة التقدم من لوحة الطالب.',
    'شهادة إتمام رقمية قابلة للتحقق بعد استيفاء متطلبات الدورة.',
    'صفحة تحقق عامة للشهادة لمشاركة رقم الشهادة والتحقق من صحتها.',
    'حفظ سجل الدورات والمدفوعات والشهادات داخل حسابك.',
  ],
  instructor: [
    'إنشاء حساب مدرس بعد دفع رسم الانضمام الثابت البالغ 100 دولار فقط.',
    'إنشاء وإدارة مسودات الدورات والمحتوى التعليمي من لوحة المدرس.',
    'إرسال الدورات للمراجعة قبل نشرها للطلاب.',
    'الحصول على 50% من قيمة كل تسجيل مدفوع في دوراتك، مع تسجيل مستحقاتك داخل النظام.',
    'متابعة المبيعات والمستحقات وحالة الدفعات بعد اعتمادها من الإدارة.',
  ],
}

export default function SignupPage() {
  const navigate = useNavigate()
  const [role, setRole] = useState<RegistrationRole>('student')
  const [courses, setCourses] = useState<Course[]>([])
  const [courseId, setCourseId] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [order, setOrder] = useState<RegistrationOrder | null>(null)
  const [wallet, setWallet] = useState<{ wallet_address: string; network: string; asset: string } | null>(null)
  const [txHash, setTxHash] = useState('')
  const [step, setStep] = useState<'details' | 'payment' | 'account'>('details')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [working, setWorking] = useState(false)

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get('ref')?.trim().toUpperCase()
    if (ref && /^GILSE-[A-Z0-9]{8}$/.test(ref)) setReferralCode(ref)
    listPublishedCourses().then(setCourses).catch(() => setCourses([]))
  }, [])

  const selectedCourse = courses.find(course => course.id === courseId)
  const amount = role === 'instructor' ? 100 : selectedCourse?.price ?? 0

  const beginRegistration = async (e: FormEvent) => {
    e.preventDefault(); setError(null); setMessage(null)
    if (fullName.trim().length < 2) { setError('يرجى إدخال الاسم الكامل.'); return }
    if (!email.includes('@')) { setError('يرجى إدخال بريد إلكتروني صحيح.'); return }
    if (role === 'student' && !courseId) { setError('يجب اختيار دورة مدفوعة قبل إنشاء الحساب.'); return }
    if (role === 'student' && (!selectedCourse || selectedCourse.price <= 0)) { setError('يجب أن تكون الدورة المختارة مدفوعة.'); return }
    setWorking(true)
    try {
      const [createdOrder, config] = await Promise.all([
        createRegistrationOrder({ role, email, fullName, courseId: role === 'student' ? courseId : null, referralCode: referralCode || null }),
        getRegistrationPaymentConfig(),
      ])
      setOrder(createdOrder); setWallet(config); setStep('payment')
    } catch (e) { setError(e instanceof Error ? e.message : 'تعذر إنشاء طلب التسجيل.') }
    finally { setWorking(false) }
  }

  const verifyPayment = async () => {
    if (!order || !txHash.trim()) return
    setWorking(true); setError(null); setMessage(null)
    try {
      const result = await verifyRegistrationPayment(order, txHash)
      if (!result.verified) throw new Error(result.message)
      setMessage(result.message); setStep('account')
    } catch (e) { setError(e instanceof Error ? e.message : 'تعذر التحقق من الدفع.') }
    finally { setWorking(false) }
  }

  const finishAccount = async (e: FormEvent) => {
    e.preventDefault(); setError(null)
    if (!order) return
    if (password.length < 8) { setError('يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.'); return }
    if (password !== confirmPassword) { setError('كلمتا المرور غير متطابقتين.'); return }
    setWorking(true)
    try {
      const result = await completeRegistration({ order, email, fullName, password })
      if (!result.success) throw new Error(result.message)
      setMessage(result.message)
      setTimeout(() => navigate('/login', { replace: true }), 1200)
    } catch (e) { setError(e instanceof Error ? e.message : 'تعذر إكمال إنشاء الحساب.') }
    finally { setWorking(false) }
  }

  return <div className="mx-auto max-w-5xl">
    <h1 className="font-heading text-2xl font-bold text-neutral-900">التسجيل المدفوع في GILSE</h1>
    <p className="mt-2 text-sm text-neutral-600">لا يتم إنشاء حساب Supabase أو Profile قبل تأكيد الدفع بنجاح.</p>

    <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex gap-2">
          {(['student', 'instructor'] as RegistrationRole[]).map(item => <button key={item} type="button" onClick={() => { if (step === 'details') setRole(item) }} className={`rounded-lg px-4 py-2 text-sm font-semibold ${role === item ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-neutral-700'}`}>{item === 'student' ? 'طالب' : 'مدرس'}</button>)}
        </div>

        {step === 'details' && <form onSubmit={beginRegistration} className="mt-6 space-y-4">
          <div><label className="label" htmlFor="fullName">الاسم الكامل</label><input id="fullName" className="input" required value={fullName} onChange={e => setFullName(e.target.value)} /></div>
          <div><label className="label" htmlFor="email">البريد الإلكتروني</label><input id="email" type="email" className="input" required value={email} onChange={e => setEmail(e.target.value)} /></div>
          {role === 'student' ? <div><label className="label" htmlFor="course">الدورة المطلوبة</label><select id="course" className="input" required value={courseId} onChange={e => setCourseId(e.target.value)}><option value="">اختر دورة مدفوعة</option>{courses.filter(c => c.price > 0).map(c => <option key={c.id} value={c.id}>{c.title} — {c.price} {c.currency}</option>)}</select></div> : <div className="rounded-lg border border-primary-100 bg-primary-50 p-4 text-sm text-primary-900"><strong>رسم انضمام المدرس: 100 USD</strong><br />يتم دفع رسم الانضمام قبل إنشاء حساب المدرس.</div>}
          <div><label className="label" htmlFor="referral">رمز الإحالة (اختياري)</label><input id="referral" className="input" value={referralCode} onChange={e => setReferralCode(e.target.value.toUpperCase())} placeholder="GILSE-XXXXXXXX" /></div>
          <button className="btn-primary w-full" disabled={working}>{working ? 'جاري تجهيز طلب الدفع…' : `المتابعة إلى الدفع — ${amount || '—'} USD`}</button>
        </form>}

        {step === 'payment' && order && wallet && <div className="mt-6">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">ادفع <strong>{order.amount} USDT</strong> على شبكة <strong>{wallet.network}</strong> إلى العنوان التالي. لا يتم إنشاء الحساب قبل التحقق من المعاملة.</div>
          <div className="mt-4 break-all rounded-lg border bg-neutral-50 p-4 font-mono text-xs">{wallet.wallet_address}</div>
          <button type="button" className="btn-secondary mt-3" onClick={() => navigator.clipboard.writeText(wallet.wallet_address)}>نسخ عنوان الدفع</button>
          <label className="label mt-6" htmlFor="txHash">Transaction Hash</label>
          <input id="txHash" className="input mt-1" value={txHash} onChange={e => setTxHash(e.target.value)} placeholder="أدخل معرف معاملة TRON" />
          <button type="button" onClick={verifyPayment} disabled={working || !txHash.trim()} className="btn-primary mt-3 w-full">{working ? 'جاري التحقق على TRON…' : 'تحقق من الدفع'}</button>
        </div>}

        {step === 'account' && order && <form onSubmit={finishAccount} className="mt-6 space-y-4">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">تم تأكيد الدفع. الآن فقط سيتم إنشاء حسابك في Supabase.</div>
          <div><label className="label" htmlFor="password">كلمة المرور</label><input id="password" type="password" autoComplete="new-password" className="input" required value={password} onChange={e => setPassword(e.target.value)} /></div>
          <div><label className="label" htmlFor="confirmPassword">تأكيد كلمة المرور</label><input id="confirmPassword" type="password" autoComplete="new-password" className="input" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} /></div>
          <button className="btn-primary w-full" disabled={working}>{working ? 'جاري إنشاء الحساب…' : 'إنشاء الحساب بعد الدفع'}</button>
        </form>}

        {error && <div className="mt-5"><ErrorState message={error} /></div>}
        {message && <p className="mt-5 text-sm text-emerald-700">{message}</p>}
        <p className="mt-6 text-sm text-neutral-600">لديك حساب مسبقاً؟ <Link to="/login" className="font-medium text-primary-600">تسجيل الدخول</Link></p>
      </div>

      <aside className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-bold text-neutral-900">مزايا {role === 'student' ? 'الطالب' : 'المدرس'}</h2>
        <ul className="mt-4 space-y-3 text-sm text-neutral-700">{roleBenefits[role].map(item => <li key={item} className="flex gap-2"><span className="text-primary-600">✓</span><span>{item}</span></li>)}</ul>
        {role === 'student' && <div className="mt-6 rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-xs leading-5 text-neutral-600"><strong>بخصوص الشهادات:</strong> شهادة GILSE الرقمية تتضمن رقم شهادة فريد وصفحة تحقق عامة. لا ينبغي وصفها بأنها «معتمدة من جامعة أكسفورد» أو استخدام شعار Oxford إلا إذا كانت هناك شراكة أو اعتماد رسمي موثق من الجامعة. جامعة Oxford نفسها توضح أن شهادات وبرامجها الرسمية تصدر ضمن برامجها ووحداتها المعتمدة. citeturn0search0turn0search2</div>}
        {role === 'instructor' && <div className="mt-6 rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-xs leading-5 text-neutral-600">نسبة المدرس ثابتة عند <strong>50%</strong> من قيمة التسجيل المدفوع في دورته. لا يستطيع المدرس تغيير النسبة من الواجهة، والنشر النهائي للدورة يبقى خاضعاً لمراجعة الإدارة.</div>}
      </aside>
    </div>
  </div>
}
