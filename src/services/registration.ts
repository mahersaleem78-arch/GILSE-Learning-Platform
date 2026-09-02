import { supabase } from '@/lib/supabase'

export type RegistrationRole = 'student' | 'instructor'

export type RegistrationOrder = {
  order_id: string
  registration_token: string
  role: RegistrationRole
  email: string
  amount: number
  currency: string
  expires_at: string
  course_id: string | null
}

export async function createRegistrationOrder(input: {
  role: RegistrationRole
  email: string
  fullName: string
  courseId?: string | null
  referralCode?: string | null
}): Promise<RegistrationOrder> {
  const { data, error } = await supabase.rpc('create_registration_order', {
    p_role: input.role,
    p_email: input.email,
    p_full_name: input.fullName,
    p_course_id: input.courseId ?? null,
    p_referral_code: input.referralCode ?? null,
  })
  if (error) throw new Error(error.message)
  return data as RegistrationOrder
}

export async function getRegistrationPaymentConfig() {
  const { data, error } = await supabase.from('payment_config').select('*').eq('active', true).limit(1).single()
  if (error) throw new Error(error.message)
  if (String(data.wallet_address).startsWith('CONFIGURE_')) throw new Error('Payment wallet is not configured by the administrator yet.')
  return data as { wallet_address: string; network: string; asset: string; qr_enabled: boolean }
}

export async function verifyRegistrationPayment(order: RegistrationOrder, txHash: string) {
  const { data, error } = await supabase.functions.invoke('verify-registration-payment', {
    body: { order_id: order.order_id, registration_token: order.registration_token, tx_hash: txHash.trim() },
  })
  if (error) throw new Error(error.message)
  return data as { verified: boolean; message: string }
}

export async function completeRegistration(input: { order: RegistrationOrder; email: string; fullName: string; password: string }) {
  const { data, error } = await supabase.functions.invoke('complete-registration', {
    body: { order_id: input.order.order_id, registration_token: input.order.registration_token, email: input.email, full_name: input.fullName, password: input.password },
  })
  if (error) throw new Error(error.message)
  return data as { success: boolean; role: RegistrationRole; message: string }
}
