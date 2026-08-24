import { describe, it, expect, vi, beforeEach } from 'vitest'
import { supabase } from '@/lib/supabase'
import {
  listModules,
  createModule,
  updateModule,
  deleteModule,
} from '@/services/modules'

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

describe('modules service', () => {
  it('listModules filters by course_id and orders by order_index', async () => {
    const chain = makeChain([{ id: 'm1', title: 'Module 1' }])
    mockedFrom.mockReturnValue(chain as never)
    const result = await listModules('course-1')
    expect(result).toEqual([{ id: 'm1', title: 'Module 1' }])
    expect(chain.eq).toHaveBeenCalledWith('course_id', 'course-1')
    expect(chain.order).toHaveBeenCalledWith('order_index', { ascending: true })
  })

  it('createModule inserts and returns single row', async () => {
    const chain = makeChain({ id: 'm1', title: 'New Module' })
    mockedFrom.mockReturnValue(chain as never)
    const result = await createModule({
      course_id: 'c1',
      title: 'New Module',
      description: null,
      order_index: 0,
    })
    expect(result).toEqual({ id: 'm1', title: 'New Module' })
    expect(chain.insert).toHaveBeenCalled()
  })

  it('updateModule updates by id', async () => {
    const chain = makeChain({ id: 'm1', title: 'Updated' })
    mockedFrom.mockReturnValue(chain as never)
    const result = await updateModule('m1', { title: 'Updated' })
    expect(result).toEqual({ id: 'm1', title: 'Updated' })
    expect(chain.update).toHaveBeenCalledWith({ title: 'Updated' })
  })

  it('deleteModule deletes by id', async () => {
    const chain = makeChain(null, null)
    mockedFrom.mockReturnValue(chain as never)
    await deleteModule('m1')
    expect(chain.delete).toHaveBeenCalled()
    expect(chain._deleteEqSpy).toHaveBeenCalledWith('id', 'm1')
  })

  it('throws on error', async () => {
    const chain = makeChain(null, { message: 'DB error' })
    mockedFrom.mockReturnValue(chain as never)
    await expect(listModules('c1')).rejects.toThrow('DB error')
  })
})
