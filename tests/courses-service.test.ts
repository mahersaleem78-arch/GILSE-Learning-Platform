import { describe, it, expect, vi, beforeEach } from 'vitest'
import { supabase } from '@/lib/supabase'
import {
  listPublishedCourses,
  listAllCourses,
  getCourse,
  getCourseBySlug,
  createCourse,
  updateCourse,
  deleteCourse,
} from '@/services/courses'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

const mockedFrom = vi.mocked(supabase.from)

function makeChain(finalData: unknown = null, finalError: unknown = null) {
  const chain: Record<string, (...args: unknown[]) => unknown> = {}
  chain.select = vi.fn().mockReturnThis()
  chain.eq = vi.fn().mockReturnThis()
  chain.order = vi.fn().mockResolvedValue({ data: finalData, error: finalError })
  chain.insert = vi.fn().mockReturnThis()
  chain.update = vi.fn().mockReturnThis()
  const deleteEqSpy = vi.fn().mockResolvedValue({ error: finalError })
  chain.delete = vi.fn().mockReturnValue({ eq: deleteEqSpy })
  chain._deleteEqSpy = deleteEqSpy
  chain.maybeSingle = vi.fn().mockResolvedValue({ data: finalData, error: finalError })
  chain.single = vi.fn().mockResolvedValue({ data: finalData, error: finalError })
  return chain
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('courses service', () => {
  it('listPublishedCourses queries with published filter', async () => {
    const chain = makeChain([{ id: 'c1', title: 'Course 1' }])
    mockedFrom.mockReturnValue(chain as never)
    const result = await listPublishedCourses()
    expect(result).toEqual([{ id: 'c1', title: 'Course 1' }])
    expect(chain.eq).toHaveBeenCalledWith('status', 'published')
  })

  it('listAllCourses queries without filter', async () => {
    const chain = makeChain([{ id: 'c1' }, { id: 'c2' }])
    mockedFrom.mockReturnValue(chain as never)
    const result = await listAllCourses()
    expect(result).toHaveLength(2)
  })

  it('getCourse uses maybeSingle', async () => {
    const chain = makeChain({ id: 'c1', title: 'Test' })
    mockedFrom.mockReturnValue(chain as never)
    const result = await getCourse('c1')
    expect(result).toEqual({ id: 'c1', title: 'Test' })
    expect(chain.maybeSingle).toHaveBeenCalled()
  })

  it('getCourseBySlug filters by slug', async () => {
    const chain = makeChain({ id: 'c1', slug: 'test' })
    mockedFrom.mockReturnValue(chain as never)
    await getCourseBySlug('test')
    expect(chain.eq).toHaveBeenCalledWith('slug', 'test')
  })

  it('createCourse inserts and returns single row', async () => {
    const chain = makeChain({ id: 'c1', title: 'New' })
    mockedFrom.mockReturnValue(chain as never)
    const result = await createCourse({
      title: 'New',
      slug: 'new',
      description: null,
      thumbnail_url: null,
      price: 0,
      currency: 'USD',
      total_hours: 90,
      status: 'draft',
    })
    expect(result).toEqual({ id: 'c1', title: 'New' })
    expect(chain.insert).toHaveBeenCalled()
    expect(chain.single).toHaveBeenCalled()
  })

  it('updateCourse updates by id and returns single row', async () => {
    const chain = makeChain({ id: 'c1', title: 'Updated' })
    mockedFrom.mockReturnValue(chain as never)
    const result = await updateCourse('c1', { title: 'Updated' })
    expect(result).toEqual({ id: 'c1', title: 'Updated' })
    expect(chain.update).toHaveBeenCalledWith({ title: 'Updated' })
    expect(chain.eq).toHaveBeenCalledWith('id', 'c1')
  })

  it('deleteCourse deletes by id', async () => {
    const chain = makeChain(null, null)
    mockedFrom.mockReturnValue(chain as never)
    await deleteCourse('c1')
    expect(chain.delete).toHaveBeenCalled()
    expect(chain._deleteEqSpy).toHaveBeenCalledWith('id', 'c1')
  })

  it('throws on error from supabase', async () => {
    const chain = makeChain(null, { message: 'DB error' })
    mockedFrom.mockReturnValue(chain as never)
    await expect(listPublishedCourses()).rejects.toThrow('DB error')
  })
})
