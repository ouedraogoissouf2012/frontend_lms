/**
 * Test de montage du sous-composant ChapterQuizField (H5).
 * Vérifie les trois états (quiz existant / création / chapitre non enregistré)
 * et l'émission « open-quiz-editor ».
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import ChapterQuizField from '@/components/lessons/ChapterQuizField.vue'

describe('ChapterQuizField (H5) — montage', () => {
  it('invite à enregistrer le chapitre quand il n\'a pas d\'id', () => {
    const w = mount(ChapterQuizField, { props: { chapter: {}, quiz: null } })
    expect(w.find('.quiz-save-first').exists()).toBe(true)
    expect(w.find('.quiz-editor-wrapper').exists()).toBe(false)
  })

  it('affiche le résumé du quiz existant et émet « open-quiz-editor » à la modification', async () => {
    const quiz = { title: 'Mon quiz', questions: [{}, {}] }
    const w = mount(ChapterQuizField, { props: { chapter: { id: 7 }, quiz } })
    expect(w.find('.quiz-title').text()).toBe('Mon quiz')
    expect(w.find('.quiz-meta').text()).toContain('2 questions')
    await w.find('.btn-edit-inline-quiz').trigger('click')
    expect(w.emitted('open-quiz-editor')[0]).toEqual([7, quiz])
  })

  it('propose de créer un quiz et émet « open-quiz-editor » avec l\'id seul', async () => {
    const w = mount(ChapterQuizField, { props: { chapter: { id: 9 }, quiz: null } })
    expect(w.find('.quiz-create-prompt').exists()).toBe(true)
    await w.find('.btn-create-quiz').trigger('click')
    expect(w.emitted('open-quiz-editor')[0]).toEqual([9])
  })
})
