/** Test de rendu TeacherLessonCard (#H4 ≤300) : titre, statut, matière, emit view. */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import TeacherLessonCard from '@/components/lessons/TeacherLessonCard.vue'

const lesson = { id: 5, title: 'Vue.js', status: 'published', content_type: 'video', matiere_id: 7, views: 3 }

describe('TeacherLessonCard (#H4)', () => {
  it('affiche titre, libellé statut et matière résolue', () => {
    const w = mount(TeacherLessonCard, {
      props: { lesson, matieres: [{ id: 7, name: 'Maths' }] }
    })
    expect(w.find('.lesson-title').text()).toBe('Vue.js')
    expect(w.find('.status-badge').text()).toContain('Publiée')
    expect(w.find('.status-published').exists()).toBe(true)
    expect(w.find('.lesson-matiere').text()).toContain('Maths')
    expect(w.text()).toContain('3 vues')
  })

  it('matière inconnue si non trouvée et fallback titre', () => {
    const w = mount(TeacherLessonCard, { props: { lesson: { id: 1, status: 'draft' } } })
    expect(w.find('.lesson-matiere').text()).toContain('Matière inconnue')
    expect(w.find('.lesson-title').text()).toBe('Sans titre')
  })

  it('émet view avec la leçon au clic', async () => {
    const w = mount(TeacherLessonCard, { props: { lesson } })
    await w.find('.btn-view').trigger('click')
    expect(w.emitted('view')[0]).toEqual([lesson])
  })
})
