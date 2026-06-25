/**
 * Test de montage de QuestionItemEditor (H1) : rend la carte riche, met en
 * évidence la bonne réponse, et émet les actions (remove, set-correct, add-option).
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import QuestionItemEditor from '@/components/evaluations/QuestionItemEditor.vue'

function mountEditor(overrides = {}) {
  const question = {
    question: 'Q1', type: 'qcm', points: 1,
    options: ['A', 'B', 'C'], correct_answers: ['A'], correct_answers_text: '',
    ...overrides
  }
  return mount(QuestionItemEditor, { props: { question, index: 0 } })
}

describe('QuestionItemEditor (H1) — montage', () => {
  it('monte, affiche le numéro et surligne la bonne réponse', () => {
    const w = mountEditor()
    expect(w.text()).toContain('Question 1')
    // L'option correcte 'A' reçoit la bordure verte
    expect(w.html()).toContain('border-green-500')
  })

  it('émet "remove" au clic sur la corbeille', async () => {
    const w = mountEditor()
    await w.findAll('button')[0].trigger('click')
    expect(w.emitted('remove')).toBeTruthy()
  })

  it('émet "set-correct" avec l\'option choisie', async () => {
    const w = mountEditor()
    await w.findAll('input[type="radio"]')[2].trigger('change')
    expect(w.emitted('set-correct')[0]).toEqual(['C'])
  })

  it('émet "add-option" sur "Ajouter une option"', async () => {
    const w = mountEditor()
    const addBtn = w.findAll('button').find(b => b.text().includes('Ajouter une option'))
    await addBtn.trigger('click')
    expect(w.emitted('add-option')).toBeTruthy()
  })

  it('réponse courte : affiche le champ dédié', () => {
    const w = mountEditor({ type: 'reponse_courte' })
    expect(w.html()).toContain('Réponse(s) acceptée(s)')
  })
})
