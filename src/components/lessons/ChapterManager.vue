<template>
  <div class="chapter-manager-professional">
    <!-- Header Section -->
    <div class="chapters-header">
      <h2 class="chapters-title">Chapitres de la leçon</h2>
      <p class="chapters-subtitle">Organisez votre leçon en chapitres. Chaque chapitre peut avoir un type de contenu différent.</p>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Chargement...</p>
    </div>

    <!-- Chapters List -->
    <div v-else class="chapters-container">
      <!-- Existing chapters -->
      <div
        v-for="(chapter, index) in chapters"
        :key="chapter.id || chapter.tempId"
        class="chapter-block"
      >
        <div class="chapter-header-bar">
          <div class="chapter-number-badge">Chapitre {{ index + 1 }}</div>
          <div v-if="!chapter.isEditing" class="chapter-actions-inline">
            <button @click="editChapter(chapter)" class="btn-edit" title="Modifier">
              Modifier
            </button>
            <button @click="deleteChapter(chapter)" class="btn-delete" title="Supprimer">
              Supprimer
            </button>
          </div>
        </div>

        <!-- Edit Mode -->
        <div v-if="chapter.isEditing" class="chapter-form-professional">
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
            </select>
          </div>

          <!-- Content Editor based on type -->
          <div class="form-field">
            <!-- Text Editor -->
            <div v-if="chapter.content_type === 'text'" class="editor-container">
              <div class="editor-toolbar">
                <button type="button" class="toolbar-btn" title="Gras">B</button>
                <button type="button" class="toolbar-btn" title="Italique">I</button>
                <button type="button" class="toolbar-btn" title="Liste">≡</button>
                <button type="button" class="toolbar-btn" title="Lien">🔗</button>
              </div>
              <textarea
                v-model="chapter.content"
                class="content-textarea"
                rows="10"
                placeholder="Rédigez votre contenu ici..."
              ></textarea>
              <div class="editor-footer">
                <span class="word-count">Nombre de mots : {{ getWordCount(chapter.content) }}</span>
              </div>
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
                @change="handleFileSelect($event, chapter)"
                class="file-input-hidden"
                :id="`file-${chapter.tempId || chapter.id}`"
              />
              <label :for="`file-${chapter.tempId || chapter.id}`" class="file-upload-label">
                <span v-if="!chapter.selectedFile">◈ Ajouter un média</span>
                <span v-else class="file-selected-name">{{ chapter.selectedFile.name }}</span>
              </label>
              <p class="file-help-text">Taille max: 30 MB</p>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="form-actions">
            <button @click="cancelEdit(chapter)" class="btn-cancel">
              Annuler
            </button>
            <button @click="saveChapter(chapter)" class="btn-save" :disabled="!chapter.title || saving">
              {{ saving ? 'Enregistrement...' : (chapter.id ? 'Enregistrer' : 'Créer') }}
            </button>
          </div>
        </div>

        <!-- View Mode -->
        <div v-else class="chapter-view-mode">
          <h3 class="chapter-view-title">{{ chapter.title }}</h3>
          <div class="chapter-view-meta">
            <span class="meta-type">{{ getContentTypeLabel(chapter.content_type) }}</span>
            <span v-if="chapter.slides_count" class="meta-info">{{ chapter.slides_count }} slides</span>
          </div>
          <p v-if="chapter.content && chapter.content_type === 'text'" class="chapter-preview">
            {{ getContentPreview(chapter.content) }}
          </p>
        </div>
      </div>

      <!-- Add Chapter Button (at the end) -->
      <div class="add-chapter-section">
        <button @click="addChapter" class="btn-add-chapter-professional">
          + Ajouter un chapitre
        </button>
      </div>
    </div>

    <!-- Upload Progress Modal -->
    <div v-if="uploadingFile" class="upload-overlay">
      <div class="upload-modal-card">
        <h3 class="upload-title">Upload en cours...</h3>
        <div class="progress-bar-container">
          <div class="progress-bar-fill" :style="{ width: uploadProgress + '%' }"></div>
        </div>
        <p class="upload-percentage">{{ uploadProgress }}%</p>
        <p class="upload-message">{{ uploadStatus }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import api from '@/services/api'

export default {
  name: 'ChapterManager',
  props: {
    lessonId: {
      type: Number,
      required: true
    }
  },

  data() {
    return {
      chapters: [],
      loading: false,
      saving: false,
      uploadingFile: false,
      uploadProgress: 0,
      uploadStatus: '',
      nextTempId: 1
    }
  },

  mounted() {
    this.loadChapters()
  },

  methods: {
    async loadChapters() {
      this.loading = true
      try {
        const response = await api.get(`/lessons/${this.lessonId}/chapters`)
        if (response.success) {
          this.chapters = response.data.map(ch => ({
            ...ch,
            isEditing: false
          }))

          // Si aucun chapitre, créer automatiquement le premier
          if (this.chapters.length === 0) {
            this.addChapter()
          }
        }
      } catch (error) {
        console.error('[ChapterManager] Erreur chargement:', error)
      } finally {
        this.loading = false
      }
    },

    addChapter() {
      const newChapter = {
        tempId: this.nextTempId++,
        title: '',
        content_type: 'text',
        content: '',
        video_url: '',
        external_link: '',
        autoplay_video: false,
        order: this.chapters.length,
        isEditing: true,
        isNew: true
      }
      this.chapters.push(newChapter)
    },

    editChapter(chapter) {
      chapter.isEditing = true
      chapter._originalState = { ...chapter }
    },

    cancelEdit(chapter) {
      if (chapter.isNew) {
        const index = this.chapters.indexOf(chapter)
        this.chapters.splice(index, 1)
      } else {
        if (chapter._originalState) {
          Object.assign(chapter, chapter._originalState)
          delete chapter._originalState
        }
        chapter.isEditing = false
      }
    },

    async saveChapter(chapter) {
      if (!chapter.title) {
        alert('Le titre est obligatoire')
        return
      }

      this.saving = true
      try {
        const chapterData = {
          title: chapter.title,
          content_type: chapter.content_type,
          content: chapter.content,
          video_url: chapter.video_url,
          external_link: chapter.external_link,
          autoplay_video: chapter.autoplay_video,
          order: chapter.order
        }

        let response
        if (chapter.id) {
          response = await api.put(`/chapters/${chapter.id}`, chapterData)
        } else {
          response = await api.post(`/lessons/${this.lessonId}/chapters`, chapterData)
        }

        if (response.success) {
          if (chapter.selectedFile) {
            await this.uploadFile(response.data.id, chapter.selectedFile)
          }

          await this.loadChapters()
          alert(chapter.id ? 'Chapitre mis à jour!' : 'Chapitre créé!')
        }
      } catch (error) {
        console.error('[ChapterManager] Erreur sauvegarde:', error)
        alert('Erreur: ' + (error.response?.data?.message || error.message))
      } finally {
        this.saving = false
      }
    },

    async uploadFile(chapterId, file) {
      this.uploadingFile = true
      this.uploadProgress = 0
      this.uploadStatus = 'Upload du fichier...'

      try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await api.post(`/chapters/${chapterId}/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            this.uploadProgress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          }
        })

        if (response.success) {
          this.uploadStatus = 'Conversion en cours...'
          await new Promise(resolve => setTimeout(resolve, 2000))
          this.uploadStatus = 'Terminé!'
        }
      } catch (error) {
        console.error('[ChapterManager] Erreur upload:', error)
        alert('Erreur upload: ' + (error.response?.data?.message || error.message))
      } finally {
        setTimeout(() => {
          this.uploadingFile = false
        }, 1000)
      }
    },

    async deleteChapter(chapter) {
      if (!confirm(`Supprimer le chapitre "${chapter.title}" ?`)) {
        return
      }

      try {
        const response = await api.delete(`/chapters/${chapter.id}`)
        if (response.success) {
          await this.loadChapters()
          alert('Chapitre supprimé!')
        }
      } catch (error) {
        console.error('[ChapterManager] Erreur suppression:', error)
        alert('Erreur: ' + (error.response?.data?.message || error.message))
      }
    },

    handleFileSelect(event, chapter) {
      const file = event.target.files[0]
      if (file) {
        if (file.size > 30 * 1024 * 1024) {
          alert('Fichier trop volumineux! Max: 30 MB')
          event.target.value = ''
          return
        }
        chapter.selectedFile = file
      }
    },

    getAcceptedFileTypes(contentType) {
      const types = {
        powerpoint: '.pptx,.ppt',
        word: '.docx,.doc',
        pdf: '.pdf'
      }
      return types[contentType] || '*'
    },

    getContentTypeLabel(type) {
      const labels = {
        text: 'Texte / Markdown',
        video: 'Vidéo',
        powerpoint: 'PowerPoint',
        word: 'Document Word',
        pdf: 'PDF',
        link: 'Lien externe'
      }
      return labels[type] || type
    },

    getWordCount(text) {
      if (!text) return 0
      return text.trim().split(/\s+/).length
    },

    getContentPreview(content) {
      if (!content) return ''
      return content.length > 150 ? content.substring(0, 150) + '...' : content
    }
  }
}
</script>

<style scoped>
.chapter-manager-professional {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 0;
}

/* Header */
.chapters-header {
  padding: 24px 24px 16px;
  border-bottom: 1px solid var(--border-color);
}

.chapters-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.chapters-subtitle {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

/* Loading */
.loading-state {
  text-align: center;
  padding: 48px 24px;
  color: var(--text-secondary);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-color);
  border-top-color: var(--color-primary, #10b981);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Chapters Container */
.chapters-container {
  padding: 24px;
}

.chapter-block {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  margin-bottom: 24px;
  overflow: hidden;
}

.chapter-header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.chapter-number-badge {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-primary, #3b82f6);
}

.chapter-actions-inline {
  display: flex;
  gap: 8px;
}

.btn-edit,
.btn-delete {
  padding: 6px 12px;
  font-size: 0.8125rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--card-bg);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-edit {
  color: var(--color-primary, #3b82f6);
}

.btn-edit:hover {
  background: rgba(59, 130, 246, 0.1);
  border-color: var(--color-primary, #3b82f6);
}

.btn-delete {
  color: #dc2626;
}

.btn-delete:hover {
  background: rgba(220, 38, 38, 0.1);
  border-color: #dc2626;
}

/* Form Professional */
.chapter-form-professional {
  padding: 24px;
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
  border: 1px solid var(--border-color);
  border-radius: 6px;
  transition: all 0.2s;
  background-color: var(--input-bg, var(--card-bg));
  color: var(--text-primary);
}

.title-input:focus {
  outline: none;
  border-color: var(--color-primary, #3b82f6);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.title-input::placeholder {
  color: var(--text-muted, #9ca3af);
  opacity: 1;
}

.content-type-select {
  width: 100%;
  padding: 10px 12px;
  font-size: 0.875rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background-color: var(--input-bg, var(--card-bg));
  color: var(--text-primary);
  cursor: pointer;
}

/* Editor Container */
.editor-container {
  border: 1px solid var(--border-color);
  border-radius: 6px;
  overflow: hidden;
}

.editor-toolbar {
  display: flex;
  gap: 4px;
  padding: 8px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.toolbar-btn {
  padding: 6px 12px;
  font-size: 0.875rem;
  font-weight: 600;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: var(--card-bg);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
}

.toolbar-btn:hover {
  background-color: var(--hover-bg);
  color: var(--text-primary);
}

.content-textarea {
  width: 100%;
  padding: 16px;
  font-size: 0.875rem;
  line-height: 1.6;
  border: none;
  resize: vertical;
  font-family: inherit;
  background-color: var(--input-bg, var(--card-bg));
  color: var(--text-primary);
}

.content-textarea:focus {
  outline: none;
}

.content-textarea::placeholder {
  color: var(--text-muted, #9ca3af);
  opacity: 1;
}

.editor-footer {
  padding: 8px 16px;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.word-count {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

/* URL Input */
.url-input {
  width: 100%;
  padding: 10px 12px;
  font-size: 0.875rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  margin-bottom: 12px;
  background-color: var(--input-bg, var(--card-bg));
  color: var(--text-primary);
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

/* View Mode */
.chapter-view-mode {
  padding: 20px 24px;
}

.chapter-view-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 12px 0;
}

.chapter-view-meta {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.meta-type {
  padding: 4px 12px;
  background: rgba(59, 130, 246, 0.1);
  color: var(--color-primary, #3b82f6);
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 12px;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.meta-info {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.chapter-preview {
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
}

/* Add Chapter Section */
.add-chapter-section {
  text-align: center;
  padding: 24px 0 0;
}

.btn-add-chapter-professional {
  padding: 12px 32px;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-primary, #3b82f6);
  background: var(--card-bg);
  border: 2px dashed var(--color-primary, #3b82f6);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-add-chapter-professional:hover {
  background: rgba(59, 130, 246, 0.1);
}

/* Upload Modal */
.upload-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.upload-modal-card {
  background: var(--card-bg);
  padding: 32px;
  border-radius: 12px;
  text-align: center;
  max-width: 400px;
  width: 90%;
  border: 1px solid var(--border-color);
}

.upload-title {
  margin: 0 0 24px 0;
  font-size: 1.125rem;
  color: var(--text-primary);
  font-weight: 600;
}

.progress-bar-container {
  width: 100%;
  height: 8px;
  background: var(--bg-secondary);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 12px;
}

.progress-bar-fill {
  height: 100%;
  background: var(--color-primary, #10b981);
  transition: width 0.3s;
}

.upload-percentage {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 12px 0 8px;
}

.upload-message {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .chapters-header,
  .chapters-container {
    padding: 16px;
  }

  .chapter-header-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn-cancel,
  .btn-save {
    width: 100%;
  }
}
</style>
