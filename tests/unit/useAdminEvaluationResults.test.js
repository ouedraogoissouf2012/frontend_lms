/**
 * Test du composable useAdminEvaluationResults (#H3 ≤300) : chargement des
 * évaluations + dérivation enseignants/classes/matières, filtres
 * (enseignant/classe/matière/statut), stats dérivées et navigation.
 * Service api + auth et vue-router mockés.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi } from 'vitest'

const pushMock = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: pushMock }),
}))

vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn((url) => {
      if (url === '/evaluations') {
        return Promise.resolve({
          data: [
            {
              id: 1, titre: 'Eval A', klassci_enseignant_id: 10, enseignant_nom: 'Zoé',
              klassci_classe_id: 5, klassci_matiere_id: 7, status: 'en_cours', is_online: true,
            },
            {
              id: 2, titre: 'Eval B', klassci_enseignant_id: 11, enseignant_nom: 'Alain',
              klassci_classe_id: 6, klassci_matiere_id: 8, status: 'terminee', is_online: false,
            },
          ],
        })
      }
      if (url === '/proxy/classes') return Promise.resolve({ data: [{ id: 5, name: '6e A' }] })
      if (url === '/proxy/matieres') return Promise.resolve({ data: [{ id: 7, nom: 'Maths' }] })
      return Promise.resolve({ data: [] })
    }),
  },
  auth: { getUser: () => ({ role: 'coordinateur' }) },
}))

import { useAdminEvaluationResults } from '@/composables/useAdminEvaluationResults'

async function setup() {
  let api
  const Comp = defineComponent({ setup() { api = useAdminEvaluationResults(); return () => null } })
  mount(Comp)
  await flushPromises()
  return api
}

describe('useAdminEvaluationResults (#H3)', () => {
  it('charge les évaluations et dérive la liste des enseignants', async () => {
    const c = await setup()
    expect(c.loading.value).toBe(false)
    expect(c.evaluations.value).toHaveLength(2)
    expect(c.enseignants.value).toHaveLength(2)
    expect(c.enseignants.value[0].name).toBe('Alain') // trié par nom
  })

  it('expose isCoordinateur selon le rôle', async () => {
    const c = await setup()
    expect(c.isCoordinateur.value).toBe(true)
  })

  it('filtre par enseignant', async () => {
    const c = await setup()
    c.filters.value.enseignant_id = 10
    expect(c.filteredEvaluations.value).toHaveLength(1)
    expect(c.filteredEvaluations.value[0].id).toBe(1)
  })

  it('filtre par statut effectif', async () => {
    const c = await setup()
    c.filters.value.statut = 'terminee'
    expect(c.filteredEvaluations.value).toHaveLength(1)
    expect(c.filteredEvaluations.value[0].id).toBe(2)
  })

  it('calcule les stats sur les évaluations filtrées', async () => {
    const c = await setup()
    expect(c.stats.value).toMatchObject({ total: 2, enCours: 1, terminees: 1, avecVersionEnLigne: 1 })
  })

  it('resetFilters remet tous les filtres à vide', async () => {
    const c = await setup()
    c.filters.value.enseignant_id = 10
    c.filters.value.statut = 'terminee'
    c.resetFilters()
    expect(c.filters.value).toEqual({ enseignant_id: '', classe_id: '', matiere_id: '', statut: '' })
  })

  it('isEvaluationTerminee utilise effective_status puis status', async () => {
    const c = await setup()
    expect(c.isEvaluationTerminee({ status: 'terminee' })).toBe(true)
    expect(c.isEvaluationTerminee({ effective_status: 'en_cours', status: 'terminee' })).toBe(false)
  })

  it('viewResults / viewDetails (coordinateur) naviguent vers les bonnes routes', async () => {
    const c = await setup()
    c.viewResults(3)
    expect(pushMock).toHaveBeenCalledWith('/admin/evaluations/3/details')
    c.viewDetails(4)
    expect(pushMock).toHaveBeenCalledWith('/coordinateur/evaluations/4/preview')
  })

  it('getStatusLabel / getStatusClass mappent les statuts', async () => {
    const c = await setup()
    expect(c.getStatusLabel('en_cours')).toBe('En cours')
    expect(c.getStatusClass('terminee')).toBe('status-completed')
    expect(c.getStatusClass('inconnu')).toBe('status-draft')
  })
})
