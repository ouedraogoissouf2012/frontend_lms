/**
 * Tests des sous-composants présentationnels de la barre d'outils (#G1 ≤300) :
 * EditorTextGroup / EditorBlockGroup / EditorMediaGroup. Ils reçoivent `editor`
 * en prop et émettent des actions sémantiques (prompts délégués au parent).
 * Aucun appel service/route.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import EditorTextGroup from '@/components/common/EditorTextGroup.vue'
import EditorBlockGroup from '@/components/common/EditorBlockGroup.vue'
import EditorMediaGroup from '@/components/common/EditorMediaGroup.vue'

function makeEditor() {
  const chain = {}
  const methods = [
    'focus', 'run', 'toggleBold', 'toggleItalic', 'toggleStrike', 'toggleUnderline',
    'toggleHeading', 'toggleBulletList', 'toggleOrderedList', 'toggleTaskList',
    'toggleBlockquote', 'toggleCodeBlock', 'setHorizontalRule', 'undo', 'redo',
  ]
  methods.forEach((m) => { chain[m] = () => chain })
  return { isActive: () => false, can: () => ({ undo: () => true, redo: () => true }), chain: () => chain }
}

describe('EditorTextGroup', () => {
  it('masque le bouton plein écran par défaut, l\'affiche avec showFullscreenToggle', () => {
    expect(mount(EditorTextGroup, { props: { editor: makeEditor() } })
      .find('.toolbar-btn-fullscreen').exists()).toBe(false)
    expect(mount(EditorTextGroup, { props: { editor: makeEditor(), showFullscreenToggle: true } })
      .find('.toolbar-btn-fullscreen').exists()).toBe(true)
  })

  it('clic sur « mode étendu » émet toggle-fullscreen', async () => {
    const w = mount(EditorTextGroup, { props: { editor: makeEditor(), showFullscreenToggle: true } })
    await w.find('.toolbar-btn-fullscreen').trigger('click')
    expect(w.emitted('toggle-fullscreen')).toBeTruthy()
  })
})

describe('EditorBlockGroup', () => {
  it('clic sur « insérer tableau » émet insert-table', async () => {
    const w = mount(EditorBlockGroup, { props: { editor: makeEditor() } })
    await w.find('button[title="Insérer tableau"]').trigger('click')
    expect(w.emitted('insert-table')).toBeTruthy()
  })

  it('masque les boutons de tableau hors d\'un tableau', () => {
    const w = mount(EditorBlockGroup, { props: { editor: makeEditor() } })
    expect(w.find('button[title="Ajouter colonne"]').exists()).toBe(false)
  })
})

describe('EditorMediaGroup', () => {
  it('clics média émettent add-link / add-image / add-youtube', async () => {
    const w = mount(EditorMediaGroup, { props: { editor: makeEditor() } })
    await w.find('button[title="Insérer lien"]').trigger('click')
    await w.find('button[title="Insérer image"]').trigger('click')
    await w.find('button[title="Insérer vidéo YouTube"]').trigger('click')
    expect(w.emitted('add-link')).toBeTruthy()
    expect(w.emitted('add-image')).toBeTruthy()
    expect(w.emitted('add-youtube')).toBeTruthy()
  })
})
