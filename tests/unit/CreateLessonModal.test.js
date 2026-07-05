/**
 * Test de RENDU de CreateLessonModal (#25) : formulaire de création depuis
 * MatiereDetails, ouverture conditionnelle, mutation du modèle et événements.
 */
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import CreateLessonModal from '@/components/matieres/CreateLessonModal.vue'

function makeLesson() {
  return {
    title: '',
    description: '',
    prerequis: '',
    niveau_difficulte: 'debutant',
    objectifs_pedagogiques: '',
    duree_estimee_minutes: 60,
  }
}

function mountModal(props = {}) {
  return mount(CreateLessonModal, {
    props: {
      visible: true,
      lesson: makeLesson(),
      creating: false,
      ...props,
    },
  })
}

describe('CreateLessonModal (#25)', () => {
  it('ne rend pas l’overlay quand visible=false', () => {
    const w = mountModal({ visible: false })
    expect(w.find('.modal-overlay').exists()).toBe(false)
  })

  it('affiche le formulaire et écrit dans lesson', async () => {
    const lesson = makeLesson()
    const w = mountModal({ lesson })

    expect(w.find('.modal-title').text()).toBe('Créer une nouvelle leçon')
    await w.find('input.form-input').setValue('Nouvelle leçon')
    expect(lesson.title).toBe('Nouvelle leçon')
  })

  it('émet submit et close', async () => {
    const w = mountModal()

    await w.find('form').trigger('submit')
    expect(w.emitted('submit')).toBeTruthy()

    await w.find('.btn-secondary').trigger('click')
    await w.find('.modal-close-btn').trigger('click')
    expect(w.emitted('close')).toHaveLength(2)
  })
})
