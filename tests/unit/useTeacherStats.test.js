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
  cacheMock: { readCache: vi.fn(), writeCache: vi.fn() },
}))

vi.mock('@/services/klassci', () => ({ klassciService: klassciMock }))
vi.mock('@/services/cache', () => ({ readCache: cacheMock.readCache, writeCache: cacheMock.writeCache }))

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
    cacheMock.readCache.mockReturnValue(null)
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

  it('utilise le cache puis rafraîchit en arrière-plan', async () => {
    cacheMock.readCache.mockReturnValue({ nb_matieres: 99, par_matiere: [], par_classe: [] })
    const s = await setup()
    // Affichage immédiat depuis le cache
    expect(s.loading.value).toBe(false)
    // Le rafraîchissement appelle le service et réécrit le cache
    expect(klassciMock.getTeacherDashboard).toHaveBeenCalled()
    expect(s.stats.value.nb_matieres).toBe(1)
  })

  it('expose une erreur si le chargement échoue', async () => {
    klassciMock.getTeacherDashboard.mockRejectedValue(new Error('boom'))
    const s = await setup()
    expect(s.error.value).toBe('Impossible de charger vos statistiques. Veuillez réessayer.')
    expect(s.loading.value).toBe(false)
  })
})
