import { describe, it, expect, vi, beforeEach } from 'vitest'
import { supabase } from '@/lib/supabase'
import { listLessons, listEnrolledLessons, listAdminLessons, createLesson, updateLesson, deleteLesson } from '@/services/lessons'

vi.mock('@/lib/supabase', () => ({ supabase: { from: vi.fn() } }))
const mockedFrom = vi.mocked(supabase.from)

function makeChain(finalData: unknown = null, finalError: unknown = null) {
  const chain: Record<string, (...args: unknown[]) => unknown> = {}
  chain.select = vi.fn().mockReturnThis(); chain.eq = vi.fn().mockReturnThis(); chain.order = vi.fn().mockResolvedValue({ data: finalData, error: finalError })
  chain.insert = vi.fn().mockReturnThis(); chain.update = vi.fn().mockReturnThis()
  const deleteEqSpy = vi.fn().mockResolvedValue({ error: finalError }); chain.delete = vi.fn().mockReturnValue({ eq: deleteEqSpy }); chain._deleteEqSpy = deleteEqSpy
  chain.single = vi.fn().mockResolvedValue({ data: finalData, error: finalError })
  return chain
}

beforeEach(() => vi.clearAllMocks())

describe('lessons service', () => {
  it('listLessons uses the safe public catalog and never returns protected content', async () => {
    const row = { id: 'l1', module_id: 'm1', title: 'Lesson 1', description: null, duration_minutes: 10, order_index: 0, is_preview: true, created_at: 'now', updated_at: 'now' }
    const chain = makeChain([row]); mockedFrom.mockReturnValue(chain as never)
    const result = await listLessons('module-1')
    expect(result).toEqual([{ ...row, content: null, video_url: null }])
    expect(mockedFrom).toHaveBeenCalledWith('published_lesson_catalog')
    expect(chain.eq).toHaveBeenCalledWith('module_id', 'module-1')
  })

  it('listEnrolledLessons reads the protected content view', async () => {
    const chain = makeChain([{ id: 'l1', content: 'secret', video_url: null }]); mockedFrom.mockReturnValue(chain as never)
    const result = await listEnrolledLessons('m1')
    expect(result).toEqual([{ id: 'l1', content: 'secret', video_url: null }])
    expect(mockedFrom).toHaveBeenCalledWith('enrolled_lesson_content')
  })

  it('listAdminLessons reads the protected base table', async () => {
    const chain = makeChain([{ id: 'l1', content: 'secret' }]); mockedFrom.mockReturnValue(chain as never)
    const result = await listAdminLessons('m1')
    expect(result).toEqual([{ id: 'l1', content: 'secret' }])
    expect(mockedFrom).toHaveBeenCalledWith('lessons')
  })

  it('createLesson inserts and returns single row', async () => {
    const chain = makeChain({ id: 'l1', title: 'New Lesson' }); mockedFrom.mockReturnValue(chain as never)
    const result = await createLesson({ module_id: 'm1', title: 'New Lesson', description: null, content: null, video_url: null, duration_minutes: 30, order_index: 0, is_preview: false })
    expect(result).toEqual({ id: 'l1', title: 'New Lesson' }); expect(chain.insert).toHaveBeenCalled()
  })

  it('updateLesson updates by id', async () => {
    const chain = makeChain({ id: 'l1', title: 'Updated' }); mockedFrom.mockReturnValue(chain as never)
    const result = await updateLesson('l1', { title: 'Updated' }); expect(result).toEqual({ id: 'l1', title: 'Updated' }); expect(chain.update).toHaveBeenCalledWith({ title: 'Updated' })
  })

  it('deleteLesson deletes by id', async () => {
    const chain = makeChain(null, null); mockedFrom.mockReturnValue(chain as never); await deleteLesson('l1'); expect(chain.delete).toHaveBeenCalled(); expect(chain._deleteEqSpy).toHaveBeenCalledWith('id', 'l1')
  })

  it('throws on error', async () => {
    const chain = makeChain(null, { message: 'DB error' }); mockedFrom.mockReturnValue(chain as never); await expect(listLessons('m1')).rejects.toThrow('DB error')
  })
})
