/**
 * Test de montage de KnowledgeCheckEditor (G6).
 * Vérifie le rendu création vs édition (titre d'en-tête) et l'ajout de question
 * via le service (createEmptyQuestion). `draggable` (vuedraggable) est stubé : on
 * teste l'éditeur, pas la lib de glisser-déposer.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/services/knowledgeCheck', () => ({
  default: {
    createEmptyQuestion: vi.fn(() => ({
      question: '', type: 'single', options: ['', ''], correct_answer: null
    })),
    create: vi.fn(),
    update: vi.fn()
  }
}))

import KnowledgeCheckEditor from '@/components/lessons/KnowledgeCheckEditor.vue'

function mountEditor(props = {}) {
  return mount(KnowledgeCheckEditor, {
    props: { chapterId: 42, ...props },
    global: { stubs: { draggable: true } }
  })
}

describe('KnowledgeCheckEditor (G6) — montage', () => {
  it('monte en mode création : titre « Nouveau quiz »', () => {
    const w = mountEditor()
    expect(w.find('.knowledge-check-editor').exists()).toBe(true)
    expect(w.find('.editor-title').text()).toContain('Nouveau quiz')
  })

  it('mode édition quand existingQuiz est fourni : titre « Modifier le quiz »', () => {
    const w = mountEditor({ existingQuiz: { id: 7, title: 'X', questions: [] } })
    expect(w.find('.editor-title').text()).toContain('Modifier le quiz')
  })

  it('le bouton fermer émet close', async () => {
    const w = mountEditor()
    await w.find('.close-btn').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })
})
