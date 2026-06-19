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
      <!-- Text Editor -->
      <div v-if="chapter.content_type === 'text'">
        <TipTapEditor
          v-model="chapter.content"
          placeholder="Rédigez votre contenu ici... (Markdown supporté)"
        />
      </div>

      <!-- Video URL -->
      <div v-if="chapter.content_type === 'video'">
        <input
          v-model="chapter.video_url"
          type="url"
          class="url-input"
          placeholder="https://www.youtube.com/watch?v=..."
        />
        <label class="checkbox-label">
          <input v-model="chapter.autoplay_video" type="checkbox" />
          <span>Lecture automatique</span>
        </label>
      </div>

      <!-- External Link -->
      <div v-if="chapter.content_type === 'link'">
        <input
          v-model="chapter.external_link"
          type="url"
          class="url-input"
          placeholder="https://..."
        />
      </div>

      <!-- File Upload -->
      <div v-if="['powerpoint', 'word', 'pdf'].includes(chapter.content_type)" class="file-upload-container">
        <input
          type="file"
          :accept="getAcceptedFileTypes(chapter.content_type)"
          @change="handleFileSelect"
          class="file-input-hidden"
          :id="`file-${chapter.tempId || chapter.id}`"
        />
        <label :for="`file-${chapter.tempId || chapter.id}`" class="file-upload-label">
          <span v-if="!chapter.selectedFile"><i class="fa fa-cloud-upload"></i> Ajouter un media</span>
          <span v-else class="file-selected-name">{{ chapter.selectedFile.name }}</span>
        </label>
        <p class="file-help-text">Taille max: {{ maxFileSizeLabel }}</p>
      </div>

      <!-- Quiz Editor Inline -->
      <div v-if="chapter.content_type === 'quiz'" class="quiz-editor-inline">
        <div v-if="chapter.id" class="quiz-editor-wrapper">
          <!-- Quiz existant ou creation -->
          <div v-if="quiz" class="quiz-exists-info">
            <div class="quiz-summary">
              <i class="material-icons">quiz</i>
              <div class="quiz-summary-text">
                <span class="quiz-title">{{ quiz.title }}</span>
                <span class="quiz-meta">{{ quiz.questions?.length || 0 }} questions</span>
              </div>
            </div>
            <button @click="$emit('open-quiz-editor', chapter.id, quiz)" class="btn-edit-inline-quiz">
              <i class="material-icons">edit</i>
              Modifier le quiz
            </button>
          </div>
          <div v-else class="quiz-create-prompt">
            <p class="quiz-prompt-text">Aucun quiz cree pour ce chapitre.</p>
            <button @click="$emit('open-quiz-editor', chapter.id)" class="btn-create-quiz">
              <i class="material-icons">add</i>
              Creer un quiz
            </button>
          </div>
        </div>
        <div v-else class="quiz-save-first">
          <i class="material-icons">info</i>
          <span>Enregistrez d'abord le chapitre pour creer un quiz.</span>
        </div>
      </div>
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
 * Formulaire d'édition d'un chapitre (#28, tranche 2).
 * Sous-composant extrait de ChapterManager.vue (mode édition).
 *
 * Les champs sont liés en two-way au chapitre fourni en prop : `chapter` est un
 * objet partagé par référence (élément de la liste éditée en place) — pattern
 * idiomatique Vue pour l'édition d'item de liste (aucune réassignation de prop).
 * Les actions (sauvegarde, annulation, ouverture éditeur quiz) sont émises ; la
 * logique (API, upload, modale quiz) reste au parent.
 */
import { computed } from 'vue'
import TipTapEditor from '@/components/common/TipTapEditor.vue'
import { UPLOAD_CONFIG, ACCEPTED_FILE_TYPES } from '@/constants/upload'

const props = defineProps({
  chapter: { type: Object, required: true },
  // Quiz du chapitre (résolu par le parent depuis knowledgeChecks), ou null.
  quiz: { type: Object, default: null },
  saving: { type: Boolean, default: false }
})

defineEmits(['save', 'cancel', 'open-quiz-editor'])

// Libellé de taille max d'upload (source unique #24).
const maxFileSizeLabel = computed(() => UPLOAD_CONFIG.MAX_FILE_SIZE_LABEL)

function getAcceptedFileTypes(contentType) {
  return ACCEPTED_FILE_TYPES[contentType] || '*'
}

function handleFileSelect(event) {
  const file = event.target.files[0]
  if (file) {
    if (file.size > UPLOAD_CONFIG.MAX_FILE_SIZE_BYTES) {
      alert(`Fichier trop volumineux! Max: ${UPLOAD_CONFIG.MAX_FILE_SIZE_LABEL}`)
      event.target.value = ''
      return
    }
    props.chapter.selectedFile = file
  }
}
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


/* URL Input */
.url-input {
  width: 100%;
  padding: 10px 12px;
  font-size: 0.875rem;
  border: 3px solid var(--border-color);
  border-radius: 8px;
  margin-bottom: 12px;
  background-color: rgba(0, 0, 0, 0.03);
  color: var(--text-primary);
  transition: all 0.3s ease;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06), 0 2px 6px rgba(0, 0, 0, 0.05);
}

@media (prefers-color-scheme: dark) {
  .url-input {
    background-color: rgba(255, 255, 255, 0.05);
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2), 0 2px 6px rgba(0, 0, 0, 0.1);
  }
}

.url-input:focus {
  outline: none;
  border-color: var(--color-primary, #10b981);
  background-color: rgba(16, 185, 129, 0.05);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 0 0 5px rgba(16, 185, 129, 0.2), 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.url-input::placeholder {
  color: var(--text-muted, #9ca3af);
  opacity: 1;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  color: var(--text-primary);
  cursor: pointer;
}

/* File Upload */
.file-upload-container {
  text-align: left;
}

.file-input-hidden {
  display: none;
}

.file-upload-label {
  display: inline-block;
  padding: 10px 20px;
  background: #3b82f6;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.file-upload-label:hover {
  background: #2563eb;
}

.file-selected-name {
  color: white;
}

.file-help-text {
  margin-top: 8px;
  font-size: 0.75rem;
  color: #6b7280;
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

/* Quiz Editor Inline */
.quiz-editor-inline {
  margin-top: 16px;
}

.quiz-editor-wrapper {
  padding: 16px;
  background: rgba(99, 102, 241, 0.05);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 8px;
}

.quiz-exists-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.quiz-summary {
  display: flex;
  align-items: center;
  gap: 12px;
}

.quiz-summary i {
  font-size: 1.5rem;
  color: #6366f1;
}

.quiz-summary-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.quiz-summary .quiz-title {
  font-weight: 600;
  color: var(--text-primary);
}

.quiz-summary .quiz-meta {
  font-size: 0.8125rem;
  color: var(--text-secondary);
}

.btn-edit-inline-quiz {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-edit-inline-quiz:hover {
  background: #4f46e5;
}

.btn-edit-inline-quiz i {
  font-size: 1rem;
}

.quiz-create-prompt {
  text-align: center;
  padding: 16px;
}

.quiz-prompt-text {
  margin: 0 0 12px 0;
  color: var(--text-secondary);
}

.btn-create-quiz {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-create-quiz:hover {
  background: #4f46e5;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.btn-create-quiz i {
  font-size: 1.125rem;
}

.quiz-save-first {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 8px;
  color: #b45309;
}

.quiz-save-first i {
  font-size: 1.25rem;
}
</style>
