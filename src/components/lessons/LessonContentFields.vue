<template>
  <div class="form-section">
    <h2 class="section-title"><i class="fa fa-file-text"></i> Contenu principal</h2>

    <!-- Contenu VIDÉO -->
    <div v-if="contentType === 'video'" class="content-fields">
      <div class="form-row">
        <div class="form-group full-width">
          <label class="form-label required">URL de la vidéo</label>
          <input
            v-model="videoUrl"
            type="url"
            class="form-input"
            placeholder="https://www.youtube.com/watch?v=..."
          />
          <p class="form-hint">URL complète de la vidéo (YouTube, Vimeo, etc.)</p>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group full-width">
          <label class="form-label">Plateforme vidéo</label>
          <div class="radio-group">
            <label
              v-for="provider in videoProviders"
              :key="provider.value"
              :class="['radio-card', { 'active': videoProvider === provider.value }]"
            >
              <input
                v-model="videoProvider"
                type="radio"
                :value="provider.value"
              />
              <span>{{ provider.icon }} {{ provider.label }}</span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- Contenu PDF -->
    <div v-else-if="contentType === 'pdf'" class="content-fields">
      <div class="form-row">
        <div class="form-group full-width">
          <label class="form-label required">URL du fichier PDF</label>
          <input
            v-model="pdfUrl"
            type="url"
            class="form-input"
            placeholder="https://exemple.com/document.pdf"
          />
          <p class="form-hint">URL publique du document PDF à afficher</p>
        </div>
      </div>
    </div>

    <!-- Contenu AUDIO -->
    <div v-else-if="contentType === 'audio'" class="content-fields">
      <div class="form-row">
        <div class="form-group full-width">
          <label class="form-label required">URL du fichier audio</label>
          <input
            v-model="audioUrl"
            type="url"
            class="form-input"
            placeholder="https://exemple.com/audio.mp3"
          />
          <p class="form-hint">URL du fichier audio (MP3, WAV, OGG, etc.)</p>
        </div>
      </div>
    </div>

    <!-- Contenu PRÉSENTATION -->
    <div v-else-if="contentType === 'presentation'" class="content-fields">
      <div class="form-row">
        <div class="form-group full-width">
          <label class="form-label required">URL de la présentation</label>
          <input
            v-model="presentationUrl"
            type="url"
            class="form-input"
            placeholder="https://docs.google.com/presentation/d/..."
          />
          <p class="form-hint">URL de Google Slides, PowerPoint Online, ou autre plateforme</p>
        </div>
      </div>
    </div>

    <!-- Contenu LIEN EXTERNE -->
    <div v-else-if="contentType === 'link'" class="content-fields">
      <div class="form-row">
        <div class="form-group full-width">
          <label class="form-label required">Lien externe</label>
          <input
            v-model="externalLink"
            type="url"
            class="form-input"
            placeholder="https://exemple.com/ressource-externe"
          />
          <p class="form-hint">Lien vers une page web, un article, ou une ressource externe</p>
        </div>
      </div>
    </div>

    <!-- Contenu TEXTE ou MIXTE -->
    <LessonRichTextEditor
      v-else-if="contentType === 'text' || contentType === 'mixed'"
      v-model="content"
    />
  </div>
</template>

<script setup>
/**
 * Section « Contenu principal » de LessonEditor (#H4 ≤300) : affiche les champs selon
 * le type (vidéo+plateforme, PDF, audio, présentation, lien) et délègue texte/mixte à
 * LessonRichTextEditor. Champs en v-model (defineModel). Chrome dupliqué VERBATIM.
 */
import LessonRichTextEditor from '@/components/lessons/LessonRichTextEditor.vue'

const videoUrl = defineModel('videoUrl', { type: String, default: '' })
const videoProvider = defineModel('videoProvider', { type: String, default: 'youtube' })
const pdfUrl = defineModel('pdfUrl', { type: String, default: '' })
const audioUrl = defineModel('audioUrl', { type: String, default: '' })
const presentationUrl = defineModel('presentationUrl', { type: String, default: '' })
const externalLink = defineModel('externalLink', { type: String, default: '' })
const content = defineModel('content', { type: String, default: '' })

defineProps({
  contentType: { type: String, default: 'text' },
  videoProviders: { type: Array, default: () => [] }
})
</script>

<style scoped>
.form-section {
  background: var(--card-bg);
  border-radius: 0.75rem;
  padding: 2rem;
  box-shadow: var(--card-shadow);
}

.section-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 1.5rem 0;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-row:last-child {
  margin-bottom: 0;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.form-label.required::after {
  content: ' *';
  color: #ef4444;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: 0.5rem;
  color: var(--text-primary);
  font-size: 0.875rem;
  transition: all 0.2s;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--blue-500);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: var(--text-tertiary);
}

.form-hint {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
}

/* Radio Group */
.radio-group {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.radio-card {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--bg-secondary);
  border: 2px solid var(--border-primary);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.radio-card:hover {
  background: var(--bg-tertiary);
}

.radio-card.active {
  background: rgba(59, 130, 246, 0.1);
  border-color: var(--blue-500);
}

.radio-card input[type="radio"] {
  margin: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .radio-group {
    flex-direction: column;
  }
}
</style>
