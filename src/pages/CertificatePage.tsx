import { useParams } from 'react-router-dom'
import { EmptyState } from '@/components/ui/EmptyState'

export default function CertificatePage() {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <EmptyState
        title="Certificate not available"
        message={`Certificate ID "${id}" — certificate generation and verification will be available here once the certificate system is built.`}
      />
    </div>
  )
}
