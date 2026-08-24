import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Course } from '@/types'
import { listAllCourses, createCourse, updateCourse, deleteCourse, type CourseInput } from '@/services/courses'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { CourseForm } from '@/components/admin/CourseForm'

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-neutral-100 text-neutral-700',
  published: 'bg-success-100 text-success-700',
  archived: 'bg-warning-100 text-warning-700',
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Course | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listAllCourses()
      setCourses(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load courses')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const openCreate = () => {
    setEditing(null)
    setActionError(null)
    setModalOpen(true)
  }

  const openEdit = (course: Course) => {
    setEditing(course)
    setActionError(null)
    setModalOpen(true)
  }

  const handleSubmit = async (input: CourseInput) => {
    setSubmitting(true)
    setActionError(null)
    try {
      if (editing) {
        await updateCourse(editing.id, input)
      } else {
        await createCourse(input)
      }
      setModalOpen(false)
      await load()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to save course')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (course: Course) => {
    if (!confirm(`Delete "${course.title}"? This will also delete all its modules and lessons. This cannot be undone.`)) return
    try {
      await deleteCourse(course.id)
      await load()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete course')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingState label="Loading courses…" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-8">
        <ErrorState message={error} action={<button onClick={() => void load()} className="btn-primary btn-sm mt-2">Retry</button>} />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold text-neutral-900">Courses</h2>
          <p className="mt-1 text-sm text-neutral-600">Create, edit, and manage courses.</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          New course
        </button>
      </div>

      {actionError && (
        <div className="mb-4">
          <ErrorState message={actionError} />
        </div>
      )}

      {courses.length === 0 ? (
        <EmptyState
          title="No courses yet"
          message="Create your first course to get started."
          action={<button onClick={openCreate} className="btn-primary btn-sm mt-2">Create course</button>}
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <table className="w-full">
            <thead className="border-b border-neutral-200 bg-neutral-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">Title</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">Slug</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">Hours</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">Price</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {courses.map((course) => (
                <tr key={course.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/admin/courses/${course.id}`} className="font-medium text-primary-600 hover:text-primary-700">
                      {course.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-600">{course.slug}</td>
                  <td className="px-4 py-3 text-sm text-neutral-600">{course.total_hours}h</td>
                  <td className="px-4 py-3 text-sm text-neutral-600">{course.price} {course.currency}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${STATUS_STYLES[course.status] ?? ''}`}>{course.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(course)} className="btn-ghost btn-sm">Edit</button>
                      <button onClick={() => void handleDelete(course)} className="btn-ghost btn-sm text-error-600 hover:bg-error-50">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit course' : 'New course'}>
        {actionError && (
          <div className="mb-4">
            <ErrorState message={actionError} />
          </div>
        )}
        <CourseForm
          initial={editing}
          onSubmit={handleSubmit}
          submitting={submitting}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>
    </div>
  )
}
