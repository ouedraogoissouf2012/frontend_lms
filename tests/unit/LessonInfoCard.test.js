/** Test de rendu LessonInfoCard (#H4 ≤300) : méta, actions brouillon, emits. */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import LessonInfoCard from '@/components/lessons/LessonInfoCard.vue'

const draft = {
  title: 'Suites numériques',
  description: 'Intro',
  niveau_difficulte: 'intermediaire',
  duree_estimee_minutes: 45,
  status: 'draft',
  prerequis: 'Fonctions'
}

describe('LessonInfoCard (#H4)', () => {
  it('affiche titre, libellé de niveau et durée', () => {
    const w = mount(LessonInfoCard, { props: { lesson: draft } })
    expect(w.find('.lesson-title').text()).toBe('Suites numériques')
    expect(w.find('.badge-intermediaire').text()).toContain('Intermédiaire')
    expect(w.text()).toContain('45 min')
    expect(w.find('.status-draft').exists()).toBe(true)
  })

  it('montre les actions brouillon et émet preview/publish', async () => {
    const w = mount(LessonInfoCard, { props: { lesson: draft } })
    await w.find('.btn-preview').trigger('click')
    expect(w.emitted('preview')).toHaveLength(1)
    await w.find('.btn-publish').trigger('click')
    expect(w.emitted('publish')).toHaveLength(1)
  })

  it('masque les actions en lecture seule', () => {
    const w = mount(LessonInfoCard, { props: { lesson: draft, isReadOnly: true } })
    expect(w.find('.lesson-actions').exists()).toBe(false)
  })

  it('masque les actions si la leçon est publiée', () => {
    const w = mount(LessonInfoCard, { props: { lesson: { ...draft, status: 'published' } } })
    expect(w.find('.lesson-actions').exists()).toBe(false)
    expect(w.find('.status-published').exists()).toBe(true)
  })
})
