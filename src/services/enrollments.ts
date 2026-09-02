import { supabase } from '@/lib/supabase'
import type { Course, Enrollment } from '@/types'

export type EnrollmentWithCourse = Enrollment & { course: Course }

export async function getMyEnrollment(studentId: string, courseId: string): Promise<Enrollment | null> {
  const { data, error } = await supabase
    .from('enrollments')
    .select('*')
    .eq('student_id', studentId)
    .eq('course_id', courseId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data as Enrollment | null
}

export async function listMyEnrollments(studentId: string): Promise<EnrollmentWithCourse[]> {
  const { data, error } = await supabase
    .from('enrollments')
    .select('id,student_id,course_id,status,enrolled_at,completed_at,courses(*)')
    .eq('student_id', studentId)
    .in('status', ['active', 'completed'])
    .order('enrolled_at', { ascending: false })
  if (error) throw new Error(error.message)

  return ((data ?? []) as Array<Enrollment & { courses: Course | null }>).flatMap((row) =>
    row.courses ? [{ ...row, course: row.courses } as EnrollmentWithCourse] : [],
  )
}

export async function enrollInCourse(studentId: string, courseId: string): Promise<Enrollment> {
  const { data, error } = await supabase
    .from('enrollments')
    .insert({ student_id: studentId, course_id: courseId, status: 'active' })
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data as Enrollment
}
