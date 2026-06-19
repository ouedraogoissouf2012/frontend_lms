<template>
  <!-- Barre d'outils partagée de l'éditeur riche (#28). Rendue SANS conteneur
       (fragment) : les groupes deviennent enfants flex du conteneur fourni par
       le parent (.editor-toolbar-modern en normal, .modal-toolbar en plein écran).
       Le bouton « mode étendu » n'apparaît qu'en mode normal. -->

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
    <button @click="insertTable" class="toolbar-btn" type="button" title="Insérer tableau">⊞</button>
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
    <button @click="addImage" class="toolbar-btn" type="button" title="Insérer image">🖼️</button>
    <button @click="addYoutubeVideo" class="toolbar-btn" type="button" title="Insérer vidéo YouTube">fa-play</button>
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
 * Barre d'outils de l'éditeur riche (#28, tranche 2).
 * Extraite de TipTapEditor.vue : mutualise la toolbar identique des modes
 * normal et plein écran. Handlers à prompt (table/lien/image/vidéo) locaux ;
 * le passage en plein écran est émis vers le parent (état isFullscreen côté parent).
 */
const props = defineProps({
  editor: { type: Object, required: true },
  showFullscreenToggle: { type: Boolean, default: false }
})

defineEmits(['toggle-fullscreen'])

function insertTable() {
  props.editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
}

function addLink() {
  const url = window.prompt('URL du lien:')
  if (url) {
    props.editor.chain().focus().setLink({ href: url }).run()
  }
}

function addImage() {
  const url = window.prompt('URL de l\'image:')
  if (url) {
    props.editor.chain().focus().setImage({ src: url }).run()
  }
}

function addYoutubeVideo() {
  const url = window.prompt('URL de la vidéo YouTube:')
  if (url) {
    props.editor.chain().focus().setYoutubeVideo({ src: url }).run()
  }
}
</script>

<style scoped>
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
</style>
