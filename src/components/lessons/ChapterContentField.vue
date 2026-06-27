<template>
  <div>
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
  </div>
</template>

<script setup>
/**
 * Éditeur de contenu d'un chapitre selon son type (#28, H5).
 * Sous-composant présentationnel extrait de ChapterEditForm.vue : rend le bloc de
 * saisie adapté au `content_type` (texte/markdown, vidéo, lien externe, upload).
 *
 * Le `chapter` est lié en two-way par référence (édition d'item de liste en
 * place) ; la sélection de fichier valide la taille puis stocke le File sur
 * `chapter.selectedFile` (l'upload réel reste au parent ChapterManager).
 */
import { computed } from 'vue'
import TipTapEditor from '@/components/common/TipTapEditor.vue'
import { UPLOAD_CONFIG, ACCEPTED_FILE_TYPES } from '@/constants/upload'

const props = defineProps({
  chapter: { type: Object, required: true }
})

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
  background: var(--blue-500);
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
</style>
