import { useEffect } from 'react'
import { Navigate, useParams } from 'react-router-dom'

export default function ReferralLandingPage() {
  const { code } = useParams<{ code: string }>()
  useEffect(() => { if (code) localStorage.setItem('gilse_referral_code', code.toUpperCase()) }, [code])
  return <Navigate to="/signup" replace />
}
