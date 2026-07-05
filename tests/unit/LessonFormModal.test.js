/**
 * Test de RENDU de LessonFormModal (#25) : formulaire création/édition de leçon,
 * ouverture conditionnelle, soumission et fermeture via le Modal canonique.
 */
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import LessonFormModal from '@/components/lessons/LessonFormModal.vue'

function mountModal(props = {}) {
  return mount(LessonFormModal, {
    props: {
      show: true,
      matieres: [{ id: 1, nom: 'Maths' }],
      saving: false,
      ...props,
    },
  })
}

describe('LessonFormModal (#25)', () => {
  it('ne rend pas l’overlay quand show=false', () => {
    const w = mountModal({ show: false })
    expect(w.find('.modal-overlay').exists()).toBe(false)
  })

  it('affiche le titre création/édition', () => {
    expect(mountModal().find('.modal-title').text()).toBe('Nouvelle leçon')
    expect(mountModal({ editingLesson: { id: 1 } }).find('.modal-title').text()).toBe('Modifier la leçon')
  })

  it('émet save au submit et close via Annuler/croix/overlay', async () => {
    const w = mountModal()

    await w.find('form').trigger('submit')
    expect(w.emitted('save')).toBeTruthy()

    await w.find('.btn-cancel').trigger('click')
    await w.find('.modal-close-btn').trigger('click')
    await w.find('.modal-overlay').trigger('click')
    expect(w.emitted('close')).toHaveLength(3)
  })
})
