import { unref } from 'vue'

/**
 * Logique de la barre d'outils de l'éditeur riche (#28, décompo ≤300).
 * Extraite verbatim d'EditorToolbar.vue : handlers à prompt (table/lien/image/
 * vidéo) qui pilotent la chaîne fluide TipTap. `editor` peut être une ref ou un
 * objet brut (prop) ; `unref` couvre les deux sans changer le comportement.
 */
export function useEditorToolbar(editor) {
  const ed = () => unref(editor)

  function insertTable() {
    ed().chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }

  function addLink() {
    const url = window.prompt('URL du lien:')
    if (url) {
      ed().chain().focus().setLink({ href: url }).run()
    }
  }

  function addImage() {
    const url = window.prompt('URL de l\'image:')
    if (url) {
      ed().chain().focus().setImage({ src: url }).run()
    }
  }

  function addYoutubeVideo() {
    const url = window.prompt('URL de la vidéo YouTube:')
    if (url) {
      ed().chain().focus().setYoutubeVideo({ src: url }).run()
    }
  }

  return { insertTable, addLink, addImage, addYoutubeVideo }
}
