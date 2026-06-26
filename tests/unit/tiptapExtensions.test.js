import { describe, it, expect } from 'vitest'
import { Editor } from '@tiptap/vue-3'
import { buildEditorExtensions } from '@/config/tiptapExtensions'

/**
 * Régression : StarterKit v3 inclut désormais Link + Underline. Le config les
 * rajoutait → « Duplicate extension names: ['link','underline'] » (TipTap warn).
 * On vérifie qu'un éditeur construit avec buildEditorExtensions n'a AUCUN nom
 * d'extension en double (link/underline désactivés dans StarterKit).
 */
describe('config/tiptapExtensions — buildEditorExtensions', () => {
  it('construit un éditeur sans extension en double (link/underline)', () => {
    const editor = new Editor({
      element: document.createElement('div'),
      extensions: buildEditorExtensions('Placeholder de test'),
      content: ''
    })

    const names = editor.extensionManager.extensions.map((e) => e.name)
    const dupes = names.filter((n, i) => names.indexOf(n) !== i)

    expect(dupes).toEqual([])
    // link + underline présents UNE seule fois (nos versions configurées)
    expect(names.filter((n) => n === 'link')).toHaveLength(1)
    expect(names.filter((n) => n === 'underline')).toHaveLength(1)

    editor.destroy()
  })
})
