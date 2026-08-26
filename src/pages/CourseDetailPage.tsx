import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { Course, Module, Lesson } from '@/types'
import { getCourse } from '@/services/courses'
import { listModules } from '@/services/modules'
import { listLessons } from '@/services/lessons'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'

type ModuleWithLessons = Module & { lessons: Lesson[] }

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const courseId = id!

  const [course, setCourse] = useState<Course | null>(null)
  const [modules, setModules] = useState<ModuleWithLessons[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const c = await getCourse(courseId)
      setCourse(c)
      if (c) {
        const mods = await listModules(courseId)
        const modsWithLessons: ModuleWithLessons[] = []
        for (const mod of mods) {
          const lessons = await listLessons(mod.id)
          modsWithLessons.push({ ...mod, lessons })
        }
        setModules(modsWithLessons)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load course')
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => { void load() }, [load])

  if (loading) {
    return <div className="flex items-center justify-center py-20"><LoadingState label="Loading course…" /></div>
  }

  if (error || !course) {
    return <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8"><Link to="/courses" className="mb-6 inline-flex items-center gap-1.5 text-sm text-neutral-600 hover:text-neutral-900"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>Back to courses</Link><ErrorState message={error ?? 'Course not found'} /></div>
  }

  const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0)
  const totalDuration = modules.reduce((sum, m) => sum + m.lessons.reduce((s, l) => s + (l.duration_minutes ?? 0), 0), 0)
  const isPaid = course.price > 0

  return <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
    <Link to="/courses" className="mb-6 inline-flex items-center gap-1.5 text-sm text-neutral-600 hover:text-neutral-900"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>Back to courses</Link>
    {course.thumbnail_url && <div className="mb-6 aspect-video w-full overflow-hidden rounded-lg bg-neutral-100"><img src={course.thumbnail_url} alt={course.title} className="h-full w-full object-cover" /></div>}
    <h1 className="font-heading text-3xl font-bold text-neutral-900">{course.title}</h1>
    {course.description && <p className="mt-4 text-lg text-neutral-600">{course.description}</p>}

    <div className="mt-6 flex flex-wrap gap-6 border-b border-neutral-200 pb-6">
      <div className="flex items-center gap-2 text-sm text-neutral-600"><svg className="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><span>{course.total_hours} hours</span></div>
      <div className="flex items-center gap-2 text-sm text-neutral-600"><svg className="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg><span>{modules.length} modules · {totalLessons} lessons</span></div>
      {totalDuration > 0 && <div className="flex items-center gap-2 text-sm text-neutral-600"><svg className="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><span>{totalDuration} min of content</span></div>}
      <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900">{isPaid ? `${course.price} ${course.currency}` : 'Free'}</div>
      <Link to={isPaid ? `/courses/${course.id}/pay` : '/signup'} className="btn-primary ml-auto">{isPaid ? `Buy for ${course.price} ${course.currency}` : 'Start learning'}</Link>
    </div>

    {isPaid && <div className="mt-4 rounded-lg border border-primary-100 bg-primary-50 p-4 text-sm text-primary-800">Paid courses are unlocked only after the payment is verified on the configured network.</div>}

    {modules.length === 0 ? <div className="mt-8"><EmptyState title="No modules yet" message="This course does not have any content yet." /></div> : <div className="mt-8 space-y-6">{modules.map((mod, mIdx) => <div key={mod.id} className="rounded-lg border border-neutral-200 bg-white">
      <div className="border-b border-neutral-200 px-5 py-4"><div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-50 text-sm font-semibold text-primary-700">{mIdx + 1}</span><div><h2 className="font-heading text-lg font-semibold text-neutral-900">{mod.title}</h2>{mod.description && <p className="mt-1 text-sm text-neutral-500">{mod.description}</p>}</div></div></div>
      {mod.lessons.length > 0 && <div className="divide-y divide-neutral-100">{mod.lessons.map((lesson, lIdx) => <div key={lesson.id} className="flex items-center justify-between px-5 py-3"><div className="flex items-center gap-3"><span className="text-sm text-neutral-400">{lIdx + 1}.</span><div><p className="text-sm font-medium text-neutral-900">{lesson.title}{lesson.is_preview && <span className="ml-2 badge bg-accent-100 text-accent-700">Preview</span>}</p>{lesson.description && <p className="mt-0.5 text-xs text-neutral-500">{lesson.description}</p>}</div></div>{lesson.duration_minutes != null && <span className="text-xs text-neutral-500">{lesson.duration_minutes} min</span>}</div>)}</div>}
    </div>)}</div>}
  </div>
}
