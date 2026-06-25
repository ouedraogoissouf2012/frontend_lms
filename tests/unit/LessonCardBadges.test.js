/** Test de rendu LessonCardBadges (#H4 ≤300) : badge type + badge status conditionnel. */
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/services/lesson', () => ({
  default: {
    getTypeBadge: (type) => ({ text: `T-${type}` }),
    getStatusBadge: (status) => ({ text: `S-${status}` })
  }
}))

import LessonCardBadges from '@/components/lessons/LessonCardBadges.vue'

const lesson = { type: 'cours', status: 'draft' }

describe('LessonCardBadges (#H4)', () => {
  it('rend le badge de type avec son icône', () => {
    const w = mount(LessonCardBadges, { props: { lesson } })
    expect(w.text()).toContain('T-cours')
    expect(w.find('.badge-cours').exists()).toBe(true)
    expect(w.find('.fa-book').exists()).toBe(true)
  })

  it('masque le badge de status par défaut et l\'affiche si showStatus', () => {
    const sans = mount(LessonCardBadges, { props: { lesson } })
    expect(sans.text()).not.toContain('S-draft')
    const avec = mount(LessonCardBadges, { props: { lesson, showStatus: true } })
    expect(avec.text()).toContain('S-draft')
    expect(avec.find('.badge-status-draft').exists()).toBe(true)
  })
})
