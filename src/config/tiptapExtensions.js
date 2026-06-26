/**
 * Configuration des extensions TipTap (#28).
 *
 * Extraite de `components/common/TipTapEditor.vue` : centralise la liste et la
 * configuration des extensions de l'éditeur riche, pour alléger le composant et
 * isoler la config (séparation config / présentation).
 */
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import { TextAlign } from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { Highlight } from '@tiptap/extension-highlight'
import { FontFamily } from '@tiptap/extension-font-family'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { TaskList } from '@tiptap/extension-task-list'
import { TaskItem } from '@tiptap/extension-task-item'
import { Youtube } from '@tiptap/extension-youtube'
import { Image } from '@tiptap/extension-image'

/**
 * Construit la liste d'extensions de l'éditeur.
 * @param {string} placeholder - texte indicatif quand l'éditeur est vide
 * @returns {Array} extensions TipTap configurées
 */
export function buildEditorExtensions(placeholder) {
  return [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3]
      },
      // StarterKit v3 inclut désormais Link + Underline : on les désactive ici
      // pour garder nos versions configurées plus bas (sinon « Duplicate
      // extension names: ['link','underline'] »).
      link: false,
      underline: false
    }),
    Placeholder.configure({ placeholder }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: { class: 'editor-link' }
    }),
    Underline,
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    TextStyle,
    Color,
    Highlight.configure({ multicolor: true }),
    FontFamily,
    Table.configure({ resizable: true }),
    TableRow,
    TableCell,
    TableHeader,
    TaskList,
    TaskItem.configure({ nested: true }),
    Youtube.configure({ width: 640, height: 480 }),
    Image.configure({ inline: true, allowBase64: true })
  ]
}
