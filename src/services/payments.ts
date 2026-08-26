import { supabase } from '@/lib/supabase'
import type { Payment } from '@/types'

export interface PaymentConfig {
  id: string
  asset: string
  network: string
  wallet_address: string
  wallet_name: string
  usdt_contract: string | null
  qr_enabled: boolean
  reward_amount: number
  active: boolean
}

export async function getPaymentConfig(): Promise<PaymentConfig> {
  const { data, error } = await supabase.from('payment_config').select('*').eq('active', true).limit(1).single()
  if (error) throw new Error(error.message)
  return data as PaymentConfig
}

export async function createPayment(studentId: string, courseId: string, amount: number, referralCode?: string | null): Promise<Payment> {
  const config = await getPaymentConfig()
  if (config.wallet_address.startsWith('CONFIGURE_')) throw new Error('Payment wallet is not configured by the administrator yet.')
  const { data, error } = await supabase.from('payments').insert({
    student_id: studentId,
    course_id: courseId,
    amount,
    currency: 'USD',
    asset: config.asset,
    network: config.network,
    wallet_address: config.wallet_address,
    referral_code: referralCode?.trim().toUpperCase() || null,
    status: 'pending',
  }).select('*').single()
  if (error) throw new Error(error.message)
  return data as Payment
}

export async function submitTransaction(paymentId: string, txHash: string): Promise<Payment> {
  const cleanHash = txHash.trim()
  if (!cleanHash || cleanHash.length < 20) throw new Error('Enter a valid transaction hash.')
  const { data, error } = await supabase.from('payments').update({ tx_hash: cleanHash, status: 'submitted', verification_error: null }).eq('id', paymentId).select('*').single()
  if (error) throw new Error(error.message)
  return data as Payment
}

export async function verifyTransaction(paymentId: string, txHash: string): Promise<{ verified: boolean; message: string }> {
  const { data, error } = await supabase.functions.invoke('verify-tron-payment', { body: { payment_id: paymentId, tx_hash: txHash.trim() } })
  if (error) throw new Error(error.message)
  return data as { verified: boolean; message: string }
}

export async function listStudentPayments(studentId: string): Promise<Payment[]> {
  const { data, error } = await supabase.from('payments').select('*').eq('student_id', studentId).order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as Payment[]
}

export async function listAllPayments(): Promise<Payment[]> {
  const { data, error } = await supabase.from('payments').select('*').order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as Payment[]
}
