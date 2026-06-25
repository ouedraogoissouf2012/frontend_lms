/**
 * Test du composable useTipTapEditor (#G1 ≤300, décompo TipTapEditor.vue).
 * useEditor (@tiptap/vue-3), les extensions et les stats de texte sont mockés :
 * on teste la logique du shell (synchro v-model, état/commandes plein écran,
 * verrou du scroll body, raccourci Échap, addLink, compteurs), pas ProseMirror.
 */
import { mount } from '@vue/test-utils'
import { defineComponent, nextTick } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// onUpdate capturé pour simuler une frappe utilisateur ; setContent espionné
// pour vérifier la synchro descendante (watch modelValue).
let capturedOnUpdate = null
const setContentSpy = vi.fn()
let editorHTML = '<p>init</p>'
let editorText = 'hello world'

vi.mock('@/config/tiptapExtensions', () => ({ buildEditorExtensions: () => [] }))
vi.mock('@/utils/textStats', () => ({
  countWords: (t) => (t ? t.trim().split(/\s+/).length : 0),
  countCharacters: (t) => (t ? t.length : 0),
}))
vi.mock('@tiptap/vue-3', async () => {
  const { ref } = await import('vue')
  const chain = {}
  ;['focus', 'run', 'setLink'].forEach((m) => { chain[m] = () => chain })
  const editor = ref({
    getHTML: () => editorHTML,
    getText: () => editorText,
    isActive: () => false,
    commands: { setContent: (...args) => setContentSpy(...args) },
    chain: () => chain,
  })
  return {
    useEditor: (config) => { capturedOnUpdate = config.onUpdate; return editor },
    EditorContent: { name: 'EditorContent', template: '<div />' },
  }
})

import { useTipTapEditor } from '@/composables/useTipTapEditor'

function setup(props = { modelValue: '<p>init</p>', placeholder: 'ph' }) {
  let api
  const emitted = []
  const Comp = defineComponent({
    props: ['modelValue', 'placeholder'],
    emits: ['update:modelValue'],
    setup(p, { emit }) {
      api = useTipTapEditor(p, (e, ...a) => { emitted.push([e, ...a]); emit(e, ...a) })
      return () => null
    },
  })
  const wrapper = mount(Comp, { props })
  return { api, emitted, wrapper }
}

beforeEach(() => {
  setContentSpy.mockClear()
  capturedOnUpdate = null
  editorHTML = '<p>init</p>'
  editorText = 'hello world'
})

describe('useTipTapEditor (#G1)', () => {
  it('expose un editor et démarre hors plein écran', () => {
    const { api } = setup()
    expect(api.editor.value).toBeTruthy()
    expect(api.isFullscreen.value).toBe(false)
  })

  it('compte mots et caractères depuis le texte de l\'éditeur', () => {
    const { api } = setup()
    expect(api.wordCount.value).toBe(2) // "hello world"
    expect(api.characterCount.value).toBe('hello world'.length)
  })

  it('toggleFullscreen ouvre et verrouille le scroll du body', () => {
    const { api } = setup()
    api.toggleFullscreen()
    expect(api.isFullscreen.value).toBe(true)
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('closeFullscreen ferme et rétablit le scroll du body', () => {
    const { api } = setup()
    api.toggleFullscreen()
    api.closeFullscreen()
    expect(api.isFullscreen.value).toBe(false)
    expect(document.body.style.overflow).toBe('')
  })

  it('Échap ferme la modale via le listener clavier', () => {
    const { api } = setup()
    api.toggleFullscreen()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(api.isFullscreen.value).toBe(false)
  })

  it('onUpdate émet update:modelValue quand le HTML change', () => {
    const { emitted } = setup({ modelValue: '<p>init</p>', placeholder: 'ph' })
    editorHTML = '<p>changed</p>'
    capturedOnUpdate({ editor: { getHTML: () => editorHTML } })
    expect(emitted).toContainEqual(['update:modelValue', '<p>changed</p>'])
  })

  it('n\'émet pas si le HTML est inchangé (égal à modelValue)', () => {
    const { emitted } = setup({ modelValue: '<p>same</p>', placeholder: 'ph' })
    capturedOnUpdate({ editor: { getHTML: () => '<p>same</p>' } })
    expect(emitted).toHaveLength(0)
  })

  it('le watch modelValue pousse le contenu externe dans l\'éditeur', async () => {
    const { wrapper } = setup({ modelValue: '<p>init</p>', placeholder: 'ph' })
    editorHTML = '<p>init</p>' // l'éditeur diffère de la nouvelle valeur
    await wrapper.setProps({ modelValue: '<p>external</p>' })
    await nextTick()
    expect(setContentSpy).toHaveBeenCalledWith('<p>external</p>', false)
  })

  it('addLink applique le lien quand un URL est saisi', () => {
    const { api } = setup()
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('https://x.io')
    expect(() => api.addLink()).not.toThrow()
    expect(promptSpy).toHaveBeenCalled()
    promptSpy.mockRestore()
  })

  it('nettoie le listener clavier au démontage', () => {
    const { wrapper, api } = setup()
    api.toggleFullscreen()
    wrapper.unmount()
    // body overflow rétabli car isFullscreen était true au démontage
    expect(document.body.style.overflow).toBe('')
    // après démontage, Échap ne change plus l'état exposé
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(api.isFullscreen.value).toBe(true)
  })
})
