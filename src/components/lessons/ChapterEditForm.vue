<template>
  <div class="chapter-form-professional">
    <!-- Title Input -->
    <div class="form-field">
      <input
        v-model="chapter.title"
        type="text"
        class="title-input"
        placeholder="saisissez le titre"
      />
    </div>

    <!-- Content Type Selector -->
    <div class="form-field">
      <label class="field-label">Type de contenu</label>
      <select v-model="chapter.content_type" class="content-type-select">
        <option value="text">Texte / Markdown</option>
        <option value="video">Vidéo (YouTube, Vimeo)</option>
        <option value="powerpoint">PowerPoint (upload .pptx)</option>
        <option value="word">Document Word (upload .docx)</option>
        <option value="pdf">PDF (upload .pdf)</option>
        <option value="link">Lien externe</option>
        <option value="quiz">Quiz / Testez vos connaissances</option>
      </select>
    </div>

    <!-- Content Editor based on type -->
    <div class="form-field">
      <ChapterContentField :chapter="chapter" />

      <!-- Quiz Editor Inline -->
      <ChapterQuizField
        v-if="chapter.content_type === 'quiz'"
        :chapter="chapter"
        :quiz="quiz"
        @open-quiz-editor="(...args) => $emit('open-quiz-editor', ...args)"
      />
    </div>

    <!-- Form Actions -->
    <div class="form-actions">
      <button @click="$emit('cancel', chapter)" class="btn-cancel">
        Annuler
      </button>
      <button @click="$emit('save', chapter)" class="btn-save" :disabled="!chapter.title || saving">
        {{ saving ? 'Enregistrement...' : (chapter.id ? 'Enregistrer' : 'Créer') }}
      </button>
    </div>
  </div>
</template>

<script setup>
/**
 * Formulaire d'édition d'un chapitre (#28 ; éclaté sous 300 lignes en H5).
 * Orchestrateur : la saisie de contenu (texte/vidéo/lien/upload) est déléguée à
 * ChapterContentField et le bloc quiz à ChapterQuizField — deux sous-composants
 * présentationnels. Ce composant ne garde que titre + type + actions.
 *
 * Les champs sont liés en two-way au chapitre fourni en prop : `chapter` est un
 * objet partagé par référence (élément de la liste éditée en place) — pattern
 * idiomatique Vue pour l'édition d'item de liste (aucune réassignation de prop).
 * Les actions (sauvegarde, annulation, ouverture éditeur quiz) sont émises ; la
 * logique (API, upload, modale quiz) reste au parent.
 */
import ChapterContentField from '@/components/lessons/ChapterContentField.vue'
import ChapterQuizField from '@/components/lessons/ChapterQuizField.vue'

defineProps({
  chapter: { type: Object, required: true },
  // Quiz du chapitre (résolu par le parent depuis knowledgeChecks), ou null.
  quiz: { type: Object, default: null },
  saving: { type: Boolean, default: false }
})

defineEmits(['save', 'cancel', 'open-quiz-editor'])
</script>

<style scoped>
.chapter-form-professional {
  padding: 2px;
}

.form-field {
  margin-bottom: 20px;
}

.field-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.title-input {
  width: 100%;
  padding: 12px 16px;
  font-size: 1rem;
  border: 3px solid var(--border-color);
  border-radius: 8px;
  transition: all 0.3s ease;
  background-color: rgba(0, 0, 0, 0.03);
  color: var(--text-primary);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06), 0 2px 6px rgba(0, 0, 0, 0.05);
}

/* Mode sombre: fond plus clair que la carte */
@media (prefers-color-scheme: dark) {
  .title-input {
    background-color: rgba(255, 255, 255, 0.05);
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2), 0 2px 6px rgba(0, 0, 0, 0.1);
  }
}

.title-input:focus {
  outline: none;
  border-color: var(--color-primary, #10b981);
  background-color: rgba(16, 185, 129, 0.05);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 0 0 5px rgba(16, 185, 129, 0.2), 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.title-input::placeholder {
  color: var(--text-muted, #9ca3af);
  opacity: 1;
}

.content-type-select {
  width: 100%;
  padding: 10px 12px;
  font-size: 0.875rem;
  border: 3px solid var(--border-color);
  border-radius: 8px;
  background-color: rgba(0, 0, 0, 0.03);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06), 0 2px 6px rgba(0, 0, 0, 0.05);
}

/* Options styling - Mode clair par défaut */
.content-type-select option {
  background-color: #ffffff;
  color: #111827;
  padding: 10px;
}

/* Mode sombre avec data-theme */
[data-theme="dark"] .content-type-select {
  background-color: rgba(255, 255, 255, 0.05);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2), 0 2px 6px rgba(0, 0, 0, 0.1);
}

[data-theme="dark"] .content-type-select option {
  background-color: #1f2937;
  color: #f9fafb;
}

/* Mode sombre avec prefers-color-scheme (fallback) */
@media (prefers-color-scheme: dark) {
  .content-type-select {
    background-color: rgba(255, 255, 255, 0.05);
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2), 0 2px 6px rgba(0, 0, 0, 0.1);
  }

  .content-type-select option {
    background-color: #1f2937;
    color: #f9fafb;
  }
}

.content-type-select:focus {
  outline: none;
  border-color: var(--color-primary, #10b981);
  background-color: rgba(16, 185, 129, 0.05);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 0 0 5px rgba(16, 185, 129, 0.2), 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Form Actions */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--border-color);
}

.btn-cancel {
  padding: 10px 24px;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: var(--hover-bg);
}

.btn-save {
  padding: 10px 24px;
  font-size: 0.875rem;
  font-weight: 500;
  color: white;
  background: var(--color-primary, #10b981);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-save:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
