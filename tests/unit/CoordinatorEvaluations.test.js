/**
 * Test de montage de la vue CoordinatorEvaluations (G3).
 * api.get mocké (renvoie des listes vides) ; useRouter mocké ; DashboardLayout
 * stubé en passe-plat. Vérifie le rendu et l'état dérivé après chargement.
 * Parité : aucune source modifiée, mêmes endpoints consommés.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'

const get = vi.hoisted(() => vi.fn().mockResolvedValue({ data: [] }))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() })
}))

vi.mock('@/services/api', () => ({
  default: { get }
}))
vi.mock('@/services/cache', () => ({ readCache: vi.fn(() => null), writeCache: vi.fn() }))

vi.mock('@/components/layout/DashboardLayout.vue', () => ({
  default: { name: 'DashboardLayout', template: '<div><slot /></div>' }
}))

vi.mock('@/components/common/ContentLoader.vue', () => ({
  default: { name: 'ContentLoader', template: '<div class="content-loader" />' }
}))

vi.mock('@/components/coordinateur/CoordinatorEvalStats.vue', () => ({
  default: { name: 'CoordinatorEvalStats', props: ['stats'], template: '<section />' }
}))

vi.mock('@/components/coordinateur/CoordinatorEvalFilters.vue', () => ({
  default: {
    name: 'CoordinatorEvalFilters',
    props: ['filters', 'enseignants', 'classes', 'matieres'],
    template: '<section />'
  }
}))

vi.mock('@/components/coordinateur/CoordinatorEvalCard.vue', () => ({
  default: { name: 'CoordinatorEvalCard', props: ['evaluation'], template: '<article />' }
}))

import CoordinatorEvaluations from '@/views/coordinateur/CoordinatorEvaluations.vue'

describe('CoordinatorEvaluations (G3) — montage', () => {
  it('monte sans erreur et affiche le titre global', async () => {
    const w = mount(CoordinatorEvaluations)
    await flushPromises()
    expect(w.find('.page-title').text()).toBe('Toutes les Évaluations')
  })

  it('charge les évaluations via /evaluations et termine en loading=false', async () => {
    const w = mount(CoordinatorEvaluations)
    await flushPromises()
    expect(get).toHaveBeenCalledWith('/evaluations', { timeout: 15000 })
    expect(w.vm.loading).toBe(false)
  })
})
