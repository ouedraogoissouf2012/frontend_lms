/**
 * Tests du composable de données séances coordinateur (G7) — useCoordinatorSeances.
 * Couvre le chargement classes/enseignants, la stratégie cache-first des séances,
 * la construction des params selon les filtres, l'écriture conditionnelle du cache
 * et les états d'erreur. Logique extraite du god-component SeanceManagement.vue.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

const { mockGetClasses, mockGetEnseignants, mockGetUpcoming, mockReadCache, mockWriteCache } =
  vi.hoisted(() => ({
    mockGetClasses: vi.fn(),
    mockGetEnseignants: vi.fn(),
    mockGetUpcoming: vi.fn(),
    mockReadCache: vi.fn(),
    mockWriteCache: vi.fn()
  }))

vi.mock('@/services/lms', () => ({
  default: { getEnseignants: mockGetEnseignants, getUpcomingSeances: mockGetUpcoming }
}))
vi.mock('@/services/klassci', () => ({
  klassciService: { getClasses: mockGetClasses }
}))
vi.mock('@/services/cache', () => ({
  readCache: mockReadCache,
  writeCache: mockWriteCache
}))

import { useCoordinatorSeances } from '@/composables/useCoordinatorSeances'

describe('useCoordinatorSeances (G7)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockReadCache.mockReturnValue(null)
    mockGetClasses.mockResolvedValue([])
    mockGetEnseignants.mockResolvedValue({ success: true, data: [] })
    mockGetUpcoming.mockResolvedValue({ success: true, data: [] })
  })

  it('expose un état initial cohérent', () => {
    const c = useCoordinatorSeances()
    expect(c.loading.value).toBe(false)
    expect(c.error.value).toBe(null)
    expect(c.seances.value).toEqual([])
    expect(c.filters.days).toBe(30)
    expect(c.filters.teacher_id).toBe(null)
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

  it('loadSeances sans cache : appelle l\'API, remplit et écrit le cache', async () => {
    mockGetUpcoming.mockResolvedValue({ success: true, data: [{ id: 'a' }] })
    const c = useCoordinatorSeances()
    await c.loadSeances()
    expect(mockGetUpcoming).toHaveBeenCalledWith({ days: 30 })
    expect(c.seances.value).toEqual([{ id: 'a' }])
    expect(mockWriteCache).toHaveBeenCalledWith('seances_management', {
      data: [{ id: 'a' }],
      filterState: { days: 30 }
    })
    expect(c.loading.value).toBe(false)
  })

  it('loadSeances déballe data.seances quand data.data n\'est pas un tableau', async () => {
    mockGetUpcoming.mockResolvedValue({ success: true, data: { seances: [{ id: 'x' }] } })
    const c = useCoordinatorSeances()
    await c.loadSeances()
    expect(c.seances.value).toEqual([{ id: 'x' }])
  })

  it('loadSeances avec filtres : inclut les params et n\'écrit PAS le cache', async () => {
    const c = useCoordinatorSeances()
    c.filters.teacher_id = 12
    c.filters.classe_id = 5
    await c.loadSeances()
    expect(mockGetUpcoming).toHaveBeenCalledWith({ days: 30, teacher_id: 12, classe_id: 5 })
    expect(mockWriteCache).not.toHaveBeenCalled()
    expect(mockReadCache).not.toHaveBeenCalled()
  })

  it('loadSeances cache-first : sert le cache immédiatement puis rafraîchit en arrière-plan', async () => {
    mockReadCache.mockReturnValue({ data: [{ id: 'cached' }], filterState: { days: 30 } })
    // Refresh d'arrière-plan suspendu : on isole le service du cache (pas d'écrasement)
    mockGetUpcoming.mockReturnValue(new Promise(() => {}))
    const c = useCoordinatorSeances()
    await c.loadSeances()
    expect(c.seances.value).toEqual([{ id: 'cached' }])
    expect(c.loading.value).toBe(false)
    // Le rafraîchissement d'arrière-plan a bien été déclenché
    expect(mockGetUpcoming).toHaveBeenCalledWith({ days: 30 })
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
})
