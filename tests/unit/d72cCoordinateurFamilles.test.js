/**
 * D72-c, L3 et L4 : la liste du coordinateur lit l'identité par `utils/identiteEvaluation` et ne RÉÉCRIT
 * plus `klassci_*` (avant : `klassci_classe_id` recevait `classe_id`, un id local sous un nom KLASSCI,
 * contraire à E1/D132). Les filtres suivent la même règle. D-c2 : les alias hors contrat (`teacher_id`,
 * `class_id`, `subject_id`, `teacher`) ne sont plus lus ; ils sont absents d'`EvaluationRecord`
 * (openapi.yaml) et de la spec E2a.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))
const get = vi.fn()
vi.mock('@/services/api', () => ({ default: { get: (...a) => get(...a) } }))
vi.mock('@/services/cache', () => ({ readCache: () => null, writeCache: () => {} }))

import { useCoordinatorEvaluations } from '@/composables/useCoordinatorEvaluations'

const LOCALE = {
  id: 3, titre: 'Locale', status: 'planifiee',
  klassci_enseignant_id: null, enseignant_id: 21,
  klassci_classe_id: null, classe_id: 5,
  klassci_matiere_id: null, matiere_id: 7,
}

function repondre(evaluations) {
  get.mockImplementation((url) => {
    if (url === '/evaluations') return Promise.resolve({ data: evaluations })
    if (url === '/proxy/enseignants') return Promise.resolve({ data: [{ id: 21, nom: 'BEDE', prenom: 'ABEL' }] })
    if (url === '/proxy/classes') return Promise.resolve({ data: [{ id: 5, name: 'B2 COM' }] })
    if (url === '/proxy/matieres') return Promise.resolve({ data: [{ id: 7, nom: 'Marketing' }] })
    return Promise.resolve({ data: [] })
  })
}

async function monter() {
  let api
  mount(defineComponent({ setup() { api = useCoordinatorEvaluations(); return () => null } }))
  await flushPromises()
  await flushPromises()
  return api
}

beforeEach(() => {
  get.mockReset()
})

describe('useCoordinatorEvaluations — les deux familles d’ids (D72-c)', () => {
  it('13. L3 : une évaluation locale garde klassci_* nuls (aucune réécriture)', async () => {
    repondre([LOCALE])
    const u = await monter()
    expect(u.evaluations.value[0]).toMatchObject({
      klassci_classe_id: null, klassci_matiere_id: null, klassci_enseignant_id: null,
      classe_id: 5, matiere_id: 7, enseignant_id: 21,
    })
  })

  it('14. L3 : les noms viennent des référentiels par la règle d’identité', async () => {
    repondre([LOCALE])
    const u = await monter()
    expect(u.evaluations.value[0]).toMatchObject({
      classe_nom: 'B2 COM', matiere_nom: 'Marketing', enseignant_nom: 'BEDE ABEL',
    })
  })

  it('15. L4 : les filtres retrouvent une évaluation locale par ses ids locaux', async () => {
    repondre([LOCALE])
    const u = await monter()
    u.filters.value.classe_id = '5'
    expect(u.filteredEvaluations.value).toHaveLength(1)
    u.filters.value.classe_id = '6'
    expect(u.filteredEvaluations.value).toHaveLength(0)
    u.filters.value.classe_id = ''
    u.filters.value.matiere_id = '7'
    u.filters.value.enseignant_id = '21'
    expect(u.filteredEvaluations.value).toHaveLength(1)
  })

  it('16. D-c2 : les alias hors contrat ne font plus l’identité', async () => {
    repondre([{ id: 4, titre: 'Alias', status: 'planifiee', class_id: 5, subject_id: 7, teacher_id: 21, teacher: { id: 21 } }])
    const u = await monter()
    const e = u.evaluations.value[0]
    expect(e.classe_nom).not.toBe('B2 COM')
    expect(e.matiere_nom).not.toBe('Marketing')
    u.filters.value.classe_id = '5'
    expect(u.filteredEvaluations.value).toHaveLength(0)
    u.filters.value.classe_id = ''
    u.filters.value.enseignant_id = '21'
    expect(u.filteredEvaluations.value).toHaveLength(0)
  })
})
