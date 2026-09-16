import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach, vi } from 'vitest'

const { mockPost, mockGet, mockRevoke } = vi.hoisted(() => ({
  mockPost: vi.fn(), mockGet: vi.fn(), mockRevoke: vi.fn(),
}))

vi.mock('@/services/api', async (importActual) => {
  const actual = await importActual()
  return { ...actual, default: { post: mockPost, get: mockGet }, revokeSession: mockRevoke }
})
vi.mock('@/services/cache', () => ({ clearAllCache: vi.fn() }))

import { useAuthStore } from '@/stores/auth'

beforeEach(() => {
  setActivePinia(createPinia())
  sessionStorage.clear()
  mockGet.mockReset()
  mockRevoke.mockReset()
})

describe('peutInscrireLocalement (#334)', () => {
  it('absent de meta = false', async () => {
    mockPost.mockResolvedValue({
      success: true,
      data: { token: 't', user: { id: 1, role: 'enseignant' } },
      meta: { institution: 'presentation' },
    })
    const store = useAuthStore()
    await store.login('a', 'b')
    expect(store.peutInscrireLocalement).toBe(false)
  })

  it('true seulement si le serveur l a dit', async () => {
    mockPost.mockResolvedValue({
      success: true,
      data: { token: 't', user: { id: 1, role: 'enseignant' } },
      meta: { institution: 'atelier', peut_inscrire_localement: true },
    })
    const store = useAuthStore()
    await store.login('a', 'b')
    expect(store.peutInscrireLocalement).toBe(true)
  })
})
