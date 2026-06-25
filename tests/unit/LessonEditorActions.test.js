/** Test LessonEditorActions (#H4 ≤300) : libellés selon mode, emits, bouton supprimer. */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import LessonEditorActions from '@/components/lessons/LessonEditorActions.vue'

describe('LessonEditorActions (#H4)', () => {
  it('mode création : pas de bouton supprimer, libellé « Créer la leçon »', () => {
    const w = mount(LessonEditorActions, { props: { isEditMode: false } })
    expect(w.find('.btn-delete').exists()).toBe(false)
    expect(w.find('.btn-save').text()).toBe('Créer la leçon')
  })

  it('mode édition : bouton supprimer + libellé « Mettre à jour »', () => {
    const w = mount(LessonEditorActions, { props: { isEditMode: true } })
    expect(w.find('.btn-delete').exists()).toBe(true)
    expect(w.find('.btn-save').text()).toBe('Mettre à jour')
  })

  it('désactive et change le libellé pendant l\'enregistrement', () => {
    const w = mount(LessonEditorActions, { props: { saving: true } })
    expect(w.find('.btn-save').attributes('disabled')).toBeDefined()
    expect(w.find('.btn-save').text()).toBe('Enregistrement...')
  })

  it('émet cancel et delete', async () => {
    const w = mount(LessonEditorActions, { props: { isEditMode: true } })
    await w.find('.btn-cancel').trigger('click')
    expect(w.emitted('cancel')).toHaveLength(1)
    await w.find('.btn-delete').trigger('click')
    expect(w.emitted('delete')).toHaveLength(1)
  })
})
