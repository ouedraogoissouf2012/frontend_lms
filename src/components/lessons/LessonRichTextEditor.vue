<template>
  <div class="content-fields">
    <div class="editor-tabs">
      <button
        type="button"
        @click="showPreview = false"
        :class="['tab-btn', { 'active': !showPreview }]"
      >
        Éditer
      </button>
      <button
        type="button"
        @click="showPreview = true"
        :class="['tab-btn', { 'active': showPreview }]"
      >
        Prévisualiser
      </button>
    </div>

    <div v-show="!showPreview" class="editor-panel">
      <textarea
        v-model="content"
        rows="20"
        class="form-textarea code-editor"
        placeholder="Contenu HTML de la leçon...

Exemples:
<h1>Titre principal</h1>
<h2>Sous-titre</h2>
<p>Paragraphe de texte...</p>
<ul>
  <li>Élément de liste</li>
</ul>"
      ></textarea>
      <p class="form-hint">Vous pouvez utiliser du HTML pour formater le contenu</p>
    </div>

    <div v-show="showPreview" class="preview-panel">
      <div v-if="content" v-html="content" class="preview-content"></div>
      <div v-else class="preview-empty">Aucun contenu à prévisualiser</div>
    </div>
  </div>
</template>

<script setup>
/**
 * Éditeur de contenu HTML (texte/mixte) de LessonEditor (#H4 ≤300) : onglets
 * Éditer/Prévisualiser, textarea code + rendu v-html. Contenu en v-model (defineModel) ;
 * l'état d'onglet (showPreview) est local. Chrome textarea dupliqué VERBATIM.
 */
import { ref } from 'vue'

const content = defineModel({ type: String, default: '' })
const showPreview = ref(false)
</script>

<style scoped>
.form-textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: 0.5rem;
  color: var(--text-primary);
  font-size: 0.875rem;
  transition: all 0.2s;
  resize: vertical;
  font-family: inherit;
}

.form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-textarea::placeholder {
  color: var(--text-tertiary);
}

.form-textarea.code-editor {
  font-family: 'Courier New', monospace;
  font-size: 0.813rem;
}

.form-hint {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
}

/* Editor Tabs */
.editor-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid var(--border-primary);
}

.tab-btn {
  padding: 0.75rem 1.5rem;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-secondary);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: var(--text-primary);
  background: var(--bg-secondary);
}

.tab-btn.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

/* Preview Panel */
.preview-panel {
  min-height: 300px;
  padding: 1.5rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 0.5rem;
}

.preview-content {
  color: var(--text-primary);
  line-height: 1.75;
}

.preview-empty {
  text-align: center;
  padding: 4rem;
  color: var(--text-tertiary);
  font-style: italic;
}
</style>
