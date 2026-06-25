/**
 * Test du composable useCoordinatorEvaluations (H2 ≤300) : chargement global,
 * dérivation des enseignants, filtres (computed), stats et navigation.
 * api + vue-router mockés.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const push = vi.fn()
vi.mock('vue-router', () => ({ useRouter: () => ({ push }) }))

const get = vi.fn()
vi.mock('@/services/api', () => ({ default: { get: (...a) => get(...a) } }))

import { useCoordinatorEvaluations } from '@/composables/useCoordinatorEvaluations'

const EVALS = [
  { id: 1, titre: 'A', klassci_enseignant_id: 10, enseignant_nom: 'Zoé', klassci_classe_id: 5, status: 'en_cours', is_online: true },
  { id: 2, titre: 'B', klassci_enseignant_id: 11, enseignant_nom: 'Ada', klassci_classe_id: 6, status: 'terminee', is_online: false },
]

function mockApi(evals = EVALS) {
  get.mockImplementation((url) => {
    if (url === '/evaluations') return Promise.resolve({ data: evals })
    return Promise.resolve({ data: [] })
  })
}

async function setup() {
  let api
  const Comp = defineComponent({ setup() { api = useCoordinatorEvaluations(); return () => null } })
  mount(Comp)
  await flushPromises()
  return api
}

beforeEach(() => { push.mockClear(); get.mockReset(); mockApi() })

describe('useCoordinatorEvaluations (H2)', () => {
  it('charge les évaluations et dérive les enseignants triés', async () => {
    const u = await setup()
    expect(get).toHaveBeenCalledWith('/evaluations')
    expect(u.evaluations.value).toHaveLength(2)
    expect(u.enseignants.value.map(e => e.name)).toEqual(['Ada', 'Zoé'])
    expect(u.loading.value).toBe(false)
  })

  it('filtre par enseignant et recalcule les stats', async () => {
    const u = await setup()
    u.filters.value.enseignant_id = 10
    expect(u.filteredEvaluations.value).toHaveLength(1)
    expect(u.stats.value.total).toBe(1)
    expect(u.stats.value.enCours).toBe(1)
    expect(u.stats.value.avecVersionEnLigne).toBe(1)
  })

  it('resetFilters remet tous les filtres à vide', async () => {
    const u = await setup()
    u.filters.value.statut = 'terminee'
    u.resetFilters()
    expect(u.filters.value).toEqual({ enseignant_id: '', classe_id: '', matiere_id: '', statut: '' })
    expect(u.filteredEvaluations.value).toHaveLength(2)
  })

  it('viewResults / viewDetails naviguent vers les bonnes routes', async () => {
    const u = await setup()
    u.viewResults(7)
    expect(push).toHaveBeenCalledWith('/admin/evaluations/7/details')
    u.viewDetails(8)
    expect(push).toHaveBeenCalledWith('/coordinateur/evaluations/8/preview')
  })

  it('expose une erreur quand /evaluations échoue', async () => {
    get.mockReset()
    get.mockRejectedValue({ response: { data: { message: 'Boom' } } })
    const u = await setup()
    expect(u.error.value).toBe('Boom')
    expect(u.loading.value).toBe(false)
  })
})
