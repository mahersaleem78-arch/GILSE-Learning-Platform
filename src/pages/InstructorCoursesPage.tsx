import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { ErrorState } from '@/components/ui/ErrorState'
import type { Course } from '@/types'

export default function InstructorCoursesPage() {
  const { user } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [price, setPrice] = useState('')
  const [hours, setHours] = useState('90')
  const [error, setError] = useState<string | null>(null)
  const [working, setWorking] = useState(false)

  const load = async () => {
    if (!user) return
    const { data, error: queryError } = await supabase.from('courses').select('*').eq('instructor_id', user.id).order('created_at', { ascending: false })
    if (queryError) setError(queryError.message)
    else setCourses((data ?? []) as Course[])
  }

  useEffect(() => { void load() }, [user])

  const createDraft = async (event: FormEvent) => {
    event.preventDefault(); setError(null)
    if (!user || title.trim().length < 3 || slug.trim().length < 3 || Number(price) <= 0) { setError('Enter a valid course title, slug and price.'); return }
    setWorking(true)
    try {
      const { error: insertError } = await supabase.from('courses').insert({ title: title.trim(), slug: slug.trim().toLowerCase(), price: Number(price), currency: 'USD', total_hours: Number(hours) || 90, status: 'draft', instructor_id: user.id, instructor_share_percent: 50 }).select('*').single()
      if (insertError) throw new Error(insertError.message)
      setTitle(''); setSlug(''); setPrice(''); setHours('90'); await load()
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to create course.') }
    finally { setWorking(false) }
  }

  return <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
    <div className="mb-8"><h1 className="font-heading text-3xl font-bold text-neutral-900">Instructor Courses</h1><p className="mt-2 text-neutral-600">Create draft courses. Publication remains subject to administrator review.</p></div>
    {error && <div className="mb-6"><ErrorState message={error} /></div>}
    <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
      <form onSubmit={createDraft} className="card p-6 space-y-4">
        <h2 className="font-heading text-lg font-semibold">Create a draft</h2>
        <div><label className="label" htmlFor="title">Title</label><input id="title" className="input" value={title} onChange={e => setTitle(e.target.value)} /></div>
        <div><label className="label" htmlFor="slug">Slug</label><input id="slug" className="input" value={slug} onChange={e => setSlug(e.target.value)} /></div>
        <div><label className="label" htmlFor="price">Price (USD)</label><input id="price" type="number" min="1" step="0.01" className="input" value={price} onChange={e => setPrice(e.target.value)} /></div>
        <div><label className="label" htmlFor="hours">Total hours</label><input id="hours" type="number" min="1" className="input" value={hours} onChange={e => setHours(e.target.value)} /></div>
        <div className="rounded-lg bg-neutral-50 p-3 text-sm text-neutral-600">Instructor share: <strong>50%</strong>. This percentage is enforced by the database.</div>
        <button className="btn-primary w-full" disabled={working}>{working ? 'Creating…' : 'Create draft'}</button>
      </form>
      <div className="space-y-4">
        {courses.length === 0 ? <div className="card p-6 text-sm text-neutral-500">No courses yet.</div> : courses.map(course => <div key={course.id} className="card p-6"><div className="flex items-start justify-between gap-4"><div><h3 className="font-heading text-lg font-semibold">{course.title}</h3><p className="mt-1 text-sm text-neutral-500">{course.price} {course.currency} · {course.total_hours} hours</p></div><span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold uppercase">{course.status}</span></div><p className="mt-4 text-sm text-neutral-600">50% instructor share. Add modules and lessons before submitting for review.</p></div>)}
      </div>
    </div>
  </div>
}
