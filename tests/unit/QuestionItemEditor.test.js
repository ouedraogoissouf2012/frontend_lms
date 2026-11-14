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

// B7 (#1059) : des options d'avant #1059 illisibles. La carte le dit (texte du catalogue du front),
// jusqu'à ce qu'elles soient ressaisies ; une question lisible n'affiche rien.
describe('QuestionItemEditor — options illisibles (B7)', () => {
  const ILLISIBLE = "Les options de cette question n'ont pas pu être relues. Saisissez-les de nouveau avant d'enregistrer."

  it('options illisibles : la carte le dit dans une région alert', () => {
    const w = mountEditor({ options: ['', '', '', ''], correct_answers: [], optionsIllisibles: true })
    expect(w.find('[role="alert"]').text()).toBe(ILLISIBLE)
  })

  // D451 : une question illisible n'est « ressaisie » qu'avec des options valides ET une bonne réponse.
  it('options ressaisies sans bonne réponse : la carte le dit encore', () => {
    expect(mountEditor({ options: ['X', 'Y', '', ''], correct_answers: [], optionsIllisibles: true }).find('[role="alert"]').text()).toBe(ILLISIBLE)
  })

  // Migration déclarée (D451) : la bonne réponse choisie fait partie de la ressaisie.
  it('une fois ressaisies, et pour une question lisible : rien', () => {
    expect(mountEditor({ options: ['X', 'Y', '', ''], correct_answers: ['X'], optionsIllisibles: true }).find('[role="alert"]').exists()).toBe(false)
    expect(mountEditor().find('[role="alert"]').exists()).toBe(false)
  })
})

// Défaut PRÉEXISTANT corrigé (D451) : la carte ne permettait pas de choisir la bonne réponse d'une
// question vrai/faux ; son aide disait pourtant « Cochez la bonne réponse (Vrai ou Faux) ».
describe('QuestionItemEditor — la bonne réponse d’un vrai/faux se choisit', () => {
  it('deux boutons radio, Vrai et Faux, qui émettent set-correct', async () => {
    const w = mountEditor({ type: 'vrai_faux', options: ['Vrai', 'Faux'], correct_answers: [] })
    const radios = w.findAll('input[type="radio"]')
    expect(radios).toHaveLength(2)
    await radios[0].trigger('change')
    expect(w.emitted('set-correct')[0]).toEqual(['Vrai'])
  })

  it('la bonne réponse choisie est cochée et mise en évidence', () => {
    const w = mountEditor({ type: 'vrai_faux', options: ['Vrai', 'Faux'], correct_answers: ['Faux'] })
    const radios = w.findAll('input[type="radio"]')
    expect(radios[1].element.checked).toBe(true)
    expect(radios[0].element.checked).toBe(false)
    expect(w.html()).toContain('border-green-500')
  })
})
