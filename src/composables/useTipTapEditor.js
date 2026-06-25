import { useEditor } from '@tiptap/vue-3'
import { watch, computed, ref, onMounted, onBeforeUnmount } from 'vue'
// #28 : config des extensions + stats de texte extraites
import { buildEditorExtensions } from '@/config/tiptapExtensions'
import { countWords, countCharacters } from '@/utils/textStats'

/**
 * Couche logique de TipTapEditor (#G1 ≤300, décompo TipTapEditor.vue).
 * Déplace TOUT le `<script setup>` de la vue : instanciation de l'éditeur TipTap
 * (useEditor + extensions), synchronisation v-model (onUpdate ↔ watch modelValue),
 * état/commandes plein écran (toggle/close + verrou du scroll body + raccourci
 * Échap), insertion de lien (bubble menu) et compteurs mots/caractères.
 * La vue ne garde que defineProps/defineEmits + le câblage des sous-composants.
 *
 * @param {{ modelValue: string, placeholder: string }} props - props réactives de la vue.
 * @param {(event: string, ...args: any[]) => void} emit - emit de la vue (update:modelValue).
 */
export function useTipTapEditor(props, emit) {
  const isFullscreen = ref(false)

  const editor = useEditor({
    content: props.modelValue,
    extensions: buildEditorExtensions(props.placeholder),
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none'
      }
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      if (html !== props.modelValue) {
        emit('update:modelValue', html)
      }
    }
  })

  // Watch for external changes
  watch(() => props.modelValue, (value) => {
    if (editor.value && editor.value.getHTML() !== value) {
      editor.value.commands.setContent(value, false)
    }
  })

  // Fullscreen toggle
  const toggleFullscreen = () => {
    isFullscreen.value = true
    document.body.style.overflow = 'hidden'
  }

  const closeFullscreen = () => {
    isFullscreen.value = false
    document.body.style.overflow = ''
  }

  // Keyboard shortcuts for fullscreen
  const handleKeydown = (e) => {
    if (e.key === 'Escape' && isFullscreen.value) {
      closeFullscreen()
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeydown)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleKeydown)
    if (isFullscreen.value) {
      document.body.style.overflow = ''
    }
  })

  // Add link (utilisé par la bubble menu ; la toolbar a sa propre copie)
  const addLink = () => {
    const url = window.prompt('URL du lien:')
    if (url) {
      editor.value.chain().focus().setLink({ href: url }).run()
    }
  }

  // insertTable / addImage / addYoutubeVideo : déplacés dans EditorToolbar (#28).

  // Word / character count (logique pure extraite, #28)
  const wordCount = computed(() => (editor.value ? countWords(editor.value.getText()) : 0))
  const characterCount = computed(() => (editor.value ? countCharacters(editor.value.getText()) : 0))

  return {
    editor,
    isFullscreen,
    toggleFullscreen,
    closeFullscreen,
    addLink,
    wordCount,
    characterCount,
  }
}
