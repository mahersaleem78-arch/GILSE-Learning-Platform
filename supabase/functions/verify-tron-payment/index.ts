import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response(JSON.stringify({ verified: false, message: 'Authentication required.' }), { status: 401, headers: cors })

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const tronGridKey = Deno.env.get('TRONGRID_API_KEY') ?? ''
    const usdtContract = Deno.env.get('TRON_USDT_CONTRACT') ?? ''
    const db = createClient(supabaseUrl, serviceKey)
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } })
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) return new Response(JSON.stringify({ verified: false, message: 'Invalid session.' }), { status: 401, headers: cors })

    const { payment_id, tx_hash } = await req.json()
    if (!payment_id || !tx_hash) throw new Error('payment_id and tx_hash are required.')

    const { data: payment, error: paymentError } = await db.from('payments').select('*').eq('id', payment_id).single()
    if (paymentError || !payment) throw new Error('Payment request not found.')
    if (payment.student_id !== user.id) throw new Error('You do not own this payment request.')
    if (payment.status === 'verified') return new Response(JSON.stringify({ verified: true, message: 'Payment already verified.' }), { headers: cors })

    const { data: config } = await db.from('payment_config').select('*').eq('active', true).limit(1).single()
    if (!config || config.wallet_address.startsWith('CONFIGURE_')) throw new Error('Payment wallet is not configured.')
    const contract = config.usdt_contract || usdtContract
    if (!contract) throw new Error('TRON USDT contract is not configured.')

    const url = new URL(`https://api.trongrid.io/v1/accounts/${config.wallet_address}/transactions/trc20`)
    url.searchParams.set('only_confirmed', 'true')
    url.searchParams.set('limit', '200')
    url.searchParams.set('contract_address', contract)
    const response = await fetch(url, { headers: tronGridKey ? { 'TRON-PRO-API-KEY': tronGridKey } : {} })
    if (!response.ok) throw new Error(`TRON verification service returned ${response.status}.`)
    const payload = await response.json()
    const tx = (payload.data ?? []).find((item: any) => String(item.transaction_id).toLowerCase() === String(tx_hash).toLowerCase())
    if (!tx) {
      await db.from('payments').update({ tx_hash, verification_error: 'Transaction not found or not confirmed on TRON.', status: 'submitted' }).eq('id', payment.id)
      return new Response(JSON.stringify({ verified: false, message: 'Transaction not found or not yet confirmed on TRON.' }), { headers: cors })
    }

    const decimals = Number(tx.token_info?.decimals ?? 6)
    const rawValue = BigInt(String(tx.value))
    const expectedRaw = BigInt(Math.round(Number(payment.amount) * (10 ** decimals)))
    const toMatches = String(tx.to).toLowerCase() === String(config.wallet_address).toLowerCase()
    const tokenMatches = String(tx.token_info?.address ?? '').toLowerCase() === contract.toLowerCase()
    const amountMatches = rawValue >= expectedRaw
    if (!toMatches || !tokenMatches || !amountMatches) {
      const reason = !toMatches ? 'Recipient wallet does not match.' : !tokenMatches ? 'Token contract does not match USDT on TRON.' : 'Received amount is below the required course price.'
      await db.from('payments').update({ tx_hash, verification_error: reason, status: 'failed' }).eq('id', payment.id)
      return new Response(JSON.stringify({ verified: false, message: reason }), { headers: cors })
    }

    const { error: verifyError } = await db.from('payments').update({ tx_hash, status: 'verified', verification_error: null, verified_at: new Date().toISOString() }).eq('id', payment.id)
    if (verifyError) throw verifyError

    const { error: enrollmentError } = await db.from('enrollments').upsert({ student_id: payment.student_id, course_id: payment.course_id, status: 'active' }, { onConflict: 'student_id,course_id' })
    if (enrollmentError) throw enrollmentError

    if (payment.referral_code) {
      const { data: referrer } = await db.from('profiles').select('id').eq('referral_code', String(payment.referral_code).toUpperCase()).maybeSingle()
      if (referrer && referrer.id !== payment.student_id) {
        await db.from('referral_rewards').upsert({ referrer_id: referrer.id, referred_student_id: payment.student_id, payment_id: payment.id, amount: config.reward_amount, currency: 'USD', status: 'pending_approval' }, { onConflict: 'payment_id' })
      }
    }

    await db.from('audit_log').insert({ actor_id: user.id, action: 'payment_verified', entity_type: 'payment', entity_id: payment.id, details: { tx_hash, network: 'TRON', asset: 'USDT' } })
    return new Response(JSON.stringify({ verified: true, message: 'USDT payment verified and course enrollment activated.' }), { headers: cors })
  } catch (error) {
    return new Response(JSON.stringify({ verified: false, message: error instanceof Error ? error.message : 'Verification failed.' }), { status: 400, headers: cors })
  }
})
