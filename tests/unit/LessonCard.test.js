/**
 * Test de montage du composant LessonCard (G5).
 * Vérifie le rendu (titre, badge de type) et l'émission de l'action principale.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/services/lesson', () => ({
  default: {
    getTypeBadge: () => ({ text: 'Cours' }),
    getStatusBadge: () => ({ text: 'Publié' }),
    formatDuration: (m) => `${m} min`
  }
}))

import LessonCard from '@/components/lessons/LessonCard.vue'

const lesson = {
  id: 7,
  title: 'Algèbre linéaire',
  type: 'cours',
  status: 'published',
  duration_minutes: 30,
  content_type: 'text'
}

function mountCard(props = {}) {
  return mount(LessonCard, {
    props: { lesson, ...props },
    global: { stubs: { LessonProgress: true } }
  })
}

describe('LessonCard (G5) — rendu', () => {
  it('monte sans erreur et affiche le titre + le badge de type', () => {
    const w = mountCard()
    expect(w.find('.lesson-title').text()).toContain('Algèbre linéaire')
    expect(w.find('.lesson-badge').text()).toContain('Cours')
  })

  it("émet « view » avec l'id de la leçon au clic sur Consulter", async () => {
    const w = mountCard()
    await w.find('.btn-primary').trigger('click')
    expect(w.emitted('view')[0]).toEqual([7])
  })

  it('expose les actions enseignant uniquement si isTeacher', () => {
    expect(mountCard().find('.btn-edit').exists()).toBe(false)
    expect(mountCard({ isTeacher: true }).find('.btn-edit').exists()).toBe(true)
  })
})
