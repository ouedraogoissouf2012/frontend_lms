/**
 * Test de montage de la vue PreviewEvaluation (G3).
 * vue-router (useRoute/useRouter) et evaluationService.previewEvaluation mockés.
 * Vérifie le rendu du bandeau de prévisualisation et l'appel de chargement.
 * Parité : aucune source modifiée, même endpoint consommé.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'

const previewEvaluation = vi.fn().mockResolvedValue({
  success: true,
  data: { id: 7, titre: 'Prévisualisation', questions_count: 0, questions: [] }
})

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({ params: { id: '7' } })
}))

vi.mock('@/services/evaluation', () => ({
  default: { previewEvaluation, publishEvaluation: vi.fn() }
}))

const stubs = {
  DashboardLayout: { template: '<div><slot /></div>' },
  ContentLoader: { template: '<div class="content-loader" />' }
}

describe('PreviewEvaluation (G3) — montage', () => {
  it('monte sans erreur et affiche le bandeau de prévisualisation', async () => {
    const w = mount((await import('@/views/evaluations/PreviewEvaluation.vue')).default, {
      global: { stubs }
    })
    await flushPromises()
    expect(w.find('.preview-banner-title').text()).toBe('MODE PRÉVISUALISATION')
  })

  it('charge la prévisualisation via previewEvaluation(id) au montage', async () => {
    mount((await import('@/views/evaluations/PreviewEvaluation.vue')).default, {
      global: { stubs }
    })
    await flushPromises()
    expect(previewEvaluation).toHaveBeenCalledWith('7')
  })
})
