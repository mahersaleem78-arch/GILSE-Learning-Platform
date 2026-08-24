import { useState, type FormEvent } from 'react'
import type { Course, CourseStatus } from '@/types'
import type { CourseInput } from '@/services/courses'

interface CourseFormProps {
  initial?: Course | null
  onSubmit: (input: CourseInput) => Promise<void>
  submitting: boolean
  onCancel: () => void
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const STATUSES: CourseStatus[] = ['draft', 'published', 'archived']

export function CourseForm({ initial, onSubmit, submitting, onCancel }: CourseFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [thumbnailUrl, setThumbnailUrl] = useState(initial?.thumbnail_url ?? '')
  const [price, setPrice] = useState(String(initial?.price ?? 0))
  const [currency, setCurrency] = useState(initial?.currency ?? 'USD')
  const [totalHours, setTotalHours] = useState(String(initial?.total_hours ?? 90))
  const [status, setStatus] = useState<CourseStatus>(initial?.status ?? 'draft')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    if (!title.trim()) e.title = 'Title is required'
    if (!slug.trim()) e.slug = 'Slug is required'
    if (price === '' || isNaN(Number(price)) || Number(price) < 0) e.price = 'Price must be a non-negative number'
    if (totalHours === '' || isNaN(Number(totalHours)) || Number(totalHours) < 1) e.totalHours = 'Total hours must be at least 1'
    if (!currency.trim()) e.currency = 'Currency is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    await onSubmit({
      title: title.trim(),
      slug: slug.trim(),
      description: description.trim() || null,
      thumbnail_url: thumbnailUrl.trim() || null,
      price: Number(price),
      currency: currency.trim(),
      total_hours: Number(totalHours),
      status,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label" htmlFor="course-title">Title</label>
        <input
          id="course-title"
          className="input"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            if (!initial) setSlug(slugify(e.target.value))
          }}
          placeholder="Introduction to Learning Support"
        />
        {errors.title && <p className="mt-1 text-sm text-error-600">{errors.title}</p>}
      </div>

      <div>
        <label className="label" htmlFor="course-slug">Slug</label>
        <input
          id="course-slug"
          className="input"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="introduction-to-learning-support"
        />
        {errors.slug && <p className="mt-1 text-sm text-error-600">{errors.slug}</p>}
      </div>

      <div>
        <label className="label" htmlFor="course-description">Description</label>
        <textarea
          id="course-description"
          className="input min-h-[80px] resize-y"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="A brief course description"
        />
      </div>

      <div>
        <label className="label" htmlFor="course-thumbnail">Thumbnail URL</label>
        <input
          id="course-thumbnail"
          className="input"
          value={thumbnailUrl}
          onChange={(e) => setThumbnailUrl(e.target.value)}
          placeholder="https://..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="course-price">Price</label>
          <input
            id="course-price"
            type="number"
            step="0.01"
            min="0"
            className="input"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          {errors.price && <p className="mt-1 text-sm text-error-600">{errors.price}</p>}
        </div>
        <div>
          <label className="label" htmlFor="course-currency">Currency</label>
          <input
            id="course-currency"
            className="input"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            placeholder="USD"
          />
          {errors.currency && <p className="mt-1 text-sm text-error-600">{errors.currency}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="course-hours">Total Hours</label>
          <input
            id="course-hours"
            type="number"
            min="1"
            className="input"
            value={totalHours}
            onChange={(e) => setTotalHours(e.target.value)}
          />
          {errors.totalHours && <p className="mt-1 text-sm text-error-600">{errors.totalHours}</p>}
        </div>
        <div>
          <label className="label" htmlFor="course-status">Status</label>
          <select
            id="course-status"
            className="input"
            value={status}
            onChange={(e) => setStatus(e.target.value as CourseStatus)}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? 'Saving…' : initial ? 'Update course' : 'Create course'}
        </button>
      </div>
    </form>
  )
}
