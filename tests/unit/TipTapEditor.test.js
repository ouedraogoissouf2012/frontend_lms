/**
 * Test de montage de TipTapEditor (G6).
 * L'éditeur TipTap (useEditor) et ses extensions sont mockés : on teste le shell
 * Vue (mode normal vs plein écran, intégration de la toolbar), pas ProseMirror.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/config/tiptapExtensions', () => ({ buildEditorExtensions: () => [] }))
vi.mock('@tiptap/vue-3', async () => {
  const { ref } = await import('vue')
  const chain = {}
  ;['focus', 'run', 'setContent', 'setLink'].forEach((m) => { chain[m] = () => chain })
  const editor = ref({
    getHTML: () => '',
    getText: () => '',
    isActive: () => false,
    commands: { setContent: () => {} },
    chain: () => chain
  })
  return {
    useEditor: () => editor,
    EditorContent: { name: 'EditorContent', template: '<div class="editor-content-stub" />' }
  }
})

import TipTapEditor from '@/components/common/TipTapEditor.vue'

function mountEditor(props = {}) {
  return mount(TipTapEditor, {
    props,
    // bubble-menu n'est pas importé (custom element) ; EditorToolbar décorrélé.
    global: { stubs: { EditorToolbar: true, 'bubble-menu': true } }
  })
}

describe('TipTapEditor (G6) — montage', () => {
  it('monte en mode normal avec un editor présent', () => {
    const w = mountEditor({ modelValue: '<p>Bonjour</p>' })
    expect(w.find('.tiptap-editor-wrapper').exists()).toBe(true)
    expect(w.find('.editor-normal').exists()).toBe(true)
  })

  it('rend la zone de contenu de l\'éditeur', () => {
    const w = mountEditor()
    expect(w.find('.editor-content-stub').exists()).toBe(true)
  })
})
