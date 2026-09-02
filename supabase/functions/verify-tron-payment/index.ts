import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: cors })
}

function decimalToRaw(value: string | number, decimals: number): bigint {
  const normalized = String(value).trim()
  if (!/^\d+(\.\d+)?$/.test(normalized)) throw new Error('Invalid payment amount.')
  const [whole, fraction = ''] = normalized.split('.')
  if (fraction.length > decimals && /[^0]/.test(fraction.slice(decimals))) throw new Error('Payment amount has more precision than the token supports.')
  const paddedFraction = fraction.slice(0, decimals).padEnd(decimals, '0')
  return BigInt(whole) * (10n ** BigInt(decimals)) + BigInt(paddedFraction || '0')
}

function isTronTransactionHash(value: string) {
  return /^[0-9a-f]{64}$/i.test(value)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return response({ verified: false, message: 'Authentication required.' }, 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const tronGridKey = Deno.env.get('TRONGRID_API_KEY') ?? ''
    const configuredContract = Deno.env.get('TRON_USDT_CONTRACT') ?? ''
    const db = createClient(supabaseUrl, serviceKey)
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } })
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) return response({ verified: false, message: 'Invalid session.' }, 401)

    const body = await req.json()
    const paymentId = String(body.payment_id ?? '').trim()
    const txHash = String(body.tx_hash ?? '').trim()
    if (!paymentId || !txHash) throw new Error('payment_id and tx_hash are required.')
    if (!isTronTransactionHash(txHash)) throw new Error('Invalid TRON transaction hash. Use the 64-character hexadecimal transaction ID.')

    const { data: payment, error: paymentError } = await db.from('payments').select('*').eq('id', paymentId).single()
    if (paymentError || !payment) throw new Error('Payment request not found.')
    if (payment.student_id !== user.id) throw new Error('You do not own this payment request.')
    if (payment.status === 'verified') return response({ verified: true, message: 'Payment already verified.' })

    const { data: existingHash } = await db.from('payments').select('id,student_id').ilike('tx_hash', txHash).neq('id', payment.id).maybeSingle()
    if (existingHash) throw new Error('This transaction hash has already been submitted for another payment.')

    const { data: config } = await db.from('payment_config').select('*').eq('active', true).limit(1).single()
    if (!config || config.wallet_address.startsWith('CONFIGURE_')) throw new Error('Payment wallet is not configured.')
    const contract = String(config.usdt_contract || configuredContract).trim()
    if (!contract) throw new Error('TRON USDT contract is not configured.')

    let tx: Record<string, unknown> | null = null
    let fingerprint: string | undefined
    for (let page = 0; page < 5 && !tx; page += 1) {
      const url = new URL(`https://api.trongrid.io/v1/accounts/${config.wallet_address}/transactions/trc20`)
      url.searchParams.set('only_confirmed', 'true')
      url.searchParams.set('limit', '200')
      url.searchParams.set('contract_address', contract)
      if (fingerprint) url.searchParams.set('fingerprint', fingerprint)
      const apiResponse = await fetch(url, { headers: tronGridKey ? { 'TRON-PRO-API-KEY': tronGridKey } : {} })
      if (!apiResponse.ok) throw new Error(`TRON verification service returned ${apiResponse.status}.`)
      const payload = await apiResponse.json()
      const candidates = (payload.data ?? []) as Record<string, unknown>[]
      tx = candidates.find((item) => String(item.transaction_id ?? '').toLowerCase() === txHash.toLowerCase()) ?? null
      fingerprint = payload.meta?.fingerprint
      if (!fingerprint) break
    }

    if (!tx) {
      await db.from('payments').update({ tx_hash: txHash, verification_error: 'Transaction not found or not confirmed on TRON.', status: 'submitted' }).eq('id', payment.id)
      return response({ verified: false, message: 'Transaction not found or not yet confirmed on TRON.' })
    }

    const decimals = Number((tx.token_info as Record<string, unknown> | undefined)?.decimals ?? 6)
    if (!Number.isInteger(decimals) || decimals < 0 || decimals > 18) throw new Error('Unsupported token precision.')
    const rawValue = BigInt(String(tx.value))
    const expectedRaw = decimalToRaw(payment.amount, decimals)
    const toMatches = String(tx.to ?? '').toLowerCase() === String(config.wallet_address).toLowerCase()
    const tokenMatches = String((tx.token_info as Record<string, unknown> | undefined)?.address ?? '').toLowerCase() === contract.toLowerCase()
    const amountMatches = rawValue === expectedRaw

    if (!toMatches || !tokenMatches || !amountMatches) {
      const reason = !toMatches ? 'Recipient wallet does not match.' : !tokenMatches ? 'Token contract does not match USDT on TRON.' : 'Received amount must exactly match the required course price.'
      await db.from('payments').update({ tx_hash: txHash, verification_error: reason, status: 'failed' }).eq('id', payment.id)
      return response({ verified: false, message: reason })
    }

    const { error: verifyError } = await db.from('payments').update({ tx_hash: txHash, status: 'verified', verification_error: null, verified_at: new Date().toISOString() }).eq('id', payment.id)
    if (verifyError) throw verifyError

    const { error: enrollmentError } = await db.from('enrollments').upsert({ student_id: payment.student_id, course_id: payment.course_id, status: 'active' }, { onConflict: 'student_id,course_id' })
    if (enrollmentError) {
      await db.from('payments').update({ status: 'failed', verification_error: `Enrollment activation failed: ${enrollmentError.message}` }).eq('id', payment.id)
      throw enrollmentError
    }

    if (payment.referral_code) {
      const { data: referrer } = await db.from('profiles').select('id').eq('referral_code', String(payment.referral_code).toUpperCase()).maybeSingle()
      if (referrer && referrer.id !== payment.student_id) {
        const { error: rewardError } = await db.from('referral_rewards').upsert({ referrer_id: referrer.id, referred_student_id: payment.student_id, payment_id: payment.id, amount: config.reward_amount, currency: 'USD', status: 'pending_approval' }, { onConflict: 'payment_id' })
        if (rewardError) console.error('[verify-tron-payment] referral reward creation failed:', rewardError.message)
      }
    }

    const { error: auditError } = await db.from('audit_log').insert({ actor_id: user.id, action: 'payment_verified', entity_type: 'payment', entity_id: payment.id, details: { tx_hash: txHash, network: 'TRON', asset: 'USDT' } })
    if (auditError) console.error('[verify-tron-payment] audit log failed:', auditError.message)

    return response({ verified: true, message: 'USDT payment verified and course enrollment activated.' })
  } catch (error) {
    return response({ verified: false, message: error instanceof Error ? error.message : 'Verification failed.' }, 400)
  }
})
