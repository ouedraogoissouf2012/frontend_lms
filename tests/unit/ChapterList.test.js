/**
 * Test de montage du sous-composant ChapterList (H5).
 * Vérifie le rendu des blocs chapitre, le mode édition vs lecture, et l'émission
 * des actions (edit/delete/add) relayées au parent.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import ChapterList from '@/components/lessons/ChapterList.vue'

const stubs = { ChapterEditForm: true, ChapterViewMode: true }

function mountList(props = {}) {
  return mount(ChapterList, {
    props: {
      chapters: [{ id: 1, title: 'Ch1', isEditing: false }],
      readonly: false,
      saving: false,
      getChapterQuiz: () => null,
      ...props
    },
    global: { stubs }
  })
}

describe('ChapterList (H5) — montage', () => {
  it('rend un bloc par chapitre avec son badge numéroté', () => {
    const w = mountList({ chapters: [
      { id: 1, title: 'A', isEditing: false },
      { id: 2, title: 'B', isEditing: false }
    ] })
    expect(w.findAll('.chapter-block')).toHaveLength(2)
    expect(w.find('.chapter-number-badge').text()).toBe('Chapitre 1')
  })

  it('affiche le mode lecture par défaut, l\'éditeur quand isEditing', () => {
    const read = mountList()
    expect(read.findComponent({ name: 'ChapterViewMode' }).exists()).toBe(true)
    const edit = mountList({ chapters: [{ id: 1, title: 'A', isEditing: true }] })
    expect(edit.findComponent({ name: 'ChapterEditForm' }).exists()).toBe(true)
  })

  it('émet « edit » et « delete » depuis les actions inline', async () => {
    const w = mountList()
    await w.find('.btn-edit').trigger('click')
    await w.find('.btn-delete').trigger('click')
    expect(w.emitted('edit')[0][0].id).toBe(1)
    expect(w.emitted('delete')[0][0].id).toBe(1)
  })

  it('émet « add » via le bouton d\'ajout, masqué en readonly', async () => {
    const w = mountList()
    await w.find('.btn-add-chapter-professional').trigger('click')
    expect(w.emitted('add')).toHaveLength(1)
    const ro = mountList({ readonly: true })
    expect(ro.find('.btn-add-chapter-professional').exists()).toBe(false)
    expect(ro.find('.chapter-actions-inline').exists()).toBe(false)
  })
})
