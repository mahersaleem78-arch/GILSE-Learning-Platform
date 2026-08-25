import { supabase } from '@/lib/supabase'
import type { Enrollment, EnrollmentStatus, Course } from '@/types'

export type EnrollmentInput = {
  course_id: string
}

export type EnrollmentUpdate = {
  status?: EnrollmentStatus
  completed_at?: string | null
}

export type DashboardEnrollment = Enrollment & {
  course: Pick<Course, 'id' | 'title' | 'description' | 'thumbnail_url' | 'total_hours' | 'price' | 'currency' | 'status' | 'slug'>
}

export async function enrollStudent(courseId: string): Promise<Enrollment> {
  const { data: existing, error: checkError } = await supabase
    .from('enrollments')
    .select('id')
    .eq('course_id', courseId)
    .maybeSingle()

  if (checkError) throw checkError
  if (existing) throw new Error('You are already enrolled in this course.')

  const { data, error } = await supabase
    .from('enrollments')
    .insert({ course_id: courseId })
    .select('*')
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('You are already enrolled in this course.')
    }
    throw error
  }
  return data
}

export async function getStudentEnrollments(): Promise<DashboardEnrollment[]> {
  const { data, error } = await supabase
    .from('enrollments')
    .select(`
      *,
      course:courses (
        id,
        title,
        description,
        thumbnail_url,
        total_hours,
        price,
        currency,
        status,
        slug
      )
    `)
    .order('enrolled_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as DashboardEnrollment[]
}

export async function getEnrollmentByCourse(courseId: string): Promise<Enrollment | null> {
  const { data, error } = await supabase
    .from('enrollments')
    .select('*')
    .eq('course_id', courseId)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function isStudentEnrolled(courseId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('enrollments')
    .select('id')
    .eq('course_id', courseId)
    .maybeSingle()

  if (error) throw error
  return data !== null
}

export async function updateEnrollmentStatus(
  enrollmentId: string,
  status: EnrollmentStatus,
  completedAt: string | null = null,
): Promise<Enrollment> {
  const updates: EnrollmentUpdate = { status }
  if (status === 'completed' && completedAt) {
    updates.completed_at = completedAt
  } else if (status !== 'completed') {
    updates.completed_at = null
  }

  const { data, error } = await supabase
    .from('enrollments')
    .update(updates)
    .eq('id', enrollmentId)
    .select('*')
    .single()

  if (error) throw error
  return data
}
