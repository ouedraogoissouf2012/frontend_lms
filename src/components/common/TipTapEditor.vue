<template>
  <div class="tiptap-editor-wrapper">
    <!-- Editor normal (mode non-fullscreen) -->
    <div v-if="!isFullscreen" class="editor-normal">
      <!-- Toolbar -->
      <div v-if="editor" class="editor-toolbar-modern">
        <!-- Fullscreen toggle -->
        <div class="toolbar-group">
          <button
            @click="toggleFullscreen"
            class="toolbar-btn toolbar-btn-fullscreen"
            type="button"
            title="Ouvrir en mode étendu"
          >
            <span class="icon-fullscreen">⛶</span>
            <span class="btn-label">Mode étendu</span>
          </button>
        </div>

        <div class="toolbar-divider"></div>

        <!-- Font family -->
        <div class="toolbar-group">
          <select
            @change="editor.chain().focus().setFontFamily($event.target.value).run()"
            class="toolbar-select"
            title="Police de caractères"
          >
            <option value="">Police par défaut</option>
            <option value="Arial, sans-serif">Arial</option>
            <option value="'Times New Roman', serif">Times New Roman</option>
            <option value="'Courier New', monospace">Courier New</option>
            <option value="Georgia, serif">Georgia</option>
            <option value="Verdana, sans-serif">Verdana</option>
          </select>
        </div>

        <div class="toolbar-divider"></div>

        <!-- Text formatting -->
        <div class="toolbar-group">
          <button
            @click="editor.chain().focus().toggleBold().run()"
            :class="{ 'is-active': editor.isActive('bold') }"
            class="toolbar-btn"
            type="button"
            title="Gras (Ctrl+B)"
          >
            <strong>B</strong>
          </button>
          <button
            @click="editor.chain().focus().toggleItalic().run()"
            :class="{ 'is-active': editor.isActive('italic') }"
            class="toolbar-btn"
            type="button"
            title="Italique (Ctrl+I)"
          >
            <em>I</em>
          </button>
          <button
            @click="editor.chain().focus().toggleUnderline().run()"
            :class="{ 'is-active': editor.isActive('underline') }"
            class="toolbar-btn"
            type="button"
            title="Souligné (Ctrl+U)"
          >
            <u>U</u>
          </button>
          <button
            @click="editor.chain().focus().toggleStrike().run()"
            :class="{ 'is-active': editor.isActive('strike') }"
            class="toolbar-btn"
            type="button"
            title="Barré"
          >
            <s>S</s>
          </button>
        </div>

        <div class="toolbar-divider"></div>

        <!-- Text color -->
        <div class="toolbar-group">
          <input
            type="color"
            @input="editor.chain().focus().setColor($event.target.value).run()"
            value="#000000"
            class="color-picker"
            title="Couleur du texte"
          />
          <input
            type="color"
            @input="editor.chain().focus().toggleHighlight({ color: $event.target.value }).run()"
            value="#ffff00"
            class="color-picker"
            title="Surlignage"
          />
        </div>

        <div class="toolbar-divider"></div>

        <!-- Text alignment -->
        <div class="toolbar-group">
          <button
            @click="editor.chain().focus().setTextAlign('left').run()"
            :class="{ 'is-active': editor.isActive({ textAlign: 'left' }) }"
            class="toolbar-btn"
            type="button"
            title="Aligner à gauche"
          >
            fa-bars
          </button>
          <button
            @click="editor.chain().focus().setTextAlign('center').run()"
            :class="{ 'is-active': editor.isActive({ textAlign: 'center' }) }"
            class="toolbar-btn"
            type="button"
            title="Centrer"
          >
            ☷
          </button>
          <button
            @click="editor.chain().focus().setTextAlign('right').run()"
            :class="{ 'is-active': editor.isActive({ textAlign: 'right' }) }"
            class="toolbar-btn"
            type="button"
            title="Aligner à droite"
          >
            ☱
          </button>
          <button
            @click="editor.chain().focus().setTextAlign('justify').run()"
            :class="{ 'is-active': editor.isActive({ textAlign: 'justify' }) }"
            class="toolbar-btn"
            type="button"
            title="Justifier"
          >
            ☶
          </button>
        </div>

        <div class="toolbar-divider"></div>

        <!-- Headings -->
        <div class="toolbar-group">
          <button
            @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
            :class="{ 'is-active': editor.isActive('heading', { level: 1 }) }"
            class="toolbar-btn"
            type="button"
            title="Titre 1"
          >
            H1
          </button>
          <button
            @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
            :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }"
            class="toolbar-btn"
            type="button"
            title="Titre 2"
          >
            H2
          </button>
          <button
            @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
            :class="{ 'is-active': editor.isActive('heading', { level: 3 }) }"
            class="toolbar-btn"
            type="button"
            title="Titre 3"
          >
            H3
          </button>
        </div>

        <div class="toolbar-divider"></div>

        <!-- Lists -->
        <div class="toolbar-group">
          <button
            @click="editor.chain().focus().toggleBulletList().run()"
            :class="{ 'is-active': editor.isActive('bulletList') }"
            class="toolbar-btn"
            type="button"
            title="Liste à puces"
          >
            •
          </button>
          <button
            @click="editor.chain().focus().toggleOrderedList().run()"
            :class="{ 'is-active': editor.isActive('orderedList') }"
            class="toolbar-btn"
            type="button"
            title="Liste numérotée"
          >
            1.
          </button>
          <button
            @click="editor.chain().focus().toggleTaskList().run()"
            :class="{ 'is-active': editor.isActive('taskList') }"
            class="toolbar-btn"
            type="button"
            title="Liste de tâches"
          >
            ☑
          </button>
        </div>

        <div class="toolbar-divider"></div>

        <!-- Table -->
        <div class="toolbar-group">
          <button
            @click="insertTable"
            class="toolbar-btn"
            type="button"
            title="Insérer tableau"
          >
            ⊞
          </button>
          <button
            v-if="editor.isActive('table')"
            @click="editor.chain().focus().addColumnAfter().run()"
            class="toolbar-btn"
            type="button"
            title="Ajouter colonne"
          >
            |+
          </button>
          <button
            v-if="editor.isActive('table')"
            @click="editor.chain().focus().addRowAfter().run()"
            class="toolbar-btn"
            type="button"
            title="Ajouter ligne"
          >
            —+
          </button>
          <button
            v-if="editor.isActive('table')"
            @click="editor.chain().focus().deleteTable().run()"
            class="toolbar-btn"
            type="button"
            title="Supprimer tableau"
          >
            ⊠
          </button>
        </div>

        <div class="toolbar-divider"></div>

        <!-- Blocks -->
        <div class="toolbar-group">
          <button
            @click="editor.chain().focus().toggleBlockquote().run()"
            :class="{ 'is-active': editor.isActive('blockquote') }"
            class="toolbar-btn"
            type="button"
            title="Citation"
          >
            "
          </button>
          <button
            @click="editor.chain().focus().toggleCodeBlock().run()"
            :class="{ 'is-active': editor.isActive('codeBlock') }"
            class="toolbar-btn"
            type="button"
            title="Bloc de code"
          >
            { }
          </button>
          <button
            @click="editor.chain().focus().setHorizontalRule().run()"
            class="toolbar-btn"
            type="button"
            title="Ligne horizontale"
          >
            —
          </button>
        </div>

        <div class="toolbar-divider"></div>

        <!-- Media -->
        <div class="toolbar-group">
          <button
            @click="addLink"
            :class="{ 'is-active': editor.isActive('link') }"
            class="toolbar-btn"
            type="button"
            title="Insérer lien"
          >
            🔗
          </button>
          <button
            @click="addImage"
            class="toolbar-btn"
            type="button"
            title="Insérer image"
          >
            🖼️
          </button>
          <button
            @click="addYoutubeVideo"
            class="toolbar-btn"
            type="button"
            title="Insérer vidéo YouTube"
          >
            fa-play
          </button>
        </div>

        <div class="toolbar-divider"></div>

        <!-- Actions -->
        <div class="toolbar-group">
          <button
            @click="editor.chain().focus().undo().run()"
            :disabled="!editor.can().undo()"
            class="toolbar-btn"
            type="button"
            title="Annuler (Ctrl+Z)"
          >
            ↶
          </button>
          <button
            @click="editor.chain().focus().redo().run()"
            :disabled="!editor.can().redo()"
            class="toolbar-btn"
            type="button"
            title="Rétablir (Ctrl+Y)"
          >
            ↷
          </button>
        </div>
      </div>

      <!-- Editor Content -->
      <div class="editor-content-wrapper">
        <editor-content :editor="editor" class="editor-content-modern" />

        <!-- Bubble Menu (Toolbar Flottante) -->
        <bubble-menu
          v-if="editor"
          :editor="editor"
          :tippy-options="{ duration: 100, placement: 'top' }"
          class="bubble-menu-custom"
        >
          <button
            @click="editor.chain().focus().toggleBold().run()"
            :class="{ 'is-active': editor.isActive('bold') }"
            class="bubble-btn"
            title="Gras"
          >
            <strong>B</strong>
          </button>
          <button
            @click="editor.chain().focus().toggleItalic().run()"
            :class="{ 'is-active': editor.isActive('italic') }"
            class="bubble-btn"
            title="Italique"
          >
            <em>I</em>
          </button>
          <button
            @click="editor.chain().focus().toggleUnderline().run()"
            :class="{ 'is-active': editor.isActive('underline') }"
            class="bubble-btn"
            title="Souligné"
          >
            <u>U</u>
          </button>
          <button
            @click="editor.chain().focus().toggleStrike().run()"
            :class="{ 'is-active': editor.isActive('strike') }"
            class="bubble-btn"
            title="Barré"
          >
            <s>S</s>
          </button>
          <div class="bubble-divider"></div>
          <button
            @click="addLink"
            :class="{ 'is-active': editor.isActive('link') }"
            class="bubble-btn"
            title="Lien"
          >
            🔗
          </button>
          <input
            type="color"
            @input="editor.chain().focus().setColor($event.target.value).run()"
            class="bubble-color-picker"
            title="Couleur"
          />
          <input
            type="color"
            @input="editor.chain().focus().toggleHighlight({ color: $event.target.value }).run()"
            class="bubble-color-picker"
            title="Surligner"
          />
        </bubble-menu>
      </div>

      <!-- Footer -->
      <div class="editor-footer-modern">
        <div class="footer-left">
          <span class="word-count">{{ wordCount }} mots</span>
          <span class="char-count">{{ characterCount }} caractères</span>
        </div>
      </div>
    </div>

    <!-- Modal Fullscreen (90% de l'écran) -->
    <teleport to="body">
      <transition name="modal-fade">
        <div v-if="isFullscreen" class="modal-overlay" @click="closeFullscreen">
          <div class="modal-container" @click.stop>
            <!-- Modal Header -->
            <div class="modal-header">
              <h2 class="modal-title">Édition du contenu</h2>
              <button @click="closeFullscreen" class="btn-close-modal" title="Fermer (Échap)">
                <span class="close-icon">✕</span>
                <span class="close-text">Fermer</span>
              </button>
            </div>

            <!-- Modal Toolbar -->
            <div v-if="editor" class="modal-toolbar">
              <!-- Font family -->
              <div class="toolbar-group">
                <select
                  @change="editor.chain().focus().setFontFamily($event.target.value).run()"
                  class="toolbar-select"
                  title="Police de caractères"
                >
                  <option value="">Police par défaut</option>
                  <option value="Arial, sans-serif">Arial</option>
                  <option value="'Times New Roman', serif">Times New Roman</option>
                  <option value="'Courier New', monospace">Courier New</option>
                  <option value="Georgia, serif">Georgia</option>
                  <option value="Verdana, sans-serif">Verdana</option>
                </select>
              </div>

              <div class="toolbar-divider"></div>

              <!-- Text formatting -->
              <div class="toolbar-group">
                <button
                  @click="editor.chain().focus().toggleBold().run()"
                  :class="{ 'is-active': editor.isActive('bold') }"
                  class="toolbar-btn"
                  type="button"
                  title="Gras (Ctrl+B)"
                >
                  <strong>B</strong>
                </button>
                <button
                  @click="editor.chain().focus().toggleItalic().run()"
                  :class="{ 'is-active': editor.isActive('italic') }"
                  class="toolbar-btn"
                  type="button"
                  title="Italique (Ctrl+I)"
                >
                  <em>I</em>
                </button>
                <button
                  @click="editor.chain().focus().toggleUnderline().run()"
                  :class="{ 'is-active': editor.isActive('underline') }"
                  class="toolbar-btn"
                  type="button"
                  title="Souligné (Ctrl+U)"
                >
                  <u>U</u>
                </button>
                <button
                  @click="editor.chain().focus().toggleStrike().run()"
                  :class="{ 'is-active': editor.isActive('strike') }"
                  class="toolbar-btn"
                  type="button"
                  title="Barré"
                >
                  <s>S</s>
                </button>
              </div>

              <div class="toolbar-divider"></div>

              <!-- Text color -->
              <div class="toolbar-group">
                <input
                  type="color"
                  @input="editor.chain().focus().setColor($event.target.value).run()"
                  value="#000000"
                  class="color-picker"
                  title="Couleur du texte"
                />
                <input
                  type="color"
                  @input="editor.chain().focus().toggleHighlight({ color: $event.target.value }).run()"
                  value="#ffff00"
                  class="color-picker"
                  title="Surlignage"
                />
              </div>

              <div class="toolbar-divider"></div>

              <!-- Text alignment -->
              <div class="toolbar-group">
                <button
                  @click="editor.chain().focus().setTextAlign('left').run()"
                  :class="{ 'is-active': editor.isActive({ textAlign: 'left' }) }"
                  class="toolbar-btn"
                  type="button"
                  title="Aligner à gauche"
                >
                  fa-bars
                </button>
                <button
                  @click="editor.chain().focus().setTextAlign('center').run()"
                  :class="{ 'is-active': editor.isActive({ textAlign: 'center' }) }"
                  class="toolbar-btn"
                  type="button"
                  title="Centrer"
                >
                  ☷
                </button>
                <button
                  @click="editor.chain().focus().setTextAlign('right').run()"
                  :class="{ 'is-active': editor.isActive({ textAlign: 'right' }) }"
                  class="toolbar-btn"
                  type="button"
                  title="Aligner à droite"
                >
                  ☱
                </button>
                <button
                  @click="editor.chain().focus().setTextAlign('justify').run()"
                  :class="{ 'is-active': editor.isActive({ textAlign: 'justify' }) }"
                  class="toolbar-btn"
                  type="button"
                  title="Justifier"
                >
                  ☶
                </button>
              </div>

              <div class="toolbar-divider"></div>

              <!-- Headings -->
              <div class="toolbar-group">
                <button
                  @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
                  :class="{ 'is-active': editor.isActive('heading', { level: 1 }) }"
                  class="toolbar-btn"
                  type="button"
                  title="Titre 1"
                >
                  H1
                </button>
                <button
                  @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
                  :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }"
                  class="toolbar-btn"
                  type="button"
                  title="Titre 2"
                >
                  H2
                </button>
                <button
                  @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
                  :class="{ 'is-active': editor.isActive('heading', { level: 3 }) }"
                  class="toolbar-btn"
                  type="button"
                  title="Titre 3"
                >
                  H3
                </button>
              </div>

              <div class="toolbar-divider"></div>

              <!-- Lists -->
              <div class="toolbar-group">
                <button
                  @click="editor.chain().focus().toggleBulletList().run()"
                  :class="{ 'is-active': editor.isActive('bulletList') }"
                  class="toolbar-btn"
                  type="button"
                  title="Liste à puces"
                >
                  •
                </button>
                <button
                  @click="editor.chain().focus().toggleOrderedList().run()"
                  :class="{ 'is-active': editor.isActive('orderedList') }"
                  class="toolbar-btn"
                  type="button"
                  title="Liste numérotée"
                >
                  1.
                </button>
                <button
                  @click="editor.chain().focus().toggleTaskList().run()"
                  :class="{ 'is-active': editor.isActive('taskList') }"
                  class="toolbar-btn"
                  type="button"
                  title="Liste de tâches"
                >
                  ☑
                </button>
              </div>

              <div class="toolbar-divider"></div>

              <!-- Table -->
              <div class="toolbar-group">
                <button
                  @click="insertTable"
                  class="toolbar-btn"
                  type="button"
                  title="Insérer tableau"
                >
                  ⊞
                </button>
                <button
                  v-if="editor.isActive('table')"
                  @click="editor.chain().focus().addColumnAfter().run()"
                  class="toolbar-btn"
                  type="button"
                  title="Ajouter colonne"
                >
                  |+
                </button>
                <button
                  v-if="editor.isActive('table')"
                  @click="editor.chain().focus().addRowAfter().run()"
                  class="toolbar-btn"
                  type="button"
                  title="Ajouter ligne"
                >
                  —+
                </button>
                <button
                  v-if="editor.isActive('table')"
                  @click="editor.chain().focus().deleteTable().run()"
                  class="toolbar-btn"
                  type="button"
                  title="Supprimer tableau"
                >
                  ⊠
                </button>
              </div>

              <div class="toolbar-divider"></div>

              <!-- Blocks -->
              <div class="toolbar-group">
                <button
                  @click="editor.chain().focus().toggleBlockquote().run()"
                  :class="{ 'is-active': editor.isActive('blockquote') }"
                  class="toolbar-btn"
                  type="button"
                  title="Citation"
                >
                  "
                </button>
                <button
                  @click="editor.chain().focus().toggleCodeBlock().run()"
                  :class="{ 'is-active': editor.isActive('codeBlock') }"
                  class="toolbar-btn"
                  type="button"
                  title="Bloc de code"
                >
                  { }
                </button>
                <button
                  @click="editor.chain().focus().setHorizontalRule().run()"
                  class="toolbar-btn"
                  type="button"
                  title="Ligne horizontale"
                >
                  —
                </button>
              </div>

              <div class="toolbar-divider"></div>

              <!-- Media -->
              <div class="toolbar-group">
                <button
                  @click="addLink"
                  :class="{ 'is-active': editor.isActive('link') }"
                  class="toolbar-btn"
                  type="button"
                  title="Insérer lien"
                >
                  🔗
                </button>
                <button
                  @click="addImage"
                  class="toolbar-btn"
                  type="button"
                  title="Insérer image"
                >
                  🖼️
                </button>
                <button
                  @click="addYoutubeVideo"
                  class="toolbar-btn"
                  type="button"
                  title="Insérer vidéo YouTube"
                >
                  fa-play
                </button>
              </div>

              <div class="toolbar-divider"></div>

              <!-- Actions -->
              <div class="toolbar-group">
                <button
                  @click="editor.chain().focus().undo().run()"
                  :disabled="!editor.can().undo()"
                  class="toolbar-btn"
                  type="button"
                  title="Annuler (Ctrl+Z)"
                >
                  ↶
                </button>
                <button
                  @click="editor.chain().focus().redo().run()"
                  :disabled="!editor.can().redo()"
                  class="toolbar-btn"
                  type="button"
                  title="Rétablir (Ctrl+Y)"
                >
                  ↷
                </button>
              </div>
            </div>

            <!-- Modal Content -->
            <div class="modal-content-wrapper">
              <editor-content :editor="editor" class="modal-editor-content" />
            </div>

            <!-- Modal Footer -->
            <div class="modal-footer">
              <div class="footer-left">
                <span class="word-count">{{ wordCount }} mots</span>
                <span class="char-count">{{ characterCount }} caractères</span>
              </div>
              <div class="footer-right">
                <span class="fullscreen-hint">Appuyez sur <kbd>Échap</kbd> pour fermer</span>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </teleport>
  </div>
</template>

<script setup>
import { useEditor, EditorContent } from '@tiptap/vue-3'
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
import { watch, computed, ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Rédigez votre contenu ici... (Markdown supporté)'
  }
})

const emit = defineEmits(['update:modelValue'])

const isFullscreen = ref(false)

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3]
      },
      // Note: StarterKit v3 might include some extensions by default
      // If duplicates occur, disable them here
    }),
    Placeholder.configure({
      placeholder: props.placeholder
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'editor-link'
      }
    }),
    Underline,
    TextAlign.configure({
      types: ['heading', 'paragraph']
    }),
    TextStyle,
    Color,
    Highlight.configure({
      multicolor: true
    }),
    FontFamily,
    Table.configure({
      resizable: true
    }),
    TableRow,
    TableCell,
    TableHeader,
    TaskList,
    TaskItem.configure({
      nested: true
    }),
    Youtube.configure({
      width: 640,
      height: 480
    }),
    Image.configure({
      inline: true,
      allowBase64: true
    })
  ],
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

// Insert table
const insertTable = () => {
  editor.value.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
}

// Add link
const addLink = () => {
  const url = window.prompt('URL du lien:')
  if (url) {
    editor.value.chain().focus().setLink({ href: url }).run()
  }
}

// Add image
const addImage = () => {
  const url = window.prompt('URL de l\'image:')
  if (url) {
    editor.value.chain().focus().setImage({ src: url }).run()
  }
}

// Add YouTube video
const addYoutubeVideo = () => {
  const url = window.prompt('URL de la vidéo YouTube:')
  if (url) {
    editor.value.chain().focus().setYoutubeVideo({ src: url }).run()
  }
}

// Word count
const wordCount = computed(() => {
  if (!editor.value) return 0
  const text = editor.value.getText()
  return text.trim().split(/\s+/).filter(word => word.length > 0).length
})

// Character count
const characterCount = computed(() => {
  if (!editor.value) return 0
  return editor.value.getText().length
})
</script>

<style scoped>
/* ===========================
   EDITOR NORMAL (Mode non-fullscreen)
   =========================== */
.tiptap-editor-wrapper {
  width: 100%;
}

.editor-normal {
  border: none;
  border-radius: 8px;
  overflow: hidden;
  background: var(--card-bg);
  display: flex;
  flex-direction: column;
}

.editor-normal:focus-within {
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
}

/* ===========================
   TOOLBAR (Mode normal)
   =========================== */
.editor-toolbar-modern {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 12px 16px;
  background: var(--bg-secondary);
  border-bottom: 2px solid var(--border-color);
  overflow-x: auto;
  overflow-y: hidden;
}

.toolbar-group {
  display: flex;
  gap: 4px;
  align-items: center;
}

.toolbar-divider {
  width: 2px;
  background: var(--border-color);
  margin: 0 8px;
  align-self: stretch;
}

.toolbar-btn {
  padding: 8px 12px;
  font-size: 0.9rem;
  font-weight: 600;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
}

.toolbar-btn:hover:not(:disabled) {
  background: var(--hover-bg);
  border-color: var(--border-color);
  transform: translateY(-1px);
}

.toolbar-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.toolbar-btn.is-active {
  background: var(--color-primary, #10b981);
  color: white;
  border-color: var(--color-primary, #10b981);
}

.toolbar-btn-fullscreen {
  gap: 6px;
  padding: 8px 14px;
}

.btn-label {
  font-size: 0.85rem;
}

/* Select dropdown */
.toolbar-select {
  padding: 6px 10px;
  font-size: 0.875rem;
  border: 2px solid var(--border-color);
  border-radius: 6px;
  background: var(--card-bg);
  color: var(--text-primary);
  cursor: pointer;
  max-width: 160px;
  transition: all 0.2s ease;
}

.toolbar-select:hover {
  border-color: var(--color-primary, #10b981);
}

.toolbar-select:focus {
  outline: none;
  border-color: var(--color-primary, #10b981);
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
}

/* Color picker */
.color-picker {
  width: 36px;
  height: 36px;
  border: 2px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  padding: 2px;
  transition: all 0.2s ease;
}

.color-picker:hover {
  border-color: var(--color-primary, #10b981);
  transform: scale(1.05);
}

/* ===========================
   EDITOR CONTENT (Mode normal)
   =========================== */
.editor-content-wrapper {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 300px;
  max-height: 500px;
}

.editor-content-modern {
  height: 100%;
}

.editor-content-modern :deep(.ProseMirror) {
  padding: 1px;
  min-height: 300px;
  background-color: rgba(0, 0, 0, 0.02);
  color: var(--text-primary);
  outline: none;
  font-size: 1rem;
  line-height: 1.7;
}

[data-theme="dark"] .editor-content-modern :deep(.ProseMirror) {
  background-color: rgba(255, 255, 255, 0.03);
}

@media (prefers-color-scheme: dark) {
  .editor-content-modern :deep(.ProseMirror) {
    background-color: rgba(255, 255, 255, 0.03);
  }
}

/* ===========================
   FOOTER (Mode normal)
   =========================== */
.editor-footer-modern {
  padding: 12px 20px;
  background: var(--bg-secondary);
  border-top: 2px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.footer-left {
  display: flex;
  gap: 20px;
}

.word-count,
.char-count {
  color: var(--text-secondary);
  font-weight: 500;
}

/* ===========================
   MODAL OVERLAY (90%)
   =========================== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.8);
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  backdrop-filter: blur(4px);
}

/* ===========================
   MODAL CONTAINER (La carte popup)
   =========================== */
.modal-container {
  width: 90vw;
  height: 90vh;
  max-width: 1600px;
  background: var(--card-bg);
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* ===========================
   MODAL HEADER
   =========================== */
.modal-header {
  background: var(--bg-secondary);
  border-bottom: 2px solid var(--border-color);
  padding: 20px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.btn-close-modal {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: var(--color-primary, #10b981);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-close-modal:hover {
  background: #059669;
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(16, 185, 129, 0.3);
}

.close-icon {
  font-size: 1.25rem;
  font-weight: bold;
}

/* ===========================
   MODAL TOOLBAR
   =========================== */
.modal-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 16px 30px;
  background: var(--bg-secondary);
  border-bottom: 2px solid var(--border-color);
  overflow-x: auto;
  overflow-y: hidden;
  flex-shrink: 0;
}

/* ===========================
   MODAL CONTENT
   =========================== */
.modal-content-wrapper {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  background: var(--bg-primary);
}

.modal-editor-content {
  height: 100%;
}

.modal-editor-content :deep(.ProseMirror) {
  padding: 40px 60px;
  min-height: 100%;
  max-width: 1200px;
  margin: 0 auto;
  background-color: var(--card-bg);
  color: var(--text-primary);
  outline: none;
  font-size: 1.05rem;
  line-height: 1.75;
}

/* ===========================
   MODAL FOOTER
   =========================== */
.modal-footer {
  padding: 16px 30px;
  background: var(--bg-secondary);
  border-top: 2px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.footer-right {
  display: flex;
  align-items: center;
}

.fullscreen-hint {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.fullscreen-hint kbd {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 3px 8px;
  font-family: monospace;
  font-size: 0.85rem;
  margin: 0 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* ===========================
   ANIMATIONS
   =========================== */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* ===========================
   TYPOGRAPHY (Partagé)
   =========================== */
:deep(.ProseMirror h1) {
  font-size: 2.25rem;
  font-weight: 700;
  margin-top: 2rem;
  margin-bottom: 1rem;
  color: var(--text-primary);
  line-height: 1.2;
}

:deep(.ProseMirror h2) {
  font-size: 1.75rem;
  font-weight: 600;
  margin-top: 1.75rem;
  margin-bottom: 0.875rem;
  color: var(--text-primary);
  line-height: 1.3;
}

:deep(.ProseMirror h3) {
  font-size: 1.375rem;
  font-weight: 600;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  color: var(--text-primary);
  line-height: 1.4;
}

:deep(.ProseMirror p) {
  margin-top: 0.75rem;
  margin-bottom: 0.75rem;
}

/* Lists */
:deep(.ProseMirror ul),
:deep(.ProseMirror ol) {
  padding-left: 2rem;
  margin-top: 0.75rem;
  margin-bottom: 0.75rem;
}

:deep(.ProseMirror li) {
  margin-top: 0.375rem;
  margin-bottom: 0.375rem;
}

/* Task list */
:deep(.ProseMirror ul[data-type="taskList"]) {
  list-style: none;
  padding-left: 0;
}

:deep(.ProseMirror ul[data-type="taskList"] li) {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

:deep(.ProseMirror ul[data-type="taskList"] li input[type="checkbox"]) {
  margin-top: 0.5rem;
  cursor: pointer;
  width: 18px;
  height: 18px;
}

/* Code */
:deep(.ProseMirror code) {
  background: rgba(0, 0, 0, 0.1);
  padding: 0.25em 0.5em;
  border-radius: 4px;
  font-size: 0.9em;
  font-family: 'Courier New', monospace;
  color: var(--text-primary);
}

[data-theme="dark"] :deep(.ProseMirror code) {
  background: rgba(255, 255, 255, 0.1);
}

@media (prefers-color-scheme: dark) {
  :deep(.ProseMirror code) {
    background: rgba(255, 255, 255, 0.1);
  }
}

:deep(.ProseMirror pre) {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  padding: 1.25rem;
  margin: 1.25rem 0;
  overflow-x: auto;
  border: 2px solid var(--border-color);
}

[data-theme="dark"] :deep(.ProseMirror pre) {
  background: rgba(255, 255, 255, 0.05);
}

@media (prefers-color-scheme: dark) {
  :deep(.ProseMirror pre) {
    background: rgba(255, 255, 255, 0.05);
  }
}

:deep(.ProseMirror pre code) {
  background: none;
  padding: 0;
  font-size: 0.9rem;
}

/* Blockquote */
:deep(.ProseMirror blockquote) {
  border-left: 5px solid var(--color-primary, #10b981);
  padding-left: 1.5rem;
  margin: 1.25rem 0;
  color: var(--text-secondary);
  font-style: italic;
  background: rgba(16, 185, 129, 0.05);
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  border-radius: 0 8px 8px 0;
}

/* Horizontal Rule */
:deep(.ProseMirror hr) {
  border: none;
  border-top: 3px solid var(--border-color);
  margin: 2rem 0;
}

/* Links */
:deep(.ProseMirror a) {
  color: var(--color-primary, #10b981);
  text-decoration: underline;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

:deep(.ProseMirror a:hover) {
  opacity: 0.7;
}

/* Images */
:deep(.ProseMirror img) {
  max-width: 100%;
  height: auto;
  border-radius: 10px;
  margin: 1.5rem 0;
  display: block;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* YouTube video */
:deep(.ProseMirror iframe) {
  max-width: 100%;
  border-radius: 10px;
  margin: 1.5rem 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Tables */
:deep(.ProseMirror table) {
  border-collapse: collapse;
  margin: 1.5rem 0;
  width: 100%;
  overflow: hidden;
  border: 2px solid var(--border-color);
  border-radius: 10px;
}

:deep(.ProseMirror table td),
:deep(.ProseMirror table th) {
  border: 1px solid var(--border-color);
  padding: 12px 16px;
  vertical-align: top;
  position: relative;
}

:deep(.ProseMirror table th) {
  background: var(--bg-secondary);
  font-weight: 600;
  text-align: left;
}

:deep(.ProseMirror table .selectedCell) {
  background: rgba(16, 185, 129, 0.15);
}

/* Placeholder */
:deep(.ProseMirror p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: left;
  color: var(--text-muted, #9ca3af);
  pointer-events: none;
  height: 0;
  font-style: italic;
}

/* Text alignment */
:deep(.ProseMirror [style*="text-align: left"]) {
  text-align: left;
}

:deep(.ProseMirror [style*="text-align: center"]) {
  text-align: center;
}

:deep(.ProseMirror [style*="text-align: right"]) {
  text-align: right;
}

:deep(.ProseMirror [style*="text-align: justify"]) {
  text-align: justify;
}

/* Scrollbar */
.editor-content-wrapper::-webkit-scrollbar,
.modal-content-wrapper::-webkit-scrollbar {
  width: 12px;
}

.editor-content-wrapper::-webkit-scrollbar-track,
.modal-content-wrapper::-webkit-scrollbar-track {
  background: var(--bg-secondary);
}

.editor-content-wrapper::-webkit-scrollbar-thumb,
.modal-content-wrapper::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 6px;
  border: 2px solid var(--bg-secondary);
}

.editor-content-wrapper::-webkit-scrollbar-thumb:hover,
.modal-content-wrapper::-webkit-scrollbar-thumb:hover {
  background: var(--text-muted);
}

/* ===========================
   RESPONSIVE
   =========================== */
@media (max-width: 1024px) {
  .modal-container {
    width: 95vw;
    height: 95vh;
  }

  .modal-editor-content :deep(.ProseMirror) {
    padding: 30px 40px;
  }
}

@media (max-width: 768px) {
  .modal-header {
    padding: 16px 20px;
  }

  .modal-title {
    font-size: 1.25rem;
  }

  .btn-close-modal .close-text {
    display: none;
  }

  .modal-toolbar {
    padding: 12px 20px;
  }

  .modal-editor-content :deep(.ProseMirror) {
    padding: 20px 24px;
  }

  .modal-footer {
    padding: 12px 20px;
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .toolbar-btn-fullscreen .btn-label {
    display: none;
  }
}

/* ===========================
   BUBBLE MENU (Toolbar Flottante)
   =========================== */
.bubble-menu-custom {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: var(--card-bg);
  border: 2px solid var(--color-primary, #10b981);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(16, 185, 129, 0.3);
  z-index: 9999;
  backdrop-filter: blur(8px);
  animation: bubbleFadeIn 0.2s ease-out;
}

@keyframes bubbleFadeIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.bubble-btn {
  padding: 6px 10px;
  font-size: 0.9rem;
  font-weight: 600;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bubble-btn:hover {
  background: var(--hover-bg);
  border-color: var(--border-color);
  transform: scale(1.05);
}

.bubble-btn.is-active {
  background: var(--color-primary, #10b981);
  color: white;
  border-color: var(--color-primary, #10b981);
}

.bubble-divider {
  width: 1px;
  height: 20px;
  background: var(--border-color);
  margin: 0 4px;
}

.bubble-color-picker {
  width: 28px;
  height: 28px;
  border: 2px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  padding: 2px;
  transition: all 0.2s ease;
}

.bubble-color-picker:hover {
  border-color: var(--color-primary, #10b981);
  transform: scale(1.1);
}
</style>
