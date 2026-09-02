import { supabase } from '@/lib/supabase'
import type { Payment, ReferralReward, RewardStatus } from '@/types'

async function requireAdmin() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Authentication required.')
  const { data: profile, error } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (error) throw new Error(error.message)
  if (profile.role !== 'admin' && profile.role !== 'developer') throw new Error('Administrator access required.')
  return user.id
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function isTronTransactionHash(value: string) {
  return /^[1-9A-HJ-NP-Za-km-z]{20,128}$/.test(value)
}

export async function listAdminPayments(filters?: { status?: string; search?: string }): Promise<Payment[]> {
  await requireAdmin()
  let query = supabase.from('payments').select('*').order('created_at', { ascending: false })
  if (filters?.status && filters.status !== 'all') query = query.eq('status', filters.status)
  const search = filters?.search?.trim()
  if (search) {
    if (isUuid(search)) query = query.eq('id', search)
    else if (isTronTransactionHash(search)) query = query.ilike('tx_hash', search)
    else return []
  }
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as Payment[]
}

export async function listAdminRewards(status?: RewardStatus | 'all'): Promise<ReferralReward[]> {
  await requireAdmin()
  let query = supabase.from('referral_rewards').select('*').order('created_at', { ascending: false })
  if (status && status !== 'all') query = query.eq('status', status)
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as ReferralReward[]
}

export async function setRewardStatus(id: string, status: 'approved' | 'rejected' | 'paid', adminNote?: string) {
  const actorId = await requireAdmin()
  const { data: current, error: readError } = await supabase.from('referral_rewards').select('status').eq('id', id).single()
  if (readError) throw new Error(readError.message)
  const allowed = (current.status === 'pending_approval' && (status === 'approved' || status === 'rejected')) || (current.status === 'approved' && status === 'paid')
  if (!allowed) throw new Error(`Invalid reward transition: ${current.status} -> ${status}`)

  const patch: Record<string, unknown> = { status, admin_note: adminNote?.trim() || null }
  if (status === 'approved') { patch.approved_by = actorId; patch.approved_at = new Date().toISOString() }
  if (status === 'paid') patch.paid_at = new Date().toISOString()

  const { error } = await supabase.from('referral_rewards').update(patch).eq('id', id)
  if (error) throw new Error(error.message)
}
