/**
 * Test de montage du sous-composant EditorToolbar (G6).
 * La toolbar partagée de l'éditeur riche : le bouton « mode étendu » n'apparaît
 * qu'avec showFullscreenToggle, et son clic émet `toggle-fullscreen`.
 * Aucun appel service/route : composant 100 % présentation + handlers locaux.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import EditorToolbar from '@/components/common/EditorToolbar.vue'

// Éditeur TipTap factice : chaîne fluide `chain().focus().X().run()` + isActive.
function makeEditor() {
  const chain = {}
  const methods = [
    'focus', 'run', 'toggleBold', 'toggleItalic', 'toggleStrike', 'toggleCode',
    'toggleHeading', 'setParagraph', 'toggleBulletList', 'toggleOrderedList',
    'toggleBlockquote', 'toggleCodeBlock', 'setLink', 'unsetLink', 'setImage',
    'insertTable', 'setYoutubeVideo', 'undo', 'redo', 'setTextAlign'
  ]
  methods.forEach((m) => { chain[m] = () => chain })
  return { isActive: () => false, can: () => ({ undo: () => true, redo: () => true }), chain: () => chain }
}

function mountToolbar(props = {}) {
  return mount(EditorToolbar, { props: { editor: makeEditor(), ...props } })
}

describe('EditorToolbar (G6) — montage', () => {
  it('monte sans erreur avec un editor fourni', () => {
    const w = mountToolbar()
    expect(w.findAll('button').length).toBeGreaterThan(0)
  })

  it('bouton « mode étendu » masqué par défaut, affiché avec showFullscreenToggle', () => {
    expect(mountToolbar().find('.toolbar-btn-fullscreen').exists()).toBe(false)
    expect(mountToolbar({ showFullscreenToggle: true }).find('.toolbar-btn-fullscreen').exists()).toBe(true)
  })

  it('clic sur « mode étendu » émet toggle-fullscreen', async () => {
    const w = mountToolbar({ showFullscreenToggle: true })
    await w.find('.toolbar-btn-fullscreen').trigger('click')
    expect(w.emitted('toggle-fullscreen')).toBeTruthy()
  })
})
