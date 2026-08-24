import { supabase } from '@/lib/supabase'
import type { Course, CourseStatus } from '@/types'

export type CourseInput = {
  title: string
  slug: string
  description: string | null
  thumbnail_url: string | null
  price: number
  currency: string
  total_hours: number
  status: CourseStatus
}

export type CourseUpdate = Partial<CourseInput>

export async function listPublishedCourses(): Promise<Course[]> {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function listAllCourses(): Promise<Course[]> {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function getCourse(id: string): Promise<Course | null> {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function createCourse(input: CourseInput): Promise<Course> {
  const { data, error } = await supabase
    .from('courses')
    .insert(input)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function updateCourse(id: string, updates: CourseUpdate): Promise<Course> {
  const { data, error } = await supabase
    .from('courses')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function deleteCourse(id: string): Promise<void> {
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', id)

  if (error) throw error
}
