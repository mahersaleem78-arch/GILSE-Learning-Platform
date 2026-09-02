import { supabase } from '@/lib/supabase'

export type CertificateVerification = {
  certificate_number: string
  student_name: string | null
  course_title: string
  issue_date: string
}

export async function verifyCertificate(certificateNumber: string): Promise<CertificateVerification | null> {
  const normalized = certificateNumber.trim()
  if (!normalized) return null

  const { data, error } = await supabase
    .from('certificate_verification')
    .select('certificate_number,student_name,course_title,issue_date')
    .ilike('certificate_number', normalized)
    .maybeSingle()

  if (error) throw error
  return (data as CertificateVerification | null) ?? null
}
