/** Test de rendu LessonCardActions (#H4 ≤300) : actions CRUD enseignant vs consultation. */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import LessonCardActions from '@/components/lessons/LessonCardActions.vue'

describe('LessonCardActions (#H4)', () => {
  it('côté élève : seul le bouton consulter, émet view', async () => {
    const w = mount(LessonCardActions, { props: { lesson: { id: 5, status: 'published' } } })
    expect(w.findAll('button')).toHaveLength(1)
    expect(w.find('.btn-primary').text()).toContain('Consulter')
    await w.find('.btn-primary').trigger('click')
    expect(w.emitted('view')[0]).toEqual([5])
  })

  it('enseignant + brouillon : publier/modifier/supprimer + détails', async () => {
    const w = mount(LessonCardActions, {
      props: { lesson: { id: 9, status: 'draft' }, isTeacher: true }
    })
    expect(w.find('.btn-publish').exists()).toBe(true)
    expect(w.find('.btn-unpublish').exists()).toBe(false)
    expect(w.find('.btn-primary').text()).toContain('Détails')
    await w.find('.btn-publish').trigger('click')
    expect(w.emitted('publish')[0]).toEqual([9])
    await w.find('.btn-edit').trigger('click')
    expect(w.emitted('edit')[0]).toEqual([9])
    await w.find('.btn-delete').trigger('click')
    expect(w.emitted('delete')[0]).toEqual([9])
  })

  it('enseignant + publié : bouton dépublier', () => {
    const w = mount(LessonCardActions, {
      props: { lesson: { id: 9, status: 'published' }, isTeacher: true }
    })
    expect(w.find('.btn-unpublish').exists()).toBe(true)
    expect(w.find('.btn-publish').exists()).toBe(false)
  })
})
