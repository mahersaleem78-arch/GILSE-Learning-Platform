import { supabase } from '@/lib/supabase'
import type { ReferralReward } from '@/types'
import { setRewardStatus } from '@/services/admin'

export async function getMyReferralProfile(userId: string) {
  const { data, error } = await supabase.from('profiles').select('referral_code,referred_by').eq('id', userId).single()
  if (error) throw new Error(error.message)
  return data as { referral_code: string | null; referred_by: string | null }
}

export async function getMyRewards(userId: string): Promise<ReferralReward[]> {
  const { data, error } = await supabase.from('referral_rewards').select('*').eq('referrer_id', userId).order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as ReferralReward[]
}

export async function listRewards(): Promise<ReferralReward[]> {
  const { data, error } = await supabase.from('referral_rewards').select('*').order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as ReferralReward[]
}

/** Kept for existing callers; authorization and state transitions are enforced by admin.ts and database RLS/triggers. */
export async function updateReward(id: string, status: 'approved' | 'paid' | 'rejected', adminNote?: string) {
  await setRewardStatus(id, status, adminNote)
}
