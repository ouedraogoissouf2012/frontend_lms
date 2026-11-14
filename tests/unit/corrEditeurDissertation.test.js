/**
 * Lot CORR (i), validé : l'éditeur de questions propose le type `dissertation`, que le serveur accepte
 * déjà (StoreEvaluationRequest, types `qcm`, `qcm_multiple`, `vrai_faux`, `reponse_courte`,
 * `dissertation`) et que seul le front omettait. Il va AVEC l'écran de correction (même lot) : une
 * dissertation se note à la main depuis « Notes et résultats ».
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import QuestionItemEditor from '@/components/evaluations/QuestionItemEditor.vue'

const monter = (type) => mount(QuestionItemEditor, {
  props: { question: { question: 'Q', type, points: 6, options: [], correct_answers: [], correct_answers_text: '' }, index: 0 },
})

describe('QuestionItemEditor — le type dissertation', () => {
  it('15. le choix « Dissertation » est proposé', () => {
    const valeurs = monter('qcm').findAll('select option').map((o) => o.attributes('value'))
    expect(valeurs).toContain('dissertation')
  })

  it('16. une dissertation n’a ni options ni réponses attendues, et dit qu’elle se note à la main', () => {
    const w = monter('dissertation')
    expect(w.text()).not.toContain('Ajouter une option')
    expect(w.text()).not.toContain('Réponse(s) acceptée(s)')
    expect(w.text()).toContain('Notes et résultats')
  })
})
