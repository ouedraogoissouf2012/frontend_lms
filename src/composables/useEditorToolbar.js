import { unref } from 'vue'

/**
 * Logique de la barre d'outils de l'éditeur riche (#28, décompo ≤300).
 * Handlers à prompt (table/lien/image/vidéo) qui pilotent la chaîne fluide TipTap.
 *
 * ## Les TROIS formes acceptées, et pourquoi la troisième manquait
 *
 * `editor` peut arriver en objet brut, en `ref`, ou en **getter** — et c'est
 * cette dernière que le vrai appelant utilise :
 * `EditorToolbar.vue:48` fait `useEditorToolbar(() => props.editor)`.
 *
 * `unref` d'une fonction rend **la fonction elle-même**. `ed()` retournait donc
 * le getter, pas l'éditeur, et `ed().chain` était `undefined`. Mesuré dans le
 * navigateur sur l'éditeur réel le 2026-09-11 :
 *
 *     TypeError: ed(...).chain is not a function
 *
 * Les QUATRE boutons — tableau, lien, image, vidéo YouTube — étaient morts
 * depuis le refactor `cb12dc31` du 2026-06-25, soit deux mois et demi. Le test
 * du composable restait vert : il ne couvrait que les deux formes qui
 * fonctionnaient, jamais celle de l'appelant.
 *
 * La résolution est donc faite en deux temps — déplier le getter, puis déplier
 * la ref — ce qui couvre aussi un getter rendant une ref.
 */
export function useEditorToolbar(editor) {
  const ed = () => {
    const resolu = typeof editor === 'function' ? editor() : editor
    return unref(resolu)
  }

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
