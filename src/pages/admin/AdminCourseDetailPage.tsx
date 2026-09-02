import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { Course, Module, Lesson } from '@/types'
import { getCourse, updateCourse, deleteCourse, type CourseInput } from '@/services/courses'
import { listModules, createModule, updateModule, deleteModule, type ModuleInput } from '@/services/modules'
import { listAdminLessons, createLesson, updateLesson, deleteLesson, type LessonInput } from '@/services/lessons'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { CourseForm } from '@/components/admin/CourseForm'

 type ModuleWithLessons = Module & { lessons: Lesson[] }

export default function AdminCourseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const courseId = id!

  const [course, setCourse] = useState<Course | null>(null)
  const [modules, setModules] = useState<ModuleWithLessons[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [editCourseOpen, setEditCourseOpen] = useState(false)
  const [submittingCourse, setSubmittingCourse] = useState(false)
  const [moduleModalOpen, setModuleModalOpen] = useState(false)
  const [editingModule, setEditingModule] = useState<Module | null>(null)
  const [submittingModule, setSubmittingModule] = useState(false)
  const [lessonModalOpen, setLessonModalOpen] = useState(false)
  const [lessonModuleId, setLessonModuleId] = useState<string | null>(null)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [submittingLesson, setSubmittingLesson] = useState(false)
  const [moduleTitle, setModuleTitle] = useState('')
  const [moduleDescription, setModuleDescription] = useState('')
  const [moduleOrder, setModuleOrder] = useState('0')
  const [moduleErrors, setModuleErrors] = useState<Record<string, string>>({})
  const [lessonTitle, setLessonTitle] = useState('')
  const [lessonDescription, setLessonDescription] = useState('')
  const [lessonContent, setLessonContent] = useState('')
  const [lessonVideoUrl, setLessonVideoUrl] = useState('')
  const [lessonDuration, setLessonDuration] = useState('')
  const [lessonOrder, setLessonOrder] = useState('0')
  const [lessonIsPreview, setLessonIsPreview] = useState(false)
  const [lessonErrors, setLessonErrors] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const c = await getCourse(courseId); setCourse(c)
      if (c) {
        const mods = await listModules(courseId)
        const modsWithLessons: ModuleWithLessons[] = []
        for (const mod of mods) modsWithLessons.push({ ...mod, lessons: await listAdminLessons(mod.id) })
        setModules(modsWithLessons)
      }
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load course') }
    finally { setLoading(false) }
  }, [courseId])

  useEffect(() => { void load() }, [load])

  const handleCourseSubmit = async (input: CourseInput) => {
    setSubmittingCourse(true); setActionError(null)
    try { await updateCourse(courseId, input); setEditCourseOpen(false); await load() }
    catch (err) { setActionError(err instanceof Error ? err.message : 'Failed to update course') }
    finally { setSubmittingCourse(false) }
  }

  const handleDeleteCourse = async () => {
    if (!course || !confirm(`Delete "${course.title}" and all its modules and lessons? This cannot be undone.`)) return
    try { await deleteCourse(courseId); window.location.href = '/admin/courses' }
    catch (err) { setActionError(err instanceof Error ? err.message : 'Failed to delete course') }
  }

  const openCreateModule = () => { setEditingModule(null); setModuleTitle(''); setModuleDescription(''); setModuleOrder(String(modules.length)); setModuleErrors({}); setActionError(null); setModuleModalOpen(true) }
  const openEditModule = (mod: Module) => { setEditingModule(mod); setModuleTitle(mod.title); setModuleDescription(mod.description ?? ''); setModuleOrder(String(mod.order_index)); setModuleErrors({}); setActionError(null); setModuleModalOpen(true) }
  const handleModuleSubmit = async (e: FormEvent) => {
    e.preventDefault(); const errs: Record<string, string> = {}
    if (!moduleTitle.trim()) errs.title = 'Title is required'
    if (moduleOrder === '' || !Number.isInteger(Number(moduleOrder)) || Number(moduleOrder) < 0) errs.order = 'Order must be a non-negative integer'
    setModuleErrors(errs); if (Object.keys(errs).length) return
    setSubmittingModule(true); setActionError(null)
    try {
      const input: ModuleInput = { course_id: courseId, title: moduleTitle.trim(), description: moduleDescription.trim() || null, order_index: Number(moduleOrder) }
      if (editingModule) await updateModule(editingModule.id, input); else await createModule(input)
      setModuleModalOpen(false); await load()
    } catch (err) { setActionError(err instanceof Error ? err.message : 'Failed to save module') }
    finally { setSubmittingModule(false) }
  }
  const handleDeleteModule = async (mod: Module) => {
    if (!confirm(`Delete module "${mod.title}" and all its lessons?`)) return
    try { await deleteModule(mod.id); await load() }
    catch (err) { setActionError(err instanceof Error ? err.message : 'Failed to delete module') }
  }

  const openCreateLesson = (moduleId: string) => {
    setLessonModuleId(moduleId); setEditingLesson(null); const mod = modules.find(m => m.id === moduleId)
    setLessonTitle(''); setLessonDescription(''); setLessonContent(''); setLessonVideoUrl(''); setLessonDuration(''); setLessonOrder(String(mod?.lessons.length ?? 0)); setLessonIsPreview(false); setLessonErrors({}); setActionError(null); setLessonModalOpen(true)
  }
  const openEditLesson = (moduleId: string, lesson: Lesson) => {
    setLessonModuleId(moduleId); setEditingLesson(lesson); setLessonTitle(lesson.title); setLessonDescription(lesson.description ?? ''); setLessonContent(lesson.content ?? ''); setLessonVideoUrl(lesson.video_url ?? ''); setLessonDuration(lesson.duration_minutes != null ? String(lesson.duration_minutes) : ''); setLessonOrder(String(lesson.order_index)); setLessonIsPreview(lesson.is_preview); setLessonErrors({}); setActionError(null); setLessonModalOpen(true)
  }
  const handleLessonSubmit = async (e: FormEvent) => {
    e.preventDefault(); const errs: Record<string, string> = {}
    if (!lessonTitle.trim()) errs.title = 'Title is required'
    if (lessonDuration !== '' && (!Number.isFinite(Number(lessonDuration)) || Number(lessonDuration) < 0)) errs.duration = 'Duration must be a non-negative number'
    if (lessonOrder === '' || !Number.isInteger(Number(lessonOrder)) || Number(lessonOrder) < 0) errs.order = 'Order must be a non-negative integer'
    setLessonErrors(errs); if (Object.keys(errs).length || !lessonModuleId) return
    setSubmittingLesson(true); setActionError(null)
    try {
      const input: LessonInput = { module_id: lessonModuleId, title: lessonTitle.trim(), description: lessonDescription.trim() || null, content: lessonContent.trim() || null, video_url: lessonVideoUrl.trim() || null, duration_minutes: lessonDuration === '' ? null : Number(lessonDuration), order_index: Number(lessonOrder), is_preview: lessonIsPreview }
      if (editingLesson) await updateLesson(editingLesson.id, input); else await createLesson(input)
      setLessonModalOpen(false); await load()
    } catch (err) { setActionError(err instanceof Error ? err.message : 'Failed to save lesson') }
    finally { setSubmittingLesson(false) }
  }
  const handleDeleteLesson = async (lesson: Lesson) => {
    if (!confirm(`Delete lesson "${lesson.title}"?`)) return
    try { await deleteLesson(lesson.id); await load() }
    catch (err) { setActionError(err instanceof Error ? err.message : 'Failed to delete lesson') }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><LoadingState label="Loading course…" /></div>
  if (error || !course) return <div className="py-8"><ErrorState message={error ?? 'Course not found'} action={<Link to="/admin/courses" className="btn-primary btn-sm mt-2">Back to courses</Link>} /></div>

  return <div>
    <div className="mb-6"><Link to="/admin/courses" className="mb-3 inline-flex items-center gap-1.5 text-sm text-neutral-600 hover:text-neutral-900">← Back to courses</Link><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="font-heading text-2xl font-bold text-neutral-900">{course.title}</h2><p className="mt-1 text-sm text-neutral-600">{course.slug} · {course.total_hours}h · {course.price} {course.currency} · <span className="capitalize">{course.status}</span></p>{course.description && <p className="mt-2 max-w-2xl text-sm text-neutral-600">{course.description}</p>}</div><div className="flex gap-2"><button onClick={() => { setActionError(null); setEditCourseOpen(true) }} className="btn-secondary btn-sm">Edit course</button><button onClick={() => void handleDeleteCourse()} className="btn-ghost btn-sm text-error-600 hover:bg-error-50">Delete</button></div></div></div>
    {actionError && <div className="mb-4"><ErrorState message={actionError} /></div>}
    <div className="mb-4 flex items-center justify-between"><h3 className="font-heading text-lg font-semibold text-neutral-900">Modules</h3><button onClick={openCreateModule} className="btn-primary btn-sm">+ Add module</button></div>
    {modules.length === 0 ? <EmptyState title="No modules yet" message="Add a module to start building the course structure." /> : <div className="space-y-4">{modules.map((mod, idx) => <div key={mod.id} className="rounded-lg border border-neutral-200 bg-white"><div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3"><div className="flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-50 text-sm font-semibold text-primary-700">{idx + 1}</span><div><h4 className="font-semibold text-neutral-900">{mod.title}</h4>{mod.description && <p className="text-sm text-neutral-500">{mod.description}</p>}</div></div><div className="flex items-center gap-2"><span className="text-xs text-neutral-400">Order: {mod.order_index}</span><button onClick={() => openCreateLesson(mod.id)} className="btn-ghost btn-sm">Add lesson</button><button onClick={() => openEditModule(mod)} className="btn-ghost btn-sm">Edit</button><button onClick={() => void handleDeleteModule(mod)} className="btn-ghost btn-sm text-error-600 hover:bg-error-50">Delete</button></div></div>{mod.lessons.length === 0 ? <div className="px-5 py-4"><p className="text-sm text-neutral-400">No lessons in this module yet.</p></div> : <div className="divide-y divide-neutral-100">{mod.lessons.map((lesson, lIdx) => <div key={lesson.id} className="flex items-center justify-between px-5 py-3 hover:bg-neutral-50"><div className="flex items-center gap-3"><span className="text-sm text-neutral-400">{lIdx + 1}.</span><div><p className="text-sm font-medium text-neutral-900">{lesson.title}{lesson.is_preview && <span className="ml-2 badge bg-accent-100 text-accent-700">Preview</span>}</p><p className="text-xs text-neutral-500">{lesson.duration_minutes != null ? `${lesson.duration_minutes} min` : 'No duration'}{lesson.video_url ? ' · Has video' : ''}</p></div></div><div className="flex items-center gap-2"><span className="text-xs text-neutral-400">Order: {lesson.order_index}</span><button onClick={() => openEditLesson(mod.id, lesson)} className="btn-ghost btn-sm">Edit</button><button onClick={() => void handleDeleteLesson(lesson)} className="btn-ghost btn-sm text-error-600 hover:bg-error-50">Delete</button></div></div>)}</div>}</div>)}</div>}
    <Modal open={editCourseOpen} onClose={() => setEditCourseOpen(false)} title="Edit course"><CourseForm initial={course} onSubmit={handleCourseSubmit} submitting={submittingCourse} onCancel={() => setEditCourseOpen(false)} /></Modal>
    <Modal open={moduleModalOpen} onClose={() => setModuleModalOpen(false)} title={editingModule ? 'Edit module' : 'New module'}><form onSubmit={handleModuleSubmit} className="space-y-4"><div><label className="label" htmlFor="module-title">Title</label><input id="module-title" className="input" value={moduleTitle} onChange={e => setModuleTitle(e.target.value)} />{moduleErrors.title && <p className="mt-1 text-xs text-error-600">{moduleErrors.title}</p>}</div><div><label className="label" htmlFor="module-description">Description</label><textarea id="module-description" className="input" value={moduleDescription} onChange={e => setModuleDescription(e.target.value)} rows={3} /></div><div><label className="label" htmlFor="module-order">Order</label><input id="module-order" type="number" min="0" step="1" className="input" value={moduleOrder} onChange={e => setModuleOrder(e.target.value)} />{moduleErrors.order && <p className="mt-1 text-xs text-error-600">{moduleErrors.order}</p>}</div><div className="flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={() => setModuleModalOpen(false)}>Cancel</button><button type="submit" className="btn-primary" disabled={submittingModule}>{submittingModule ? 'Saving…' : 'Save module'}</button></div></form></Modal>
    <Modal open={lessonModalOpen} onClose={() => setLessonModalOpen(false)} title={editingLesson ? 'Edit lesson' : 'New lesson'}><form onSubmit={handleLessonSubmit} className="space-y-4"><div><label className="label" htmlFor="lesson-title">Title</label><input id="lesson-title" className="input" value={lessonTitle} onChange={e => setLessonTitle(e.target.value)} />{lessonErrors.title && <p className="mt-1 text-xs text-error-600">{lessonErrors.title}</p>}</div><div><label className="label" htmlFor="lesson-description">Description</label><textarea id="lesson-description" className="input" value={lessonDescription} onChange={e => setLessonDescription(e.target.value)} rows={2} /></div><div><label className="label" htmlFor="lesson-content">Content</label><textarea id="lesson-content" className="input min-h-40" value={lessonContent} onChange={e => setLessonContent(e.target.value)} rows={7} /></div><div><label className="label" htmlFor="lesson-video">Video URL</label><input id="lesson-video" type="url" className="input" value={lessonVideoUrl} onChange={e => setLessonVideoUrl(e.target.value)} /></div><div className="grid gap-4 sm:grid-cols-2"><div><label className="label" htmlFor="lesson-duration">Duration (minutes)</label><input id="lesson-duration" type="number" min="0" step="1" className="input" value={lessonDuration} onChange={e => setLessonDuration(e.target.value)} />{lessonErrors.duration && <p className="mt-1 text-xs text-error-600">{lessonErrors.duration}</p>}</div><div><label className="label" htmlFor="lesson-order">Order</label><input id="lesson-order" type="number" min="0" step="1" className="input" value={lessonOrder} onChange={e => setLessonOrder(e.target.value)} />{lessonErrors.order && <p className="mt-1 text-xs text-error-600">{lessonErrors.order}</p>}</div></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={lessonIsPreview} onChange={e => setLessonIsPreview(e.target.checked)} /> Public preview lesson</label><div className="flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={() => setLessonModalOpen(false)}>Cancel</button><button type="submit" className="btn-primary" disabled={submittingLesson}>{submittingLesson ? 'Saving…' : 'Save lesson'}</button></div></form></Modal>
  </div>
}
