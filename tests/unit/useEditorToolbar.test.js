/**
 * Test du composable useEditorToolbar (#G1 ≤300) : handlers à prompt
 * (table/lien/image/vidéo) extraits d'EditorToolbar. window.prompt mocké ;
 * la chaîne fluide TipTap est un éditeur factice qui enregistre les appels.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import { useEditorToolbar } from '@/composables/useEditorToolbar'

// Éditeur factice : chaîne fluide qui mémorise le dernier appel terminal.
function makeEditor() {
  const calls = []
  const chain = {}
  ;['focus', 'run'].forEach((m) => { chain[m] = () => chain })
  ;['insertTable', 'setLink', 'setImage', 'setYoutubeVideo'].forEach((m) => {
    chain[m] = (arg) => { calls.push({ method: m, arg }); return chain }
  })
  return { calls, chain: () => chain }
}

describe('useEditorToolbar (#G1)', () => {
  let promptSpy
  afterEach(() => { promptSpy?.mockRestore() })

  it('insertTable insère un tableau 3x3 avec en-tête (sans prompt)', () => {
    const editor = makeEditor()
    const { insertTable } = useEditorToolbar(editor)
    insertTable()
    expect(editor.calls).toEqual([
      { method: 'insertTable', arg: { rows: 3, cols: 3, withHeaderRow: true } },
    ])
  })

  it('addLink applique setLink quand une URL est saisie', () => {
    promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('https://x.io')
    const editor = makeEditor()
    useEditorToolbar(editor).addLink()
    expect(promptSpy).toHaveBeenCalledWith('URL du lien:')
    expect(editor.calls).toEqual([{ method: 'setLink', arg: { href: 'https://x.io' } }])
  })

  it('addLink ne fait rien si le prompt est annulé', () => {
    promptSpy = vi.spyOn(window, 'prompt').mockReturnValue(null)
    const editor = makeEditor()
    useEditorToolbar(editor).addLink()
    expect(editor.calls).toEqual([])
  })

  it('addImage applique setImage avec l\'URL saisie', () => {
    promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('img.png')
    const editor = makeEditor()
    useEditorToolbar(editor).addImage()
    expect(promptSpy).toHaveBeenCalledWith('URL de l\'image:')
    expect(editor.calls).toEqual([{ method: 'setImage', arg: { src: 'img.png' } }])
  })

  it('addYoutubeVideo applique setYoutubeVideo avec l\'URL saisie', () => {
    promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('yt.com/v')
    const editor = makeEditor()
    useEditorToolbar(editor).addYoutubeVideo()
    expect(promptSpy).toHaveBeenCalledWith('URL de la vidéo YouTube:')
    expect(editor.calls).toEqual([{ method: 'setYoutubeVideo', arg: { src: 'yt.com/v' } }])
  })

  it('accepte une ref comme editor (unref)', () => {
    const editor = makeEditor()
    const { insertTable } = useEditorToolbar(ref(editor))
    insertTable()
    expect(editor.calls).toHaveLength(1)
  })
})
