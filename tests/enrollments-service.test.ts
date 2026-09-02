import { beforeEach, describe, expect, it, vi } from 'vitest'
import { supabase } from '@/lib/supabase'
import { enrollInCourse, getMyEnrollment, listMyEnrollments } from '@/services/enrollments'

vi.mock('@/lib/supabase', () => ({ supabase: { from: vi.fn() } }))
const mockedFrom = vi.mocked(supabase.from)

function makeChain(finalData: unknown = null, finalError: unknown = null) {
  const chain: Record<string, (...args: unknown[]) => unknown> = {}
  chain.select = vi.fn().mockReturnThis(); chain.eq = vi.fn().mockReturnThis(); chain.in = vi.fn().mockReturnThis()
  chain.order = vi.fn().mockResolvedValue({ data: finalData, error: finalError })
  chain.insert = vi.fn().mockReturnThis(); chain.single = vi.fn().mockResolvedValue({ data: finalData, error: finalError }); chain.maybeSingle = vi.fn().mockResolvedValue({ data: finalData, error: finalError })
  return chain
}

beforeEach(() => vi.clearAllMocks())

describe('enrollments service', () => {
  it('gets a student enrollment by course', async () => {
    const row = { id: 'e1', student_id: 's1', course_id: 'c1', status: 'active' }
    const chain = makeChain(row); mockedFrom.mockReturnValue(chain as never)
    await expect(getMyEnrollment('s1', 'c1')).resolves.toEqual(row)
    expect(chain.eq).toHaveBeenCalledWith('student_id', 's1'); expect(chain.eq).toHaveBeenCalledWith('course_id', 'c1')
  })

  it('lists active and completed enrollments with their courses', async () => {
    const row = { id: 'e1', student_id: 's1', course_id: 'c1', status: 'active', courses: { id: 'c1', title: 'Course' } }
    const chain = makeChain([row]); mockedFrom.mockReturnValue(chain as never)
    const result = await listMyEnrollments('s1')
    expect(result).toEqual([{ ...row, course: row.courses }]); expect(chain.in).toHaveBeenCalledWith('status', ['active', 'completed'])
  })

  it('creates an active enrollment for the current student', async () => {
    const row = { id: 'e1', student_id: 's1', course_id: 'c1', status: 'active' }
    const chain = makeChain(row); mockedFrom.mockReturnValue(chain as never)
    await expect(enrollInCourse('s1', 'c1')).resolves.toEqual(row)
    expect(chain.insert).toHaveBeenCalledWith({ student_id: 's1', course_id: 'c1', status: 'active' })
  })

  it('throws database errors', async () => {
    const chain = makeChain(null, { message: 'DB error' }); mockedFrom.mockReturnValue(chain as never)
    await expect(getMyEnrollment('s1', 'c1')).rejects.toThrow('DB error')
  })
})
