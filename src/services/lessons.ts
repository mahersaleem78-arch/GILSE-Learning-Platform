import { supabase } from '@/lib/supabase'
import type { Lesson } from '@/types'

export type LessonInput = {
  module_id: string
  title: string
  description: string | null
  content: string | null
  video_url: string | null
  duration_minutes: number | null
  order_index: number
  is_preview: boolean
}

export type LessonUpdate = Partial<LessonInput>

export async function listLessons(moduleId: string): Promise<Lesson[]> {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('module_id', moduleId)
    .order('order_index', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function createLesson(input: LessonInput): Promise<Lesson> {
  const { data, error } = await supabase
    .from('lessons')
    .insert(input)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function updateLesson(id: string, updates: LessonUpdate): Promise<Lesson> {
  const { data, error } = await supabase
    .from('lessons')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function deleteLesson(id: string): Promise<void> {
  const { error } = await supabase
    .from('lessons')
    .delete()
    .eq('id', id)

  if (error) throw error
}
