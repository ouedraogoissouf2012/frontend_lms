/**
 * Test de montage de QuizQuestionNav (#G6 / H5) : pastilles par question, état
 * actif/répondu, désactivation de « précédent » à la première question, et
 * émission des actions (goto, prev, next, submit).
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import QuizQuestionNav from '@/components/lessons/QuizQuestionNav.vue'

function mountNav(props = {}) {
  return mount(QuizQuestionNav, {
    props: { currentIndex: 0, questions: [{}, {}], answers: [null, null], submitting: false, ...props }
  })
}

describe('QuizQuestionNav (#G6 / H5) — montage', () => {
  it('rend une pastille par question, la courante active', () => {
    const w = mountNav()
    const dots = w.findAll('.dot')
    expect(dots).toHaveLength(2)
    expect(dots[0].classes()).toContain('active')
  })

  it('désactive « précédent » sur la première question', () => {
    const w = mountNav({ currentIndex: 0 })
    expect(w.find('.prev-btn').attributes('disabled')).toBeDefined()
  })

  it('émet « next » quand ce n\'est pas la dernière question', async () => {
    const w = mountNav({ currentIndex: 0 })
    expect(w.find('.next-btn').exists()).toBe(true)
    await w.find('.next-btn').trigger('click')
    expect(w.emitted('next')).toBeTruthy()
  })

  it('émet « submit » sur la dernière question', async () => {
    const w = mountNav({ currentIndex: 1 })
    expect(w.find('.next-btn').exists()).toBe(false)
    await w.find('.submit-btn').trigger('click')
    expect(w.emitted('submit')).toBeTruthy()
  })

  it('émet « goto » au clic sur une pastille', async () => {
    const w = mountNav()
    await w.findAll('.dot')[1].trigger('click')
    expect(w.emitted('goto')[0]).toEqual([1])
  })
})
