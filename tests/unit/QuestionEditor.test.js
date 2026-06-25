/**
 * Test de montage de QuestionEditor (H1) : rend la carte d'une question et émet
 * les actions structurelles (remove, add-option, set-correct) vers la liste.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import QuestionEditor from '@/components/evaluations/QuestionEditor.vue'

function mountEditor(overrides = {}) {
  const question = {
    question: 'Q1', type: 'qcm', points: 1,
    options: ['A', 'B', 'C'], correct_answers: [], correct_answers_text: '',
    ...overrides
  }
  return mount(QuestionEditor, { props: { question, index: 0 } })
}

describe('QuestionEditor (H1) — montage', () => {
  it('monte et affiche le numéro et les options', () => {
    const w = mountEditor()
    expect(w.text()).toContain('Question 1')
    expect(w.findAll('input[type="radio"]').length).toBe(3)
  })

  it('émet "remove" au clic sur la corbeille', async () => {
    const w = mountEditor()
    await w.findAll('button')[0].trigger('click')
    expect(w.emitted('remove')).toBeTruthy()
  })

  it('émet "set-correct" avec l\'option au choix d\'une bonne réponse', async () => {
    const w = mountEditor()
    await w.findAll('input[type="radio"]')[1].trigger('change')
    expect(w.emitted('set-correct')[0]).toEqual(['B'])
  })

  it('émet "add-option" sur "Ajouter une option"', async () => {
    const w = mountEditor()
    const addBtn = w.findAll('button').find(b => b.text().includes('Ajouter une option'))
    await addBtn.trigger('click')
    expect(w.emitted('add-option')).toBeTruthy()
  })

  it('réponse courte : affiche le champ texte dédié', () => {
    const w = mountEditor({ type: 'reponse_courte' })
    expect(w.html()).toContain('Réponse(s) acceptée(s)')
  })
})
