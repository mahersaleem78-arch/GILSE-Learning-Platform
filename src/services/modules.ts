import { supabase } from '@/lib/supabase'
import type { Module } from '@/types'

export type ModuleInput = {
  course_id: string
  title: string
  description: string | null
  order_index: number
}

export type ModuleUpdate = Partial<ModuleInput>

export async function listModules(courseId: string): Promise<Module[]> {
  const { data, error } = await supabase
    .from('modules')
    .select('*')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function createModule(input: ModuleInput): Promise<Module> {
  const { data, error } = await supabase
    .from('modules')
    .insert(input)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function updateModule(id: string, updates: ModuleUpdate): Promise<Module> {
  const { data, error } = await supabase
    .from('modules')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function deleteModule(id: string): Promise<void> {
  const { error } = await supabase
    .from('modules')
    .delete()
    .eq('id', id)

  if (error) throw error
}
