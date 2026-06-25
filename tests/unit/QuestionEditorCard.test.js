/**
 * Test de montage de QuestionEditorCard (#G6 / H5) : rendu des options, logique
 * locale (ajout/suppression d'option, bascule de type, bonne réponse multiple)
 * mutant la question par référence, et émission « remove ».
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import QuestionEditorCard from '@/components/lessons/QuestionEditorCard.vue'

function mountCard(question = {}) {
  const q = {
    question: 'Q1', type: 'single', options: ['A', 'B'],
    correct_answer: null, explanation: '', points: 1, ...question
  }
  const w = mount(QuestionEditorCard, { props: { question: q, index: 0 } })
  return { w, q }
}

describe('QuestionEditorCard (#G6 / H5) — montage', () => {
  it('affiche le numéro de question et une ligne par option', () => {
    const { w } = mountCard()
    expect(w.find('.question-number').text()).toBe('Question 1')
    expect(w.findAll('.option-row')).toHaveLength(2)
  })

  it('ajoute une option à la question par référence', async () => {
    const { w, q } = mountCard()
    await w.find('.add-option-btn').trigger('click')
    expect(q.options).toHaveLength(3)
  })

  it('coche une option comme bonne réponse (choix unique) par référence', async () => {
    const { w, q } = mountCard()
    await w.findAll('input[type="radio"]')[1].trigger('change')
    expect(q.correct_answer).toBe(1)
  })

  it('bascule le type true_false : options Vrai/Faux figées', async () => {
    const { w, q } = mountCard()
    await w.find('.type-select').setValue('true_false')
    expect(q.options).toEqual(['Vrai', 'Faux'])
    expect(q.correct_answer).toBe(null)
  })

  it('émet « remove » au clic sur la corbeille', async () => {
    const { w } = mountCard()
    await w.find('.remove-btn').trigger('click')
    expect(w.emitted('remove')).toBeTruthy()
  })
})
