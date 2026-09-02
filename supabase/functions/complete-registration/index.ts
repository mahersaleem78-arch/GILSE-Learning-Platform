import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Content-Type': 'application/json' }
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: cors })
async function sha256Hex(value: string) { const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)); return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('') }
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const body = await req.json(); const orderId = String(body.order_id ?? '').trim(); const token = String(body.registration_token ?? '').trim(); const email = String(body.email ?? '').trim().toLowerCase(); const password = String(body.password ?? ''); const fullName = String(body.full_name ?? '').trim()
    if (!orderId || !token || !email || !password || !fullName) throw new Error('All account fields are required.')
    if (password.length < 8) throw new Error('Password must be at least 8 characters.')
    if (password.length > 72) throw new Error('Password is too long.')
    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!); const tokenHash = await sha256Hex(token)
    const { data: order, error: orderError } = await db.from('registration_orders').select('*').eq('id', orderId).eq('registration_token_hash', tokenHash).single()
    if (orderError || !order) throw new Error('Registration order not found.')
    if (order.status !== 'payment_verified') throw new Error('Payment must be verified before the account is created.')
    if (new Date(order.expires_at).getTime() <= Date.now()) throw new Error('This registration session has expired.')
    if (String(order.email).toLowerCase() !== email) throw new Error('Email does not match the paid registration.')
    if (String(order.full_name).trim() !== fullName) throw new Error('Full name does not match the paid registration.')
    const { data: existing, error: existingError } = await db.auth.admin.getUserByEmail(email)
    if (existing?.user) throw new Error('An account already exists for this email. Please sign in.')
    if (existingError && !/not found/i.test(existingError.message)) throw new Error(existingError.message)
    const metadata = { full_name: fullName, registration_order_id: order.id, ...(order.referral_code ? { referral_code: order.referral_code } : {}) }
    const { data: created, error: createError } = await db.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: metadata })
    if (createError || !created.user) throw new Error(createError?.message ?? 'Unable to create account.')
    const userId = created.user.id
    try {
      if (order.role === 'student') {
        const { error: enrollmentError } = await db.from('enrollments').insert({ student_id: userId, course_id: order.course_id, status: 'active' }); if (enrollmentError) throw enrollmentError
        const { data: verifiedPayment } = await db.from('registration_payments').select('*').eq('registration_order_id', order.id).single(); const { data: paymentConfig } = await db.from('payment_config').select('*').eq('active', true).limit(1).single()
        const { data: payment, error: paymentInsertError } = await db.from('payments').insert({ student_id: userId, course_id: order.course_id, amount: order.amount, currency: order.currency, asset: 'USDT', network: 'TRON', wallet_address: verifiedPayment?.wallet_address ?? paymentConfig?.wallet_address, tx_hash: verifiedPayment?.tx_hash, status: 'verified', verified_at: order.verified_at }).select('*').single(); if (paymentInsertError || !payment) throw paymentInsertError ?? new Error('Unable to create payment record.')
        const { data: course } = await db.from('courses').select('id,instructor_id,instructor_share_percent').eq('id', order.course_id).single()
        if (course?.instructor_id) { const pct = Number(course.instructor_share_percent ?? 50); const gross = Number(order.amount); const instructorAmount = Math.round(gross * pct) / 100; const platformAmount = Math.round((gross - instructorAmount) * 100) / 100; const { error: payoutError } = await db.from('instructor_payouts').insert({ instructor_id: course.instructor_id, course_id: course.id, payment_id: payment.id, gross_amount: gross, instructor_share_percent: pct, instructor_amount: instructorAmount, platform_amount: platformAmount, currency: order.currency, status: 'pending_approval' }); if (payoutError) throw payoutError }
        if (order.referral_code) { const { data: referrer } = await db.from('profiles').select('id').eq('referral_code', String(order.referral_code).toUpperCase()).maybeSingle(); if (referrer && referrer.id !== userId) { const { error: rewardError } = await db.from('referral_rewards').insert({ referrer_id: referrer.id, referred_student_id: userId, payment_id: payment.id, amount: paymentConfig?.reward_amount ?? 40, currency: 'USD', status: 'pending_approval' }); if (rewardError) throw rewardError } }
        await db.from('audit_log').insert({ actor_id: userId, action: 'paid_student_registration_completed', entity_type: 'registration_order', entity_id: order.id, details: { payment_id: payment.id, course_id: order.course_id } })
      } else { await db.from('audit_log').insert({ actor_id: userId, action: 'paid_instructor_registration_completed', entity_type: 'registration_order', entity_id: order.id, details: { registration_fee: order.amount } }) }
      const { error: consumeError } = await db.from('registration_orders').update({ status: 'consumed', consumed_at: new Date().toISOString() }).eq('id', order.id).eq('status', 'payment_verified'); if (consumeError) throw consumeError
    } catch (error) { await db.auth.admin.deleteUser(userId); throw error }
    return response({ success: true, role: order.role, message: order.role === 'student' ? 'Account created and course enrollment activated.' : 'Instructor account created. Your $100 onboarding payment is recorded.' })
  } catch (error) { return response({ success: false, message: error instanceof Error ? error.message : 'Registration failed.' }, 400) }
})
