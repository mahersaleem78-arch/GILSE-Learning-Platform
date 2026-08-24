import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 text-center">
      <h1 className="font-heading text-6xl font-bold text-neutral-900">404</h1>
      <p className="mt-4 text-lg text-neutral-600">The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn-primary mt-8">Back to home</Link>
    </div>
  )
}
