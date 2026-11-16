/**
 * #568 : le titre d'une évaluation n'avait aucun chemin d'interface. L'écran d'édition n'avait pas de champ titre,
 * et `updateEvaluation` n'envoyait pas `titre`, alors que le back l'accepte (UpdateEvaluationRequest : 3 à 255).
 * Le titre se modifie sur l'écran d'édition des questions, pour une évaluation LOCALE. La version en ligne d'une
 * évaluation programmée dans KLASSCI garde le titre de KLASSCI : un renommage local le ferait diverger (déclaré).
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, reactive } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const h = vi.hoisted(() => ({
  route: { query: {}, params: { id: '42' } },
  getEvaluation: vi.fn(),
  updateEvaluation: vi.fn(),
}))
vi.mock('vue-router', () => ({ useRoute: () => h.route, useRouter: () => ({ push: vi.fn(), back: vi.fn() }) }))
vi.mock('@/services/klassci', () => ({ default: { getEvaluations: vi.fn(), getTeacherDashboard: vi.fn() } }))
vi.mock('@/services/evaluation', () => ({ default: { getEvaluation: h.getEvaluation, updateEvaluation: h.updateEvaluation, createEvaluation: vi.fn(), publishEvaluation: vi.fn() } }))

import { useCreateQuestions } from '@/composables/useCreateQuestions'
import QuestionsConfigForm from '@/components/evaluations/QuestionsConfigForm.vue'

const QUESTION = { question: 'Commentez.', type: 'dissertation', points: 2 }
const evaluation = (champs) => ({ success: true, data: { id: 42, duree_minutes: 30, max_attempts: 1, questions: [QUESTION], ...champs } })

async function preparer(champs) {
  h.getEvaluation.mockResolvedValue(evaluation(champs))
  let api
  mount(defineComponent({ setup() { api = useCreateQuestions(); return () => null } }))
  await flushPromises()
  return api
}

beforeEach(() => {
  h.getEvaluation.mockReset()
  h.updateEvaluation.mockReset()
  h.updateEvaluation.mockResolvedValue({ success: true })
})

describe('#568 — le titre d’une évaluation locale se modifie', () => {
  it('le titre est chargé dans le formulaire', async () => {
    const c = await preparer({ titre: 'Ancien titre', klassci_evaluation_id: null })
    expect(c.configuration.titre).toBe('Ancien titre')
  })

  it('le titre modifié part avec la mise à jour, sans les espaces autour', async () => {
    const c = await preparer({ titre: 'Ancien titre', klassci_evaluation_id: null })
    c.configuration.titre = '  Nouveau titre  '
    await c.saveQuestions()
    expect(h.updateEvaluation).toHaveBeenCalledWith(42, expect.objectContaining({ titre: 'Nouveau titre' }))
  })

  it('un titre de moins de 3 caractères ne s’enregistre pas (la règle du back)', async () => {
    const c = await preparer({ titre: 'Ancien titre', klassci_evaluation_id: null })
    c.configuration.titre = ' ab '
    expect(c.peutEnregistrer.value).toBe(false)
  })

  it('version en ligne d’une évaluation KLASSCI : le titre reste celui de KLASSCI, il ne part pas', async () => {
    const c = await preparer({ titre: 'Devoir KLASSCI', klassci_evaluation_id: 9601 })
    expect(c.configuration.titre).toBeNull()
    await c.saveQuestions()
    expect(h.updateEvaluation.mock.calls[0][1]).not.toHaveProperty('titre')
  })
})

describe('#568 — le champ Titre de l’écran d’édition', () => {
  const base = { duree_minutes: 60, max_attempts: 1, shuffle_questions: false, show_results: false }

  it('un titre modifiable : un champ au libellé associé, lié au modèle', async () => {
    const configuration = reactive({ ...base, titre: 'Ancien titre' })
    const w = mount(QuestionsConfigForm, { props: { configuration } })
    expect(w.find('label[for="evaluation-titre"]').text()).toContain('Titre')
    await w.find('#evaluation-titre').setValue('Nouveau titre')
    expect(configuration.titre).toBe('Nouveau titre')
  })

  it('aucun titre modifiable (création, ou version KLASSCI) : pas de champ', () => {
    expect(mount(QuestionsConfigForm, { props: { configuration: reactive({ ...base, titre: null }) } }).find('#evaluation-titre').exists()).toBe(false)
    expect(mount(QuestionsConfigForm, { props: { configuration: reactive(base) } }).find('#evaluation-titre').exists()).toBe(false)
  })
})
