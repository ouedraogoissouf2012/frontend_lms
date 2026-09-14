import { beforeEach, describe, expect, it, vi } from 'vitest'

const post = vi.fn(() => Promise.resolve({}))
const get = vi.fn(() => Promise.resolve({}))
vi.mock('@/services/api', () => ({ default: { post: (...args) => post(...args), get: (...args) => get(...args) } }))

const { confirmImport, getImport } = await import('@/services/importJob')

beforeEach(() => {
  post.mockClear()
  get.mockClear()
})

describe('importJob (#334)', () => {
  it('confirme sur POST /lms/imports/{id}/confirm', async () => {
    await confirmImport(12)

    expect(post).toHaveBeenCalledWith('/lms/imports/12/confirm')
  })

  it('relit sur GET /lms/imports/{id}', async () => {
    await getImport(12)

    expect(get).toHaveBeenCalledWith('/lms/imports/12')
  })
})
