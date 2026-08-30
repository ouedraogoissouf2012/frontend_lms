/**
 * logout() — révocation serveur best-effort (nouveau, Lot F).
 *
 * Défaut réparé : logout() ne purgeait QUE l'état local ; le token Sanctum restait
 * valide côté serveur (rejouable jusqu'à expiration). Désormais logout() appelle
 * revokeSession(token) avec le token CAPTURÉ avant la purge, en arrière-plan.
 *
 * Contrat testé :
 *  - révoque avec le token courant, puis purge localement ;
 *  - un échec réseau de la révocation NE bloque PAS la purge locale ;
 *  - revoke:false (chemin force-logout) ne tente AUCUNE révocation ;
 *  - sans token, aucune révocation.
 */
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

const LOGIN_RESPONSE = {
  success: true,
  data: { token: 'tok-xyz', user: { id: 1, name: 'Awa', role: 'superAdmin' } },
  meta: { institution: 'esi', institution_name: 'ESI Ouaga' },
}

beforeEach(() => {
  setActivePinia(createPinia())
  sessionStorage.clear()
  mockPost.mockReset().mockResolvedValue(LOGIN_RESPONSE)
  mockGet.mockReset()
  mockRevoke.mockReset().mockResolvedValue({})
})

describe('logout — révocation serveur', () => {
  it('révoque le token courant PUIS purge localement', async () => {
    const store = useAuthStore()
    await store.login('awa', 'secret')
    expect(store.token).toBe('tok-xyz')

    store.logout()

    expect(mockRevoke).toHaveBeenCalledTimes(1)
    expect(mockRevoke).toHaveBeenCalledWith('tok-xyz') // token capturé avant purge
    expect(store.token).toBeNull()
    expect(store.isAuthenticated).toBe(false)
  })

  it('purge localement même si la révocation échoue (best-effort)', async () => {
    mockRevoke.mockRejectedValue(new Error('network down'))
    const store = useAuthStore()
    await store.login('awa', 'secret')

    // Ne doit pas lever : l'échec est avalé, la purge locale reste effective.
    expect(() => store.logout()).not.toThrow()
    expect(store.token).toBeNull()
    expect(store.currentUser).toBeNull()
    expect(sessionStorage.getItem('token')).toBeNull()
  })

  it('revoke:false (force-logout) ne tente AUCUNE révocation', async () => {
    const store = useAuthStore()
    await store.login('awa', 'secret')

    store.logout({ revoke: false })

    expect(mockRevoke).not.toHaveBeenCalled()
    expect(store.token).toBeNull()
  })

  it('sans token courant, ne tente aucune révocation', () => {
    const store = useAuthStore()
    expect(store.token).toBeNull()

    store.logout()

    expect(mockRevoke).not.toHaveBeenCalled()
  })
})
