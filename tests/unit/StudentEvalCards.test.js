/**
 * Tests de montage des sous-cartes de StudentEvaluationsList (H2) :
 * Todo / Done / Practice. Sections présentationnelles pures (prop + emits).
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import StudentEvalTodoCard from '@/components/student/StudentEvalTodoCard.vue'
import StudentEvalDoneCard from '@/components/student/StudentEvalDoneCard.vue'
import StudentEvalPracticeCard from '@/components/student/StudentEvalPracticeCard.vue'

describe('StudentEvalTodoCard (H2)', () => {
  it('fenêtre ouverte → bouton « Commencer » émet start', async () => {
    const w = mount(StudentEvalTodoCard, {
      props: { evaluation: { id: 1, titre: 'Éval', programmation: { window: { has_started: true, is_open: true } } } },
    })
    expect(w.find('.evaluation-title').text()).toBe('Éval')
    const btn = w.find('.btn-start')
    expect(btn.exists()).toBe(true)
    await btn.trigger('click')
    expect(w.emitted('start')[0][0]).toMatchObject({ id: 1 })
  })

  it('soumission en cours → bouton « Continuer » émet continue', async () => {
    const w = mount(StudentEvalTodoCard, {
      props: { evaluation: { id: 2, titre: 'x', student_submission: { status: 'en_cours' } } },
    })
    await w.find('.btn-continue').trigger('click')
    expect(w.emitted('continue')).toBeTruthy()
  })
})

describe('StudentEvalDoneCard (H2)', () => {
  it('affiche la note et émet view-results / start', async () => {
    const w = mount(StudentEvalDoneCard, {
      props: { evaluation: { id: 3, titre: 'Done', student_submission: { note_sur_20: 17 } } },
    })
    expect(w.find('.note-badge').text()).toContain('17/20')
    await w.find('.btn-results').trigger('click')
    expect(w.emitted('view-results')).toBeTruthy()
    await w.find('.btn-practice').trigger('click')
    expect(w.emitted('start')).toBeTruthy()
  })
})

describe('StudentEvalPracticeCard (H2)', () => {
  it('affiche le badge entraînement et émet start', async () => {
    const w = mount(StudentEvalPracticeCard, {
      props: { evaluation: { id: 4, titre: 'Practice' } },
    })
    expect(w.find('.status-practice').text()).toContain('Entraînement')
    await w.find('.btn-practice').trigger('click')
    expect(w.emitted('start')[0][0]).toMatchObject({ id: 4 })
  })
})
