import { supabase } from '@/lib/supabase'

export async function getMyReferralProfile(userId: string) {
  const { data, error } = await supabase.from('profiles').select('referral_code,referred_by').eq('id', userId).single()
  if (error) throw new Error(error.message)
  return data as { referral_code: string | null; referred_by: string | null }
}

export async function getMyRewards(userId: string) {
  const { data, error } = await supabase.from('referral_rewards').select('*').eq('referrer_id', userId).order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function listRewards() {
  const { data, error } = await supabase.from('referral_rewards').select('*').order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function updateReward(id: string, status: 'approved' | 'paid' | 'rejected', adminNote?: string) {
  const { data: user } = await supabase.auth.getUser()
  const patch: Record<string, unknown> = { status, admin_note: adminNote ?? null }
  if (status === 'approved') { patch.approved_by = user.user?.id ?? null; patch.approved_at = new Date().toISOString() }
  if (status === 'paid') patch.paid_at = new Date().toISOString()
  const { error } = await supabase.from('referral_rewards').update(patch).eq('id', id)
  if (error) throw new Error(error.message)
}
