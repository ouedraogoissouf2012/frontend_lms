/**
 * Test de montage de QuestionsList (H1) : rend l'en-tête + l'état vide, émet
 * "add", et relaie les actions d'une question en y joignant son index.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import QuestionsList from '@/components/evaluations/QuestionsList.vue'
import QuestionEditor from '@/components/evaluations/QuestionEditor.vue'

const aQuestion = () => ({
  question: '', type: 'qcm', points: 1,
  options: ['A', 'B'], correct_answers: [], correct_answers_text: ''
})

describe('QuestionsList (H1) — montage', () => {
  it('affiche l\'état vide quand aucune question', () => {
    const w = mount(QuestionsList, { props: { questions: [] } })
    expect(w.text()).toContain('Aucune question ajoutée')
  })

  it('émet "add" au clic sur "Ajouter une question"', async () => {
    const w = mount(QuestionsList, { props: { questions: [] } })
    await w.find('button').trigger('click')
    expect(w.emitted('add')).toBeTruthy()
  })

  it('relaie "remove" avec l\'index de la question', async () => {
    const w = mount(QuestionsList, { props: { questions: [aQuestion(), aQuestion()] } })
    // 2e question : sa corbeille est le 1er bouton de la 2e carte
    const editors = w.findAllComponents(QuestionEditor)
    editors[1].vm.$emit('remove')
    await w.vm.$nextTick()
    expect(w.emitted('remove')[0]).toEqual([1])
  })
})
