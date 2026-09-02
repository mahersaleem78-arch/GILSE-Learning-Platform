import { supabase } from '@/lib/supabase'

export interface CertificateVerification {
  certificate_number: string
  student_name: string | null
  course_title: string
  issue_date: string
}

export async function verifyCertificate(certificateNumber: string): Promise<CertificateVerification | null> {
  const normalized = certificateNumber.trim()
  if (!normalized) return null

  const { data, error } = await supabase.rpc('verify_certificate', {
    p_certificate_number: normalized,
  })
  if (error) throw new Error(error.message)

  const row = Array.isArray(data) ? data[0] : null
  return (row as CertificateVerification | undefined) ?? null
}
