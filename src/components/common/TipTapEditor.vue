<template>
  <div class="tiptap-editor-wrapper">
    <!-- Editor normal (mode non-fullscreen) -->
    <div v-if="!isFullscreen" class="editor-normal">
      <!-- Toolbar (#28 : extraite en sous-composant partagé) -->
      <div v-if="editor" class="editor-toolbar-modern">
        <EditorToolbar :editor="editor" show-fullscreen-toggle @toggle-fullscreen="toggleFullscreen" />
      </div>

      <!-- Editor Content -->
      <div class="editor-content-wrapper">
        <editor-content :editor="editor" class="editor-content-modern" />

        <!-- Bubble Menu (Toolbar Flottante) -->
        <EditorBubbleMenu :editor="editor" @add-link="addLink" />
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
    <TipTapFullscreenModal
      :show="isFullscreen"
      :editor="editor"
      :word-count="wordCount"
      :character-count="characterCount"
      @close="closeFullscreen"
    />
  </div>
</template>

<script setup>
import { EditorContent } from '@tiptap/vue-3'
// #G1 (≤300) : logique extraite dans le composable ; markup éclaté en sous-composants.
import { useTipTapEditor } from '@/composables/useTipTapEditor'
import EditorToolbar from '@/components/common/EditorToolbar.vue'
import EditorBubbleMenu from '@/components/common/EditorBubbleMenu.vue'
import TipTapFullscreenModal from '@/components/common/TipTapFullscreenModal.vue'

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

const {
  editor,
  isFullscreen,
  toggleFullscreen,
  closeFullscreen,
  addLink,
  wordCount,
  characterCount,
} = useTipTapEditor(props, emit)
</script>

<style scoped lang="scss">
/* Typographie ProseMirror partagée (mode normal ET modale) : @use VERBATIM. */
@use '../../assets/styles/tiptap-content';

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

/* Scrollbar (part editor du sélecteur combiné d'origine, dédoublée verbatim) */
.editor-content-wrapper::-webkit-scrollbar {
  width: 12px;
}

.editor-content-wrapper::-webkit-scrollbar-track {
  background: var(--bg-secondary);
}

.editor-content-wrapper::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 6px;
  border: 2px solid var(--bg-secondary);
}

.editor-content-wrapper::-webkit-scrollbar-thumb:hover {
  background: var(--text-muted);
}
</style>
