/**
 * Test du scope de cache par institution ET par utilisateur (#230).
 *
 * Régression visée : sur poste partagé, l'utilisateur B (même école) lisait le
 * cache localStorage encore valide de A (clé scopée institution seulement, token
 * en sessionStorage effacé à la fermeture d'onglet, purge uniquement au logout).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

const { mockAuth } = vi.hoisted(() => ({
  mockAuth: { getInstitution: vi.fn(), getUser: vi.fn() },
}))
vi.mock('@/services/api', () => ({ auth: mockAuth }))

import { cacheKey, readCache, writeCache, clearAllCache } from '@/services/cache'

describe('cache — scope par institution ET par utilisateur (#230)', () => {
  beforeEach(() => {
    localStorage.clear()
    mockAuth.getInstitution.mockReturnValue('schoolA')
    mockAuth.getUser.mockReturnValue({ id: 1 })
  })

  it('la clé inclut l\'institution ET l\'id utilisateur', () => {
    expect(cacheKey('dashboard')).toBe('dashboard_cache_schoolA_u1')
  })

  it('un autre utilisateur de la MÊME école ne lit pas le cache du premier', () => {
    writeCache('dashboard', { secret: 'A' })
    expect(readCache('dashboard')).toEqual({ secret: 'A' })

    // B se connecte sur le même poste (même école, id différent).
    mockAuth.getUser.mockReturnValue({ id: 2 })
    expect(readCache('dashboard')).toBeNull() // pas de fuite inter-utilisateurs

    // A revient : retrouve bien son propre cache.
    mockAuth.getUser.mockReturnValue({ id: 1 })
    expect(readCache('dashboard')).toEqual({ secret: 'A' })
  })

  it('utilise `anon` avant authentification', () => {
    mockAuth.getUser.mockReturnValue(null)
    expect(cacheKey('x')).toBe('x_cache_schoolA_uanon')
  })

  it('clearAllCache purge toutes les entrées _cache_ (tous users)', () => {
    writeCache('a', 1)
    mockAuth.getUser.mockReturnValue({ id: 2 })
    writeCache('b', 2)
    clearAllCache()
    mockAuth.getUser.mockReturnValue({ id: 1 })
    expect(readCache('a')).toBeNull()
    mockAuth.getUser.mockReturnValue({ id: 2 })
    expect(readCache('b')).toBeNull()
  })
})
