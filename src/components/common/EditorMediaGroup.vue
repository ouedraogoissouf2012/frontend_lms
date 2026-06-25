<template>
  <!-- Media -->
  <div class="toolbar-group">
    <button
      @click="$emit('add-link')"
      :class="{ 'is-active': editor.isActive('link') }"
      class="toolbar-btn"
      type="button"
      title="Insérer lien"
    >
      🔗
    </button>
    <button @click="$emit('add-image')" class="toolbar-btn" type="button" title="Insérer image">🖼️</button>
    <button @click="$emit('add-youtube')" class="toolbar-btn" type="button" title="Insérer vidéo YouTube">fa-play</button>
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
</template>

<script setup>
/**
 * Groupe « média + actions » de la barre d'outils (#28, décompo ≤300) :
 * lien/image/vidéo (prompts côté composable parent, émis via `add-link`,
 * `add-image`, `add-youtube`) et annuler/rétablir. `editor` en prop.
 */
defineProps({
  editor: { type: Object, required: true }
})

defineEmits(['add-link', 'add-image', 'add-youtube'])
</script>

<style scoped lang="scss">
@use '../../assets/styles/editor-toolbar';
</style>
