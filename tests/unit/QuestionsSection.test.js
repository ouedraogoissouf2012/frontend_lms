/**
 * Test de montage de QuestionsSection (#G6 / H5) : état vide vs liste de
 * QuestionEditorCard, compteur de questions, aide de validation conditionnelle,
 * et émission « add-question ». `draggable` est stubé (on teste la section).
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import QuestionsSection from '@/components/lessons/QuestionsSection.vue'

const stubs = { draggable: true, QuestionEditorCard: true }

function mountSection(props = {}) {
  return mount(QuestionsSection, {
    props: { questions: [], isValid: false, ...props },
    global: { stubs }
  })
}

describe('QuestionsSection (#G6 / H5) — montage', () => {
  it('affiche l\'état vide quand aucune question', () => {
    const w = mountSection()
    expect(w.find('.empty-questions').exists()).toBe(true)
    expect(w.find('.section-title').text()).toContain('Questions (0)')
  })

  it('rend la liste triable quand il y a des questions', () => {
    const w = mountSection({ questions: [{ question: 'Q1' }, { question: 'Q2' }] })
    expect(w.find('.empty-questions').exists()).toBe(false)
    expect(w.find('.section-title').text()).toContain('Questions (2)')
  })

  it('affiche l\'aide de validation quand des questions existent mais invalides', () => {
    const valid = mountSection({ questions: [{ question: 'Q1' }], isValid: true })
    expect(valid.find('.validation-help').exists()).toBe(false)
    const invalid = mountSection({ questions: [{ question: 'Q1' }], isValid: false })
    expect(invalid.find('.validation-help').exists()).toBe(true)
  })

  it('émet « add-question » au clic sur le bouton d\'ajout', async () => {
    const w = mountSection()
    await w.find('.add-question-btn').trigger('click')
    expect(w.emitted('add-question')).toBeTruthy()
  })
})
