/**
 * Tests du composable de données séances coordinateur (G7) — useCoordinatorSeances.
 * Couvre le chargement classes/enseignants, la stratégie SWR des séances portée par
 * `useCachedResource` (#224/#315), la clé scopée par `days`, la mise en cache
 * conditionnelle (sans filtre) et les états d'erreur. Services + cache mockés.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'

const { mockGetClasses, mockGetEnseignants, mockGetUpcoming, mockReadCacheStale, mockWriteCache } =
  vi.hoisted(() => ({
    mockGetClasses: vi.fn(),
    mockGetEnseignants: vi.fn(),
    mockGetUpcoming: vi.fn(),
    mockReadCacheStale: vi.fn(),
    mockWriteCache: vi.fn()
  }))

vi.mock('@/services/lms', () => ({
  default: { getEnseignants: mockGetEnseignants, getUpcomingSeances: mockGetUpcoming }
}))
vi.mock('@/services/klassci', () => ({
  klassciService: { getClasses: mockGetClasses }
}))
vi.mock('@/services/cache', () => ({
  readCacheStale: mockReadCacheStale,
  writeCache: mockWriteCache
}))

import { useCoordinatorSeances } from '@/composables/useCoordinatorSeances'

describe('useCoordinatorSeances (G7)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockReadCacheStale.mockReturnValue({ data: null, fresh: false })
    mockGetClasses.mockResolvedValue([])
    mockGetEnseignants.mockResolvedValue({ success: true, data: [] })
    mockGetUpcoming.mockResolvedValue({ success: true, data: [] })
  })

  it('expose un état initial cohérent, sans auto-load (immediate:false)', () => {
    const c = useCoordinatorSeances()
    expect(c.loading.value).toBe(false)
    expect(c.error.value).toBe(null)
    expect(c.seances.value).toEqual([])
    expect(c.filters.days).toBe(30)
    expect(c.filters.teacher_id).toBe(null)
    expect(mockGetUpcoming).not.toHaveBeenCalled() // le composant déclenche le load
  })

  it('loadClasses remplit classes depuis klassciService', async () => {
    mockGetClasses.mockResolvedValue([{ id: 1 }, { id: 2 }])
    const c = useCoordinatorSeances()
    await c.loadClasses()
    expect(c.classes.value).toHaveLength(2)
  })

  it('loadEnseignants remplit enseignants quand success', async () => {
    mockGetEnseignants.mockResolvedValue({ success: true, data: [{ id: 7 }] })
    const c = useCoordinatorSeances()
    await c.loadEnseignants()
    expect(c.enseignants.value).toEqual([{ id: 7 }])
  })

  it('loadEnseignants ignore une réponse non-success', async () => {
    mockGetEnseignants.mockResolvedValue({ success: false })
    const c = useCoordinatorSeances()
    await c.loadEnseignants()
    expect(c.enseignants.value).toEqual([])
  })

  it('loadSeances sans cache : appelle l\'API, remplit et écrit le cache scopé par days', async () => {
    mockGetUpcoming.mockResolvedValue({ success: true, data: [{ id: 'a' }] })
    const c = useCoordinatorSeances()
    await c.loadSeances()
    expect(mockGetUpcoming).toHaveBeenCalledWith({ days: 30 })
    expect(c.seances.value).toEqual([{ id: 'a' }])
    expect(mockWriteCache).toHaveBeenCalledWith('seances_management_d30', [{ id: 'a' }])
    expect(c.loading.value).toBe(false)
  })

  it('loadSeances déballe data.seances quand data.data n\'est pas un tableau', async () => {
    mockGetUpcoming.mockResolvedValue({ success: true, data: { seances: [{ id: 'x' }] } })
    const c = useCoordinatorSeances()
    await c.loadSeances()
    expect(c.seances.value).toEqual([{ id: 'x' }])
  })

  it('loadSeances avec filtres : inclut les params et n\'écrit NI ne lit le cache', async () => {
    const c = useCoordinatorSeances()
    c.filters.teacher_id = 12
    c.filters.classe_id = 5
    await c.loadSeances()
    expect(mockGetUpcoming).toHaveBeenCalledWith({ days: 30, teacher_id: 12, classe_id: 5 })
    expect(mockWriteCache).not.toHaveBeenCalled()
    expect(mockReadCacheStale).not.toHaveBeenCalled()
  })

  it('loadSeances cache-first : sert le cache (même périmé) immédiatement puis revalide', async () => {
    mockReadCacheStale.mockReturnValue({ data: [{ id: 'cached' }], fresh: false })
    // Revalidation suspendue : on isole l'affichage immédiat du cache.
    mockGetUpcoming.mockReturnValue(new Promise(() => {}))
    const c = useCoordinatorSeances()
    c.loadSeances() // NE PAS await : l'affichage du cache est synchrone
    await flushPromises()
    expect(c.seances.value).toEqual([{ id: 'cached' }])
    expect(c.loading.value).toBe(false)
    expect(mockGetUpcoming).toHaveBeenCalledWith({ days: 30 }) // revalidation déclenchée
  })

  it('loadSeances met error si la réponse échoue', async () => {
    mockGetUpcoming.mockResolvedValue({ success: false })
    const c = useCoordinatorSeances()
    await c.loadSeances()
    expect(c.error.value).toBe('Erreur lors du chargement des séances')
  })

  it('loadSeances met un message d\'erreur si l\'appel jette', async () => {
    mockGetUpcoming.mockRejectedValue(new Error('boom'))
    const c = useCoordinatorSeances()
    await c.loadSeances()
    expect(c.error.value).toBe('Impossible de charger les séances. Veuillez réessayer.')
    expect(c.loading.value).toBe(false)
  })

  it('scope la clé par days : changer days écrit sous une clé DISTINCTE, pas d30 (#315)', async () => {
    mockGetUpcoming.mockResolvedValue({ success: true, data: [{ id: 'a' }] })
    const c = useCoordinatorSeances()
    c.filters.days = 7
    await c.loadSeances()
    expect(mockWriteCache).toHaveBeenCalledWith('seances_management_d7', [{ id: 'a' }])
    expect(mockWriteCache).not.toHaveBeenCalledWith('seances_management_d30', expect.anything())
  })
})
