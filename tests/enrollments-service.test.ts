import { describe, it, expect, vi, beforeEach } from 'vitest'
import { supabase } from '@/lib/supabase'
import {
  enrollStudent,
  getStudentEnrollments,
  getEnrollmentByCourse,
  isStudentEnrolled,
  updateEnrollmentStatus,
} from '@/services/enrollments'

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

describe('enrollments service', () => {
  it('enrollStudent checks for existing enrollment first', async () => {
    // First call (check) returns null (no existing), second call (insert) returns enrollment
    const checkChain = makeChain(null, null)
    const insertChain = makeChain({ id: 'e1', course_id: 'c1', status: 'active' }, null)
    mockedFrom.mockReturnValueOnce(checkChain as never).mockReturnValueOnce(insertChain as never)

    const result = await enrollStudent('c1')
    expect(result).toEqual({ id: 'e1', course_id: 'c1', status: 'active' })
    expect(checkChain.maybeSingle).toHaveBeenCalled()
    expect(insertChain.insert).toHaveBeenCalled()
    expect(insertChain.single).toHaveBeenCalled()
  })

  it('enrollStudent throws if already enrolled (check finds existing)', async () => {
    const checkChain = makeChain({ id: 'existing' }, null)
    mockedFrom.mockReturnValueOnce(checkChain as never)

    await expect(enrollStudent('c1')).rejects.toThrow('already enrolled')
  })

  it('enrollStudent handles unique constraint violation from DB', async () => {
    const checkChain = makeChain(null, null)
    const insertChain = makeChain(null, { code: '23505', message: 'duplicate' })
    mockedFrom.mockReturnValueOnce(checkChain as never).mockReturnValueOnce(insertChain as never)

    await expect(enrollStudent('c1')).rejects.toThrow('already enrolled')
  })

  it('enrollStudent rethrows other DB errors', async () => {
    const checkChain = makeChain(null, null)
    const insertChain = makeChain(null, { code: '42501', message: 'RLS denied' })
    mockedFrom.mockReturnValueOnce(checkChain as never).mockReturnValueOnce(insertChain as never)

    await expect(enrollStudent('c1')).rejects.toThrow('RLS denied')
  })

  it('getStudentEnrollments fetches with course join and orders by enrolled_at', async () => {
    const chain = makeChain([
      { id: 'e1', course_id: 'c1', status: 'active', course: { id: 'c1', title: 'Course 1' } },
    ], null)
    mockedFrom.mockReturnValue(chain as never)
    const result = await getStudentEnrollments()
    expect(result).toHaveLength(1)
    expect(chain.order).toHaveBeenCalledWith('enrolled_at', { ascending: false })
  })

  it('getEnrollmentByCourse uses maybeSingle', async () => {
    const chain = makeChain({ id: 'e1', course_id: 'c1' }, null)
    mockedFrom.mockReturnValue(chain as never)
    const result = await getEnrollmentByCourse('c1')
    expect(result).toEqual({ id: 'e1', course_id: 'c1' })
    expect(chain.eq).toHaveBeenCalledWith('course_id', 'c1')
    expect(chain.maybeSingle).toHaveBeenCalled()
  })

  it('getEnrollmentByCourse returns null when not enrolled', async () => {
    const chain = makeChain(null, null)
    mockedFrom.mockReturnValue(chain as never)
    const result = await getEnrollmentByCourse('c1')
    expect(result).toBeNull()
  })

  it('isStudentEnrolled returns true when enrollment exists', async () => {
    const chain = makeChain({ id: 'e1' }, null)
    mockedFrom.mockReturnValue(chain as never)
    const result = await isStudentEnrolled('c1')
    expect(result).toBe(true)
  })

  it('isStudentEnrolled returns false when no enrollment', async () => {
    const chain = makeChain(null, null)
    mockedFrom.mockReturnValue(chain as never)
    const result = await isStudentEnrolled('c1')
    expect(result).toBe(false)
  })

  it('updateEnrollmentStatus sets completed_at when status is completed', async () => {
    const chain = makeChain({ id: 'e1', status: 'completed' }, null)
    mockedFrom.mockReturnValue(chain as never)
    await updateEnrollmentStatus('e1', 'completed', '2026-08-25T00:00:00Z')
    expect(chain.update).toHaveBeenCalledWith({ status: 'completed', completed_at: '2026-08-25T00:00:00Z' })
  })

  it('updateEnrollmentStatus clears completed_at when status is not completed', async () => {
    const chain = makeChain({ id: 'e1', status: 'active' }, null)
    mockedFrom.mockReturnValue(chain as never)
    await updateEnrollmentStatus('e1', 'active')
    expect(chain.update).toHaveBeenCalledWith({ status: 'active', completed_at: null })
  })

  it('throws on error from supabase', async () => {
    const chain = makeChain(null, { message: 'DB error' })
    mockedFrom.mockReturnValue(chain as never)
    await expect(getStudentEnrollments()).rejects.toThrow('DB error')
  })
})
