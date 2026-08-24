import { describe, it, expect, vi, beforeEach } from 'vitest'
import { supabase } from '@/lib/supabase'
import {
  listLessons,
  createLesson,
  updateLesson,
  deleteLesson,
} from '@/services/lessons'

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
  chain.single = vi.fn().mockResolvedValue({ data: finalData, error: finalError })
  return chain
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('lessons service', () => {
  it('listLessons filters by module_id and orders by order_index', async () => {
    const chain = makeChain([{ id: 'l1', title: 'Lesson 1' }])
    mockedFrom.mockReturnValue(chain as never)
    const result = await listLessons('module-1')
    expect(result).toEqual([{ id: 'l1', title: 'Lesson 1' }])
    expect(chain.eq).toHaveBeenCalledWith('module_id', 'module-1')
    expect(chain.order).toHaveBeenCalledWith('order_index', { ascending: true })
  })

  it('createLesson inserts and returns single row', async () => {
    const chain = makeChain({ id: 'l1', title: 'New Lesson' })
    mockedFrom.mockReturnValue(chain as never)
    const result = await createLesson({
      module_id: 'm1',
      title: 'New Lesson',
      description: null,
      content: null,
      video_url: null,
      duration_minutes: 30,
      order_index: 0,
      is_preview: false,
    })
    expect(result).toEqual({ id: 'l1', title: 'New Lesson' })
    expect(chain.insert).toHaveBeenCalled()
  })

  it('updateLesson updates by id', async () => {
    const chain = makeChain({ id: 'l1', title: 'Updated' })
    mockedFrom.mockReturnValue(chain as never)
    const result = await updateLesson('l1', { title: 'Updated' })
    expect(result).toEqual({ id: 'l1', title: 'Updated' })
    expect(chain.update).toHaveBeenCalledWith({ title: 'Updated' })
  })

  it('deleteLesson deletes by id', async () => {
    const chain = makeChain(null, null)
    mockedFrom.mockReturnValue(chain as never)
    await deleteLesson('l1')
    expect(chain.delete).toHaveBeenCalled()
    expect(chain._deleteEqSpy).toHaveBeenCalledWith('id', 'l1')
  })

  it('throws on error', async () => {
    const chain = makeChain(null, { message: 'DB error' })
    mockedFrom.mockReturnValue(chain as never)
    await expect(listLessons('m1')).rejects.toThrow('DB error')
  })
})
