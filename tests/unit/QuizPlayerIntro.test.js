/**
 * Test de montage de QuizPlayerIntro (#G6 / H5) : titre, stats (score minimum),
 * bouton démarrer (émet « start ») et message de tentatives épuisées.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import QuizPlayerIntro from '@/components/lessons/QuizPlayerIntro.vue'

const quiz = {
  id: 1, title: 'Quiz Chapitre 1', description: 'Testez vos connaissances',
  passing_score: 70, user_best_score: null,
  questions: [{ question: 'Q1' }]
}

describe('QuizPlayerIntro (#G6 / H5) — montage', () => {
  it('affiche le titre et le score minimum requis', () => {
    const w = mount(QuizPlayerIntro, { props: { quiz } })
    expect(w.find('.intro-title').text()).toBe('Quiz Chapitre 1')
    expect(w.html()).toContain('70%')
  })

  it('émet « start » au clic sur le bouton commencer', async () => {
    const w = mount(QuizPlayerIntro, { props: { quiz } })
    await w.find('.start-btn').trigger('click')
    expect(w.emitted('start')).toBeTruthy()
  })

  it('masque le bouton et signale les tentatives épuisées si can_attempt=false', () => {
    const w = mount(QuizPlayerIntro, { props: { quiz: { ...quiz, can_attempt: false } } })
    expect(w.find('.start-btn').exists()).toBe(false)
    expect(w.find('.max-attempts-reached').exists()).toBe(true)
  })
})
