<template>
  <!-- Fullscreen toggle (mode normal uniquement) -->
  <div v-if="showFullscreenToggle" class="toolbar-group">
    <button
      @click="$emit('toggle-fullscreen')"
      class="toolbar-btn toolbar-btn-fullscreen"
      type="button"
      title="Ouvrir en mode étendu"
    >
      <span class="icon-fullscreen">⛶</span>
      <span class="btn-label">Mode étendu</span>
    </button>
  </div>
  <div v-if="showFullscreenToggle" class="toolbar-divider"></div>

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
</template>

<script setup>
/**
 * Groupe « texte » de la barre d'outils (#28, décompo ≤300) : bascule plein
 * écran, police, gras/italique/souligné/barré, couleurs, alignement.
 * Purement présentationnel : `editor` en prop, `toggle-fullscreen` en emit.
 */
defineProps({
  editor: { type: Object, required: true },
  showFullscreenToggle: { type: Boolean, default: false }
})

defineEmits(['toggle-fullscreen'])
</script>

<style scoped lang="scss">
@use '../../assets/styles/editor-toolbar';
</style>
