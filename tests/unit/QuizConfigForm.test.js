/**
 * Test de montage de QuizConfigForm (#G6 / H5) : rendu des champs de config et
 * liaison two-way par référence sur l'objet quiz du parent.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import QuizConfigForm from '@/components/lessons/QuizConfigForm.vue'

function mountForm(quiz = {}) {
  const q = {
    passing_score: 70, max_attempts: null, time_limit_minutes: null,
    shuffle_questions: false, shuffle_options: false,
    show_correct_answers: true, show_explanation: true, is_required: false, ...quiz
  }
  const w = mount(QuizConfigForm, { props: { quiz: q } })
  return { w, q }
}

describe('QuizConfigForm (#G6 / H5) — montage', () => {
  it('rend les trois champs de configuration et l\'option obligatoire', () => {
    const { w } = mountForm()
    expect(w.findAll('.config-input')).toHaveLength(3)
    expect(w.find('.required-quiz-section').exists()).toBe(true)
  })

  it('met à jour le score de réussite du quiz par référence', async () => {
    const { w, q } = mountForm()
    await w.findAll('.config-input')[0].setValue(80)
    expect(q.passing_score).toBe(80)
  })

  it('bascule « quiz obligatoire » par référence', async () => {
    const { w, q } = mountForm()
    await w.find('.required-toggle input[type="checkbox"]').setValue(true)
    expect(q.is_required).toBe(true)
  })
})
