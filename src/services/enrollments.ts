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
  const { data: enrollmentRows, error: enrollmentError } = await supabase
    .from('enrollments')
    .select('*')
    .eq('student_id', studentId)
    .in('status', ['active', 'completed'])
    .order('enrolled_at', { ascending: false })
  if (enrollmentError) throw new Error(enrollmentError.message)

  const enrollments = (enrollmentRows ?? []) as Enrollment[]
  if (enrollments.length === 0) return []

  const courseIds = [...new Set(enrollments.map((enrollment) => enrollment.course_id))]
  const { data: courses, error: courseError } = await supabase.from('courses').select('*').in('id', courseIds)
  if (courseError) throw new Error(courseError.message)

  const courseById = new Map((courses ?? []).map((course) => [course.id, course as Course]))
  return enrollments.flatMap((enrollment) => {
    const course = courseById.get(enrollment.course_id)
    return course ? [{ ...enrollment, course }] : []
  })
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
