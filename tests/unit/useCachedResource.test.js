/**
 * #224 — useCachedResource (stale-while-revalidate).
 * Prouve : chargement FROID bloquant (rien en cache) ; chargement CHAUD qui sert
 * immédiatement le cache (même périmé) puis revalide en arrière-plan ; une erreur
 * de revalidation CONSERVE la donnée déjà affichée et renseigne `error`.
 */
import { flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockCache } = vi.hoisted(() => ({
  mockCache: { readCacheStale: vi.fn(), writeCache: vi.fn() },
}))
vi.mock('@/services/cache', () => mockCache)

import { useCachedResource } from '@/composables/useCachedResource'

describe('useCachedResource (#224 SWR)', () => {
  beforeEach(() => {
    mockCache.readCacheStale.mockReset()
    mockCache.writeCache.mockReset()
  })

  it('chargement FROID (rien en cache) : loading jusqu\'à la réponse, puis data + écriture cache', async () => {
    mockCache.readCacheStale.mockReturnValue({ data: null, fresh: false })
    const fetcher = vi.fn().mockResolvedValue({ x: 1 })

    const r = useCachedResource('k', fetcher, { immediate: false })
    const p = r.load()
    expect(r.loading.value).toBe(true) // froid → spinner légitime

    await p
    expect(r.data.value).toEqual({ x: 1 })
    expect(r.loading.value).toBe(false)
    expect(mockCache.writeCache).toHaveBeenCalledWith('k', { x: 1 })
  })

  it('chargement CHAUD : sert le cache PÉRIMÉ immédiatement puis revalide en arrière-plan', async () => {
    mockCache.readCacheStale.mockReturnValue({ data: { v: 'stale' }, fresh: false })
    const fetcher = vi.fn().mockResolvedValue({ v: 'frais' })

    const r = useCachedResource('k', fetcher, { immediate: false })
    const p = r.load() // NE PAS await : on vérifie l'affichage SYNCHRONE immédiat

    // Immédiat (avant toute revalidation) : la donnée périmée est affichée, pas de
    // spinner bloquant.
    expect(r.data.value).toEqual({ v: 'stale' })
    expect(r.loading.value).toBe(false)

    // Revalidation d'arrière-plan terminée → mise à jour.
    await p
    await flushPromises()
    expect(r.data.value).toEqual({ v: 'frais' })
    expect(mockCache.writeCache).toHaveBeenCalledWith('k', { v: 'frais' })
  })

  it('erreur de revalidation : CONSERVE la donnée périmée + renseigne error', async () => {
    mockCache.readCacheStale.mockReturnValue({ data: { v: 'stale' }, fresh: false })
    const fetcher = vi.fn().mockRejectedValue({ userMessage: 'Réseau indisponible' })

    const r = useCachedResource('k', fetcher, { immediate: false })
    await r.load()
    await flushPromises()

    expect(r.data.value).toEqual({ v: 'stale' }) // stale conservé, pas d'écran vide
    expect(r.error.value).toBe('Réseau indisponible')
    expect(r.loading.value).toBe(false)
  })

  it('chargement FROID en échec : error renseigné, data reste null', async () => {
    mockCache.readCacheStale.mockReturnValue({ data: null, fresh: false })
    const fetcher = vi.fn().mockRejectedValue({ userMessage: 'boom' })

    const r = useCachedResource('k', fetcher, { immediate: false })
    await r.load()

    expect(r.data.value).toBeNull()
    expect(r.error.value).toBe('boom')
    expect(r.loading.value).toBe(false)
  })

  it('refresh() force une revalidation même sans nouvel appel à load', async () => {
    mockCache.readCacheStale.mockReturnValue({ data: { v: 'a' }, fresh: true })
    const fetcher = vi.fn().mockResolvedValueOnce({ v: 'a' }).mockResolvedValueOnce({ v: 'b' })

    const r = useCachedResource('k', fetcher, { immediate: false })
    await r.load()
    await flushPromises()

    await r.refresh()
    expect(r.data.value).toEqual({ v: 'b' })
    expect(fetcher).toHaveBeenCalledTimes(2)
  })
})
