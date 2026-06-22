/**
 * Test de montage de KnowledgeCheckPlayer (G6).
 * État initial « intro » : aucun appel service au montage (startAttempt n'est
 * déclenché que par le clic « Commencer »). On vérifie le rendu de l'intro.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/services/knowledgeCheck', () => ({
  default: {
    startAttempt: vi.fn(),
    submitAttempt: vi.fn(),
    createEmptyQuestion: vi.fn(() => ({}))
  }
}))

import KnowledgeCheckPlayer from '@/components/lessons/KnowledgeCheckPlayer.vue'

const quiz = {
  id: 1,
  title: 'Quiz Chapitre 1',
  description: 'Testez vos connaissances',
  passing_score: 70,
  questions: [{ question: 'Q1', options: ['a', 'b'], type: 'single', correct_answer: 0 }]
}

describe('KnowledgeCheckPlayer (G6) — montage', () => {
  it('monte en état intro et affiche le titre du quiz', () => {
    const w = mount(KnowledgeCheckPlayer, { props: { quiz } })
    expect(w.find('.knowledge-check-player').exists()).toBe(true)
    expect(w.find('.intro-title').text()).toBe('Quiz Chapitre 1')
  })

  it('affiche le score minimum requis', () => {
    const w = mount(KnowledgeCheckPlayer, { props: { quiz } })
    expect(w.html()).toContain('70%')
  })
})
