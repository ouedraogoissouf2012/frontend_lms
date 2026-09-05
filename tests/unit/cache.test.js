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

import { cacheKey, readCache, writeCache, clearAllCache, clearCacheByPrefix, invalidateEntity, readCacheStale } from '@/services/cache'

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

  it('readCacheStale renvoie la donnée FRAÎCHE avec fresh=true (#224)', () => {
    writeCache('dashboard', { a: 1 })
    expect(readCacheStale('dashboard')).toEqual({ data: { a: 1 }, fresh: true })
  })

  it('readCacheStale renvoie la donnée PÉRIMÉE (fresh=false) sans la purger (#224)', () => {
    // Écrit une entrée expirée (11 min > TTL 5 min) directement.
    localStorage.setItem(
      cacheKey('dashboard'),
      JSON.stringify({ data: { a: 2 }, timestamp: Date.now() - 11 * 60 * 1000 }),
    )
    const out = readCacheStale('dashboard')
    expect(out).toEqual({ data: { a: 2 }, fresh: false }) // servie même périmée
    // readCache (exigeant) la considère expirée ; readCacheStale ne l'a PAS purgée.
    expect(readCacheStale('dashboard').data).toEqual({ a: 2 })
  })

  it('readCacheStale sur entrée absente → { data: null, fresh: false } (#224)', () => {
    expect(readCacheStale('inexistant')).toEqual({ data: null, fresh: false })
  })

  it('invalidateEntity vide toutes les clés sœurs d\'une entité, pas les autres (#237)', () => {
    writeCache('admin_matieres', 1)
    writeCache('admin_klassci_matieres', 2)
    writeCache('teacher_matieres', 3)
    writeCache('admin_classes_v3', 'X') // autre entité → NE doit PAS être touchée

    invalidateEntity('matieres')

    expect(readCache('admin_matieres')).toBeNull()
    expect(readCache('admin_klassci_matieres')).toBeNull()
    expect(readCache('teacher_matieres')).toBeNull()
    expect(readCache('admin_classes_v3')).toBe('X') // intacte
  })

  it('invalidateEntity ignore une entité inconnue sans lever (#237)', () => {
    writeCache('admin_matieres', 1)
    expect(() => invalidateEntity('inconnu')).not.toThrow()
    expect(readCache('admin_matieres')).toBe(1)
  })

  it('clearCacheByPrefix vide toutes les variantes d\'un préfixe (clés scopées par param), pas les autres (#315)', () => {
    writeCache('seances_management_d30', [1])
    writeCache('seances_management_d7', [2])
    writeCache('seances_management', [3]) // variante legacy sans days
    writeCache('autre_ressource', 'X') // autre préfixe → intact

    clearCacheByPrefix('seances_management')

    expect(readCache('seances_management_d30')).toBeNull()
    expect(readCache('seances_management_d7')).toBeNull()
    expect(readCache('seances_management')).toBeNull()
    expect(readCache('autre_ressource')).toBe('X')
  })

  it('clearCacheByPrefix ne touche PAS le cache d\'un AUTRE utilisateur (#315)', () => {
    writeCache('seances_management_d30', [1]) // user 1
    mockAuth.getUser.mockReturnValue({ id: 2 })
    writeCache('seances_management_d30', [2]) // user 2

    clearCacheByPrefix('seances_management') // exécuté en tant que user 2

    expect(readCache('seances_management_d30')).toBeNull() // user 2 vidé
    mockAuth.getUser.mockReturnValue({ id: 1 })
    expect(readCache('seances_management_d30')).toEqual([1]) // user 1 intact
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
