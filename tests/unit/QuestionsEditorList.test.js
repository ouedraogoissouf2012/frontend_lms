/**
 * Test de montage de QuestionsEditorList (H1) : état vide, émission "add", et
 * relais des actions d'une question avec son index.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import QuestionsEditorList from '@/components/evaluations/QuestionsEditorList.vue'
import QuestionItemEditor from '@/components/evaluations/QuestionItemEditor.vue'

const aQuestion = () => ({
  question: '', type: 'qcm', points: 1,
  options: ['A', 'B'], correct_answers: [], correct_answers_text: ''
})

describe('QuestionsEditorList (H1) — montage', () => {
  it('affiche l\'état vide quand aucune question', () => {
    const w = mount(QuestionsEditorList, { props: { questions: [] } })
    expect(w.text()).toContain('Aucune question ajoutée')
  })

  it('émet "add" au clic sur "Ajouter une question"', async () => {
    const w = mount(QuestionsEditorList, { props: { questions: [] } })
    await w.find('button').trigger('click')
    expect(w.emitted('add')).toBeTruthy()
  })

  it('relaie "remove-option" avec (index, optIndex)', async () => {
    const w = mount(QuestionsEditorList, { props: { questions: [aQuestion(), aQuestion()] } })
    const editors = w.findAllComponents(QuestionItemEditor)
    editors[1].vm.$emit('remove-option', 3)
    await w.vm.$nextTick()
    expect(w.emitted('remove-option')[0]).toEqual([1, 3])
  })
})
