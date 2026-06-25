<template>
  <!-- Modale plein écran (90%) de l'éditeur riche (#G1 ≤300, décompo TipTapEditor).
       Extraite VERBATIM de TipTapEditor.vue : header + EditorToolbar partagée +
       contenu éditeur + footer (compteurs + indice Échap). Pilotée par v-model:show ;
       la fermeture (clic overlay / bouton / Échap parent) est émise via `close`.
       Markup, classes, textes et CSS conservés à l'identique pour parité stricte. -->
  <teleport to="body">
    <transition name="modal-fade">
      <div v-if="show" class="modal-overlay" @click="$emit('close')">
        <div class="modal-container" @click.stop>
          <!-- Modal Header -->
          <div class="modal-header">
            <h2 class="modal-title">Édition du contenu</h2>
            <button @click="$emit('close')" class="btn-close-modal" title="Fermer (Échap)">
              <span class="close-icon">✕</span>
              <span class="close-text">Fermer</span>
            </button>
          </div>

          <!-- Modal Toolbar (#28 : sous-composant partagé) -->
          <div v-if="editor" class="modal-toolbar">
            <EditorToolbar :editor="editor" />
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
</template>

<script setup>
/**
 * Modale plein écran de l'éditeur riche (#G1 ≤300).
 * Extraite de TipTapEditor.vue. Reçoit l'instance `editor` et les compteurs
 * (wordCount/characterCount) calculés par le composable parent, et son ouverture
 * via v-model:show. Émet `close` sur clic overlay / bouton de fermeture ; l'état
 * isFullscreen et le verrou du scroll body restent gérés côté parent (useTipTapEditor).
 */
import { EditorContent } from '@tiptap/vue-3'
import EditorToolbar from '@/components/common/EditorToolbar.vue'

defineProps({
  show: {
    type: Boolean,
    default: false
  },
  editor: {
    type: Object,
    default: null
  },
  wordCount: {
    type: Number,
    default: 0
  },
  characterCount: {
    type: Number,
    default: 0
  }
})

defineEmits(['update:show', 'close'])
</script>

<style scoped lang="scss">
/* Typographie ProseMirror partagée (mode normal ET modale) : @use VERBATIM. */
@use '../../assets/styles/tiptap-content';
/* Chrome de la modale (overlay/container/header/toolbar/content/footer/anim/responsive/scrollbar) : @use VERBATIM. */
@use '../../assets/styles/tiptap-fullscreen-modal';
</style>
