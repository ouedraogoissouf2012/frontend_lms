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

  // #315 — mise en cache conditionnelle
  it('cacheable=false : ne LIT NI n\'ÉCRIT le cache et charge à froid', async () => {
    const fetcher = vi.fn().mockResolvedValue({ v: 'frais' })

    const r = useCachedResource('k', fetcher, { immediate: false, cacheable: () => false })
    const p = r.load()
    expect(r.loading.value).toBe(true) // cache écarté → chargement froid légitime

    await p
    expect(mockCache.readCacheStale).not.toHaveBeenCalled()
    expect(mockCache.writeCache).not.toHaveBeenCalled()
    expect(r.data.value).toEqual({ v: 'frais' })
    expect(r.loading.value).toBe(false)
  })

  it('cacheable=true (défaut) : lit ET écrit le cache comme d\'habitude', async () => {
    mockCache.readCacheStale.mockReturnValue({ data: null, fresh: false })
    const fetcher = vi.fn().mockResolvedValue({ v: 1 })

    const r = useCachedResource('k', fetcher, { immediate: false, cacheable: () => true })
    await r.load()

    expect(mockCache.readCacheStale).toHaveBeenCalledWith('k')
    expect(mockCache.writeCache).toHaveBeenCalledWith('k', { v: 1 })
  })

  // #315 — clé dynamique (name = fonction)
  it('clé dynamique : name fonction est ré-évaluée à CHAQUE load (lit ET écrit sous la clé courante)', async () => {
    mockCache.readCacheStale.mockReturnValue({ data: null, fresh: false })
    const fetcher = vi.fn().mockResolvedValue({ v: 1 })
    let key = 'k_a'
    const r = useCachedResource(() => key, fetcher, { immediate: false })

    await r.load()
    expect(mockCache.readCacheStale).toHaveBeenLastCalledWith('k_a')
    expect(mockCache.writeCache).toHaveBeenLastCalledWith('k_a', { v: 1 })

    key = 'k_b' // le paramètre (ex. filters.days) a changé entre deux chargements
    await r.load()
    expect(mockCache.readCacheStale).toHaveBeenLastCalledWith('k_b')
    expect(mockCache.writeCache).toHaveBeenLastCalledWith('k_b', { v: 1 })
  })

  it('clé dynamique : l\'écriture utilise la clé FIGÉE au début de la revalidation (cohérente avec le fetch)', async () => {
    // Si le paramètre change PENDANT que le réseau répond, la réponse décrit
    // l'état d'AVANT ; elle doit être écrite sous la clé d'avant, pas la nouvelle.
    mockCache.readCacheStale.mockReturnValue({ data: null, fresh: false })
    let key = 'k_at_fetch'
    let resolveFetch
    const fetcher = vi.fn(() => new Promise((res) => { resolveFetch = () => res({ v: 9 }) }))

    const r = useCachedResource(() => key, fetcher, { immediate: false })
    const p = r.load()             // fige key='k_at_fetch' avant le fetch
    key = 'k_changed_midflight'    // le paramètre change en plein vol
    resolveFetch()
    await p
    await flushPromises()

    expect(mockCache.writeCache).toHaveBeenCalledWith('k_at_fetch', { v: 9 })
    expect(mockCache.writeCache).not.toHaveBeenCalledWith('k_changed_midflight', { v: 9 })
  })

  it('clé string (rétro-compat) : comportement historique inchangé', async () => {
    mockCache.readCacheStale.mockReturnValue({ data: null, fresh: false })
    const fetcher = vi.fn().mockResolvedValue({ v: 1 })

    const r = useCachedResource('k_str', fetcher, { immediate: false })
    await r.load()

    expect(mockCache.readCacheStale).toHaveBeenCalledWith('k_str')
    expect(mockCache.writeCache).toHaveBeenCalledWith('k_str', { v: 1 })
  })
})
