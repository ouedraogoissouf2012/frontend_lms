/**
 * D72-c, L5 : les résultats d'évaluations (admin, coordinateur) lisent l'identité par
 * `utils/identiteEvaluation`. Avant : filtres et options d'enseignants sur `klassci_*` seulement,
 * donc, dans une école LMS, des filtres vides et AUCUN enseignant proposé.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi } from 'vitest'

const h = vi.hoisted(() => ({
  evaluations: [
    {
      id: 1, titre: 'Locale', status: 'planifiee', enseignant_nom: 'X',
      klassci_enseignant_id: null, enseignant_id: 77,
      klassci_classe_id: null, classe_id: 5,
      klassci_matiere_id: null, matiere_id: 7,
    },
  ],
}))
vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/services/api', () => ({
  default: { get: vi.fn(() => Promise.resolve({ data: h.evaluations })) },
  auth: { getUser: () => ({ role: 'admin' }) },
}))
vi.mock('@/services/klassci', () => ({
  klassciService: { getClasses: vi.fn(() => Promise.resolve([])), getMatieres: vi.fn(() => Promise.resolve([])) },
}))

import { useAdminEvaluationResults } from '@/composables/useAdminEvaluationResults'

async function monter() {
  let api
  mount(defineComponent({ setup() { api = useAdminEvaluationResults(); return () => null } }))
  await flushPromises()
  return api
}

describe('useAdminEvaluationResults — les deux familles d’ids (D72-c)', () => {
  it('17. L5 : l’enseignant d’une évaluation locale est proposé, clé par son id local', async () => {
    const u = await monter()
    expect(u.enseignants.value).toHaveLength(1)
    expect(u.enseignants.value[0]).toMatchObject({ id: '77', name: 'X' })
  })

  it('18. L5 : les filtres classe, matière et enseignant gardent l’évaluation locale', async () => {
    const u = await monter()
    u.filters.value.classe_id = '5'
    u.filters.value.matiere_id = '7'
    u.filters.value.enseignant_id = '77'
    expect(u.filteredEvaluations.value).toHaveLength(1)
    u.filters.value.classe_id = '6'
    expect(u.filteredEvaluations.value).toHaveLength(0)
  })
})
