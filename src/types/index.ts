export type UserRole = 'student' | 'instructor' | 'admin' | 'developer'

export type UserStatus = 'active' | 'suspended'

export type CourseStatus = 'draft' | 'published' | 'archived'
export type EnrollmentStatus = 'active' | 'completed' | 'cancelled'
export type PaymentStatus = 'pending' | 'verified' | 'failed' | 'refunded'
export type PaymentMethod = 'crypto' | 'qr' | 'card'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  status: UserStatus
  created_at: string
  updated_at: string
}

export interface Course {
  id: string
  title: string
  slug: string
  description: string | null
  thumbnail_url: string | null
  price: number
  currency: string
  total_hours: number
  status: CourseStatus
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Module {
  id: string
  course_id: string
  title: string
  description: string | null
  order_index: number
  created_at: string
  updated_at: string
}

export interface Lesson {
  id: string
  module_id: string
  title: string
  description: string | null
  content: string | null
  video_url: string | null
  duration_minutes: number | null
  order_index: number
  is_preview: boolean
  created_at: string
  updated_at: string
}

export interface Enrollment {
  id: string
  student_id: string
  course_id: string
  status: EnrollmentStatus
  enrolled_at: string
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface LessonProgress {
  id: string
  enrollment_id: string
  lesson_id: string
  completed: boolean
  completed_at: string | null
}

export interface Assessment {
  id: string
  course_id: string
  lesson_id: string | null
  title: string
  passing_score: number
  max_attempts: number | null
}

export interface AssessmentResult {
  id: string
  assessment_id: string
  student_id: string
  score: number
  passed: boolean
  attempted_at: string
}

export interface Payment {
  id: string
  student_id: string
  course_id: string
  amount: number
  currency: string
  method: PaymentMethod
  status: PaymentStatus
  tx_hash: string | null
  created_at: string
  updated_at: string
}

export interface PaymentVerification {
  id: string
  payment_id: string
  tx_hash: string
  chain: string
  amount: number
  verified_at: string
  verifier_version: string | null
}

export interface Certificate {
  id: string
  student_id: string
  course_id: string
  issue_date: string
  certificate_number: string
}
