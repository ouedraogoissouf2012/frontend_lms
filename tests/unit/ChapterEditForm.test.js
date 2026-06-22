/**
 * Test de montage du sous-composant ChapterEditForm (G5).
 * Vérifie le rendu lié au chapitre et la liaison two-way (édition d'item en place).
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import ChapterEditForm from '@/components/lessons/ChapterEditForm.vue'

function mountForm(chapter = {}) {
  return mount(ChapterEditForm, {
    props: {
      chapter: { title: 'Intro', content_type: 'text', content: '', ...chapter },
      quiz: null,
      saving: false
    },
    global: { stubs: { TipTapEditor: true } }
  })
}

describe('ChapterEditForm (G5) — montage', () => {
  it('monte sans erreur et pré-remplit le titre du chapitre', () => {
    const w = mountForm()
    expect(w.find('.title-input').element.value).toBe('Intro')
    expect(w.find('.content-type-select').exists()).toBe(true)
  })

  it('met à jour le chapitre par référence (édition en place)', async () => {
    const chapter = { title: 'Intro', content_type: 'text', content: '' }
    const w = mount(ChapterEditForm, {
      props: { chapter, quiz: null, saving: false },
      global: { stubs: { TipTapEditor: true } }
    })
    await w.find('.title-input').setValue('Chapitre 1')
    expect(chapter.title).toBe('Chapitre 1')
  })

  it('émet « save » et « cancel » avec le chapitre via les boutons d\'action', async () => {
    const chapter = { title: 'Intro', content_type: 'text', content: '' }
    const w = mount(ChapterEditForm, {
      props: { chapter, quiz: null, saving: false },
      global: { stubs: { TipTapEditor: true } }
    })
    await w.find('.btn-save').trigger('click')
    expect(w.emitted('save')[0]).toEqual([chapter])
    await w.find('.btn-cancel').trigger('click')
    expect(w.emitted('cancel')[0]).toEqual([chapter])
  })

  it('désactive « Enregistrer » tant que le titre est vide', () => {
    const w = mountForm({ title: '' })
    expect(w.find('.btn-save').attributes('disabled')).toBeDefined()
  })
})
