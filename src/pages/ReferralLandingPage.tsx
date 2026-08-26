import { useEffect } from 'react'
import { Navigate, useParams } from 'react-router-dom'

export default function ReferralLandingPage() {
  const { code } = useParams<{ code: string }>()
  useEffect(() => {
    const normalized = code?.trim().toUpperCase() ?? ''
    if (/^GILSE-[A-Z0-9]{8}$/.test(normalized)) localStorage.setItem('gilse_referral_code', normalized)
  }, [code])
  return <Navigate to="/signup" replace />
}
