/**
 * Test de montage de QuestionOptionsEditor (#G6 / H5) : rendu des lignes
 * d'options, ajout/suppression et sélection de la bonne réponse (choix unique
 * et multiple) mutant la question par référence.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import QuestionOptionsEditor from '@/components/lessons/QuestionOptionsEditor.vue'

function mountOptions(question = {}) {
  const q = { type: 'single', options: ['A', 'B'], correct_answer: null, ...question }
  const w = mount(QuestionOptionsEditor, { props: { question: q, index: 0 } })
  return { w, q }
}

describe('QuestionOptionsEditor (#G6 / H5) — montage', () => {
  it('rend une ligne par option', () => {
    const { w } = mountOptions()
    expect(w.findAll('.option-row')).toHaveLength(2)
  })

  it('ajoute puis supprime une option par référence', async () => {
    const { w, q } = mountOptions()
    await w.find('.add-option-btn').trigger('click')
    expect(q.options).toHaveLength(3)
    await w.findAll('.remove-option-btn')[0].trigger('click')
    expect(q.options).toHaveLength(2)
  })

  it('sélectionne la bonne réponse en choix unique', async () => {
    const { w, q } = mountOptions()
    await w.findAll('input[type="radio"]')[1].trigger('change')
    expect(q.correct_answer).toBe(1)
  })

  it('bascule les bonnes réponses en choix multiple', async () => {
    const { w, q } = mountOptions({ type: 'multiple', correct_answer: [] })
    const boxes = w.findAll('input[type="checkbox"]')
    await boxes[0].trigger('change')
    await boxes[1].trigger('change')
    expect(q.correct_answer).toEqual([0, 1])
    await boxes[0].trigger('change')
    expect(q.correct_answer).toEqual([1])
  })

  it('masque l\'ajout et fige les options en true_false', () => {
    const { w } = mountOptions({ type: 'true_false', options: ['Vrai', 'Faux'] })
    expect(w.find('.add-option-btn').exists()).toBe(false)
    expect(w.find('.option-input').attributes('disabled')).toBeDefined()
  })
})
