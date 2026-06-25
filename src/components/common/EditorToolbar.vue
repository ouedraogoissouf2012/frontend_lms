<template>
  <!-- Barre d'outils partagée de l'éditeur riche (#28). Rendue SANS conteneur
       (fragment) : les groupes deviennent enfants flex du conteneur fourni par
       le parent (.editor-toolbar-modern en normal, .modal-toolbar en plein écran).
       Le bouton « mode étendu » n'apparaît qu'en mode normal.
       Décomposée (#G1 ≤300) en groupes présentationnels + composable. -->

  <EditorTextGroup
    :editor="editor"
    :show-fullscreen-toggle="showFullscreenToggle"
    @toggle-fullscreen="$emit('toggle-fullscreen')"
  />

  <div class="toolbar-divider"></div>

  <EditorBlockGroup :editor="editor" @insert-table="insertTable" />

  <div class="toolbar-divider"></div>

  <EditorMediaGroup
    :editor="editor"
    @add-link="addLink"
    @add-image="addImage"
    @add-youtube="addYoutubeVideo"
  />
</template>

<script setup>
/**
 * Barre d'outils de l'éditeur riche (#28, tranche 2).
 * Extraite de TipTapEditor.vue : mutualise la toolbar identique des modes
 * normal et plein écran. Handlers à prompt (table/lien/image/vidéo) délégués au
 * composable useEditorToolbar ; le passage en plein écran est émis vers le
 * parent (état isFullscreen côté parent). API publique inchangée.
 */
import EditorTextGroup from '@/components/common/EditorTextGroup.vue'
import EditorBlockGroup from '@/components/common/EditorBlockGroup.vue'
import EditorMediaGroup from '@/components/common/EditorMediaGroup.vue'
import { useEditorToolbar } from '@/composables/useEditorToolbar'

const props = defineProps({
  editor: { type: Object, required: true },
  showFullscreenToggle: { type: Boolean, default: false }
})

defineEmits(['toggle-fullscreen'])

const { insertTable, addLink, addImage, addYoutubeVideo } = useEditorToolbar(() => props.editor)
</script>

<style scoped>
.toolbar-divider {
  width: 2px;
  background: var(--border-color);
  margin: 0 8px;
  align-self: stretch;
}
</style>
