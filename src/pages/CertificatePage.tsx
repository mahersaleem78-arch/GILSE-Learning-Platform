import { FormEvent, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { verifyCertificate, type CertificateVerification } from '@/services/certificates'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'

export default function CertificatePage() {
  const { id } = useParams<{ id: string }>()
  const [certificateNumber, setCertificateNumber] = useState(id ?? '')
  const [certificate, setCertificate] = useState<CertificateVerification | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleVerify(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setCertificate(null)
    try {
      const result = await verifyCertificate(certificateNumber)
      if (!result) {
        setError('No certificate was found with that certificate number.')
        return
      }
      setCertificate(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Certificate verification failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link to="/courses" className="text-sm text-neutral-600 hover:text-neutral-900">Back to courses</Link>
        <h1 className="mt-4 font-heading text-3xl font-bold text-neutral-900">Verify a Certificate</h1>
        <p className="mt-2 text-neutral-600">Enter a GILSE certificate number to verify its authenticity.</p>
      </div>

      <form onSubmit={handleVerify} className="card p-6">
        <label htmlFor="certificate-number" className="block text-sm font-medium text-neutral-700">Certificate number</label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <input
            id="certificate-number"
            value={certificateNumber}
            onChange={(event) => setCertificateNumber(event.target.value)}
            className="input flex-1"
            placeholder="e.g. GILSE-2026-000001"
            autoComplete="off"
          />
          <button type="submit" className="btn-primary" disabled={loading || !certificateNumber.trim()}>
            {loading ? 'Verifying…' : 'Verify certificate'}
          </button>
        </div>
      </form>

      <div className="mt-6">
        {loading && <LoadingState label="Verifying certificate…" />}
        {!loading && error && <ErrorState message={error} />}
        {!loading && !error && !certificate && <EmptyState title="Certificate verification" message="A valid certificate will display its holder, course, and issue date here." />}
        {!loading && certificate && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Certificate verified</p>
            <dl className="mt-5 space-y-4 text-sm">
              <div><dt className="text-emerald-700">Certificate number</dt><dd className="mt-1 font-semibold text-neutral-900">{certificate.certificate_number}</dd></div>
              <div><dt className="text-emerald-700">Student</dt><dd className="mt-1 font-semibold text-neutral-900">{certificate.student_name ?? 'Student'}</dd></div>
              <div><dt className="text-emerald-700">Course</dt><dd className="mt-1 font-semibold text-neutral-900">{certificate.course_title}</dd></div>
              <div><dt className="text-emerald-700">Issue date</dt><dd className="mt-1 font-semibold text-neutral-900">{certificate.issue_date}</dd></div>
            </dl>
          </div>
        )}
      </div>
    </div>
  )
}
