/**
 * Test de montage de la vue CreateEvaluation (G3, Options API).
 * klassciService et evaluationService mockés ; $route/$router via global.mocks.
 * Sans paramètres d'URL → chargement des matières/classes KLASSCI seul.
 * Vérifie le rendu de l'en-tête et l'ajout d'une question. Source intacte.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'

const getMatieres = vi.fn().mockResolvedValue({ success: true, data: [] })
const getClasses = vi.fn().mockResolvedValue({ success: true, data: [] })

vi.mock('@/services/klassci', () => ({
  default: { getMatieres, getClasses, getEvaluations: vi.fn() }
}))

vi.mock('@/services/evaluation', () => ({
  default: { createEvaluation: vi.fn(), publishEvaluation: vi.fn() }
}))

function mountCreate(query = {}) {
  return import('@/views/evaluations/CreateEvaluation.vue').then(({ default: cmp }) =>
    mount(cmp, {
      global: {
        mocks: { $route: { query }, $router: { push: vi.fn() } }
      }
    })
  )
}

describe('CreateEvaluation (G3) — montage', () => {
  it('monte sans erreur et affiche le titre « Créer version en ligne »', async () => {
    const w = await mountCreate()
    await flushPromises()
    expect(w.find('h1').text()).toBe('Créer version en ligne')
  })

  it('charge les données KLASSCI (matières + classes) au montage', async () => {
    await mountCreate()
    await flushPromises()
    expect(getMatieres).toHaveBeenCalled()
    expect(getClasses).toHaveBeenCalled()
  })

  it('addQuestion ajoute une question vide', async () => {
    const w = await mountCreate()
    await flushPromises()
    expect(w.vm.questions.length).toBe(0)
    w.vm.addQuestion()
    expect(w.vm.questions.length).toBe(1)
  })
})
