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

// `duree_estimee_minutes` : la colonne réelle, émise par `GET /lms/matieres/{id}`
// (`MatiereLessonsAndStatsBuilder.php:104`, `$lesson->toArray()`). `duration_minutes`
// est une colonne morte, toujours nulle (#435).
const lesson = {
  id: 7,
  title: 'Algèbre linéaire',
  type: 'cours',
  status: 'published',
  duree_estimee_minutes: 30,
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

  it('#435 — affiche la durée estimée réelle (duree_estimee_minutes)', () => {
    expect(mountCard({ lesson: { ...lesson, duree_estimee_minutes: 45 } }).text()).toContain('45 min')
  })

  it('#435 — ignore la colonne morte duration_minutes', () => {
    const { duree_estimee_minutes: _ignored, ...sansDuree } = lesson
    const w = mountCard({ lesson: { ...sansDuree, duration_minutes: 45 } })
    expect(w.text()).not.toContain('45 min')
  })

  it('expose les actions enseignant uniquement si isTeacher', () => {
    expect(mountCard().find('.btn-edit').exists()).toBe(false)
    expect(mountCard({ isTeacher: true }).find('.btn-edit').exists()).toBe(true)
  })
})
