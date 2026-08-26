export type UserRole = 'student' | 'instructor' | 'admin' | 'developer'
export type UserStatus = 'active' | 'suspended'
export type CourseStatus = 'draft' | 'published' | 'archived'
export type EnrollmentStatus = 'active' | 'completed' | 'cancelled'
export type PaymentStatus = 'pending' | 'submitted' | 'verified' | 'failed' | 'cancelled'
export type PaymentMethod = 'crypto'
export type RewardStatus = 'pending_approval' | 'approved' | 'paid' | 'rejected'

export interface Profile { id:string; email:string; full_name:string|null; avatar_url:string|null; role:UserRole; status:UserStatus; referral_code:string|null; referred_by:string|null; created_at:string; updated_at:string }
export interface Course { id:string; title:string; slug:string; description:string|null; thumbnail_url:string|null; price:number; currency:string; total_hours:number; status:CourseStatus; created_by:string|null; created_at:string; updated_at:string }
export interface Module { id:string; course_id:string; title:string; description:string|null; order_index:number; created_at:string; updated_at:string }
export interface Lesson { id:string; module_id:string; title:string; description:string|null; content:string|null; video_url:string|null; duration_minutes:number|null; order_index:number; is_preview:boolean; created_at:string; updated_at:string }
export interface Enrollment { id:string; student_id:string; course_id:string; status:EnrollmentStatus; enrolled_at:string; completed_at:string|null }
export interface LessonProgress { id:string; enrollment_id:string; lesson_id:string; completed:boolean; completed_at:string|null }
export interface Assessment { id:string; course_id:string; lesson_id:string|null; title:string; passing_score:number; max_attempts:number|null }
export interface AssessmentResult { id:string; assessment_id:string; student_id:string; score:number; passed:boolean; attempted_at:string }

export interface PaymentConfig { id:string; asset:string; network:string; wallet_address:string; wallet_name:string; usdt_contract:string|null; qr_enabled:boolean; reward_amount:number; active:boolean; updated_at:string; updated_by:string|null }
export interface Payment { id:string; student_id:string; course_id:string; amount:number; currency:string; asset:string; network:string; wallet_address:string; tx_hash:string|null; status:PaymentStatus; verification_error:string|null; referral_code:string|null; created_at:string; updated_at:string; verified_at:string|null }
export interface PaymentVerification { id:string; payment_id:string; tx_hash:string; chain:string; amount:number; verified_at:string; verifier_version:string|null }
export interface ReferralConfig { id:string; reward_amount:number; reward_currency:string; enabled:boolean }
export interface ReferralReward { id:string; referrer_id:string; referred_student_id:string; payment_id:string; amount:number; currency:string; status:RewardStatus; admin_note:string|null; approved_by:string|null; approved_at:string|null; paid_at:string|null; created_at:string }
export interface AuditLogEntry { id:string; actor_id:string|null; action:string; entity_type:string; entity_id:string|null; details:Record<string, unknown>; created_at:string }
export interface Certificate { id:string; student_id:string; course_id:string; issue_date:string; certificate_number:string }
