/**
 * Test de montage de la vue CoordinatorEvaluations (G3).
 * api.get mocké (renvoie des listes vides) ; useRouter mocké ; DashboardLayout
 * stubé en passe-plat. Vérifie le rendu et l'état dérivé après chargement.
 * Parité : aucune source modifiée, mêmes endpoints consommés.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'

const get = vi.fn().mockResolvedValue({ data: [] })

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() })
}))

vi.mock('@/services/api', () => ({
  default: { get }
}))

const stubs = {
  DashboardLayout: { template: '<div><slot /></div>' },
  ContentLoader: { template: '<div class="content-loader" />' }
}

describe('CoordinatorEvaluations (G3) — montage', () => {
  it('monte sans erreur et affiche le titre global', async () => {
    const w = mount((await import('@/views/coordinateur/CoordinatorEvaluations.vue')).default, {
      global: { stubs }
    })
    await flushPromises()
    expect(w.find('.page-title').text()).toBe('Toutes les Évaluations')
  })

  it('charge les évaluations via /evaluations et termine en loading=false', async () => {
    const w = mount((await import('@/views/coordinateur/CoordinatorEvaluations.vue')).default, {
      global: { stubs }
    })
    await flushPromises()
    expect(get).toHaveBeenCalledWith('/evaluations')
    expect(w.vm.loading).toBe(false)
  })
})
