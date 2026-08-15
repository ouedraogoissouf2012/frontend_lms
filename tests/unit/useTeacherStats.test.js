/**
 * Test du composable useTeacherStats (#H11 ≤300) : mapping dashboard → compteurs,
 * cache + rafraîchissement en arrière-plan, gestion d'erreur. Services klassci
 * et cache mockés.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { klassciMock, cacheMock } = vi.hoisted(() => ({
  klassciMock: { getTeacherDashboard: vi.fn() },
  cacheMock: { readCacheStale: vi.fn(), writeCache: vi.fn() },
}))

vi.mock('@/services/klassci', () => ({ klassciService: klassciMock }))
// #224 : le composable passe par useCachedResource (SWR) → cache via readCacheStale.
vi.mock('@/services/cache', () => ({ readCacheStale: cacheMock.readCacheStale, writeCache: cacheMock.writeCache }))

import { useTeacherStats } from '@/composables/useTeacherStats'

async function setup() {
  let api
  const Comp = defineComponent({ setup() { api = useTeacherStats(); return () => null } })
  mount(Comp)
  await flushPromises()
  return api
}

const DASHBOARD = {
  matieres: [{ id: 1, nom: 'Maths' }],
  classes: [{ id: 5, nom: '6e A' }],
  evaluations: [{ id: 1 }, { id: 2 }],
  seances: [{ id: 1 }],
  statistiques: { total_etudiants: 30, total_lecons: 8, corrections_effectuees: 4, visio_effectuees: 2, messages_forum: 9 },
}

describe('useTeacherStats (#H11)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    cacheMock.readCacheStale.mockReturnValue({ data: null, fresh: false })
    klassciMock.getTeacherDashboard.mockResolvedValue(DASHBOARD)
  })

  it('mappe le dashboard en compteurs + répartitions', async () => {
    const s = await setup()
    expect(s.stats.value.nb_matieres).toBe(1)
    expect(s.stats.value.nb_etudiants).toBe(30)
    expect(s.stats.value.nb_evaluations).toBe(2)
    expect(s.stats.value.nb_lecons).toBe(8)
    expect(s.stats.value.par_matiere).toHaveLength(1)
    expect(s.stats.value.par_classe).toHaveLength(1)
    expect(cacheMock.writeCache).toHaveBeenCalledWith('teacher_stats', expect.any(Object))
  })

  it('cache PÉRIMÉ : sert le cache (SWR) puis revalide en arrière-plan (#224)', async () => {
    cacheMock.readCacheStale.mockReturnValue({ data: { nb_matieres: 99, par_matiere: [], par_classe: [] }, fresh: false })
    const s = await setup()
    // Affichage immédiat sans blocage
    expect(s.loading.value).toBe(false)
    // La revalidation appelle le service et met à jour
    expect(klassciMock.getTeacherDashboard).toHaveBeenCalled()
    expect(s.stats.value.nb_matieres).toBe(1)
  })

  it('expose une erreur si le chargement échoue', async () => {
    klassciMock.getTeacherDashboard.mockRejectedValue(new Error('boom'))
    const s = await setup()
    expect(s.error.value).toBe('Impossible de charger les données.')
    expect(s.loading.value).toBe(false)
  })
})
