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
const readCache = vi.fn()
const writeCache = vi.fn()
vi.mock('@/services/api', () => ({ default: { get: (...a) => get(...a) } }))
vi.mock('@/services/cache', () => ({
  readCache: (...a) => readCache(...a),
  writeCache: (...a) => writeCache(...a)
}))

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

beforeEach(() => {
  push.mockClear()
  get.mockReset()
  readCache.mockReset().mockReturnValue(null)
  writeCache.mockReset()
  mockApi()
})

describe('useCoordinatorEvaluations (H2)', () => {
  it('charge les évaluations et dérive les enseignants triés', async () => {
    const u = await setup()
    expect(get).toHaveBeenCalledWith('/evaluations', { timeout: 15000 })
    expect(u.evaluations.value).toHaveLength(2)
    expect(u.enseignants.value.map(e => e.name)).toEqual(['Ada', 'Zoé'])
    expect(writeCache).toHaveBeenCalledWith('coordinator_evaluations', expect.any(Array))
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

  it('sert le cache des évaluations si /evaluations est trop lent ou échoue', async () => {
    readCache.mockImplementation((key) => (key === 'coordinator_evaluations' ? EVALS : null))
    get.mockReset()
    get.mockRejectedValue(new Error('timeout'))

    const u = await setup()

    expect(u.evaluations.value).toHaveLength(2)
    expect(u.error.value).toBe(null)
    expect(u.loading.value).toBe(false)
  })

  it('termine le chargement même si classes/matières restent pendantes', async () => {
    get.mockReset()
    get.mockImplementation((url) => {
      if (url === '/evaluations') return Promise.resolve({ data: EVALS })
      return new Promise(() => {})
    })

    const u = await setup()

    expect(u.loading.value).toBe(false)
    expect(u.evaluations.value).toHaveLength(2)
    expect(u.error.value).toBe(null)
  })

  it('normalise les enveloppes imbriquées pour évaluations/classes/matières', async () => {
    get.mockReset()
    get.mockImplementation((url) => {
      if (url === '/evaluations') return Promise.resolve({ success: true, data: { data: EVALS } })
      if (url === '/proxy/enseignants') return Promise.resolve({ success: true, data: { enseignants: [{ id: 10, nom: 'Zoé' }] } })
      if (url === '/proxy/classes') return Promise.resolve({ success: true, data: { classes: [{ id: 5 }] } })
      if (url === '/proxy/matieres') return Promise.resolve({ success: true, data: { matieres: [{ id: 7 }] } })
      return Promise.resolve({ data: [] })
    })

    const u = await setup()
    await flushPromises()

    expect(u.evaluations.value).toHaveLength(2)
    expect(u.classes.value).toEqual([{ id: 5 }])
    expect(u.matieres.value).toEqual([{ id: 7 }])
  })

  it('enrichit les noms manquants depuis les références API et les persiste', async () => {
    get.mockReset()
    get.mockImplementation((url) => {
      if (url === '/evaluations') {
        return Promise.resolve({
          data: [
            {
              id: 3,
              titre: 'C',
              enseignant_id: 21,
              classe_id: 5,
              matiere_id: 7,
              status: 'planifiee'
            }
          ]
        })
      }
      if (url === '/proxy/enseignants') return Promise.resolve({ data: [{ id: 21, nom: 'BEDE', prenom: 'ABEL TEST' }] })
      if (url === '/proxy/classes') return Promise.resolve({ data: [{ id: 5, name: 'B2 COM' }] })
      if (url === '/proxy/matieres') return Promise.resolve({ data: [{ id: 7, nom: 'Marketing digital' }] })
      return Promise.resolve({ data: [] })
    })

    const u = await setup()
    await flushPromises()

    expect(u.evaluations.value[0]).toMatchObject({
      enseignant_nom: 'BEDE ABEL TEST',
      classe_nom: 'B2 COM',
      matiere_nom: 'Marketing digital'
    })
    expect(writeCache).toHaveBeenCalledWith('coordinator_evaluation_references', {
      enseignants: expect.arrayContaining([expect.objectContaining({ klassci_id: '21', name: 'BEDE ABEL TEST' })]),
      classes: [{ id: 5, name: 'B2 COM' }],
      matieres: [{ id: 7, nom: 'Marketing digital' }]
    })
  })

  it('réutilise les références persistées pour corriger les cartes au rechargement', async () => {
    readCache.mockImplementation((key) => {
      if (key === 'coordinator_evaluation_references') {
        return {
          enseignants: [{ id: 21, nom: 'BEDE', prenom: 'ABEL TEST' }],
          classes: [{ id: 5, name: 'B2 COM' }],
          matieres: [{ id: 7, nom: 'Marketing digital' }]
        }
      }
      return null
    })
    get.mockReset()
    get.mockImplementation((url) => {
      if (url === '/evaluations') {
        return Promise.resolve({ data: [{ id: 3, enseignant_id: 21, classe_id: 5, matiere_id: 7, status: 'planifiee' }] })
      }
      return Promise.resolve({ data: [] })
    })

    const u = await setup()
    await flushPromises()

    expect(u.evaluations.value[0]).toMatchObject({
      enseignant_nom: 'BEDE ABEL TEST',
      classe_nom: 'B2 COM',
      matiere_nom: 'Marketing digital'
    })
    expect(get).not.toHaveBeenCalledWith('/proxy/classes', expect.anything())
    expect(get).not.toHaveBeenCalledWith('/proxy/matieres', expect.anything())
  })
})
