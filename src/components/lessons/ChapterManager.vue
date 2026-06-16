<template>
  <div class="chapter-manager-professional">
    <!-- Header Section -->
    <div class="chapters-header">
      <h2 class="chapters-title">Chapitres de la leçon</h2>
      <p class="chapters-subtitle">Organisez votre leçon en chapitres. Chaque chapitre peut avoir un type de contenu différent.</p>
    </div>

    <!-- Loading state -->
    <ContentLoader v-if="loading" text="Chargement des chapitres..." />

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
          <div v-if="!chapter.isEditing && !readonly" class="chapter-actions-inline">
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
                @change="handleFileSelect($event, chapter)"
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
                <div v-if="getChapterQuiz(chapter.id)" class="quiz-exists-info">
                  <div class="quiz-summary">
                    <i class="material-icons">quiz</i>
                    <div class="quiz-summary-text">
                      <span class="quiz-title">{{ getChapterQuiz(chapter.id).title }}</span>
                      <span class="quiz-meta">{{ getChapterQuiz(chapter.id).questions?.length || 0 }} questions</span>
                    </div>
                  </div>
                  <button @click="openQuizEditor(chapter.id, getChapterQuiz(chapter.id))" class="btn-edit-inline-quiz">
                    <i class="material-icons">edit</i>
                    Modifier le quiz
                  </button>
                </div>
                <div v-else class="quiz-create-prompt">
                  <p class="quiz-prompt-text">Aucun quiz cree pour ce chapitre.</p>
                  <button @click="openQuizEditor(chapter.id)" class="btn-create-quiz">
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

          <!-- Affichage du contenu texte -->
          <p v-if="chapter.content && chapter.content_type === 'text'" class="chapter-preview">
            {{ getContentPreview(chapter.content) }}
          </p>

          <!-- Affichage du contenu Word (HTML) -->
          <div v-if="chapter.content && chapter.content_type === 'word'" class="chapter-word-content" v-html="chapter.content"></div>

          <!-- Affichage du Quiz -->
          <div v-if="chapter.content_type === 'quiz' && chapter.id" class="chapter-quiz-view">
            <div v-if="getChapterQuiz(chapter.id)" class="quiz-view-content">
              <div class="quiz-view-header">
                <div class="quiz-view-info">
                  <i class="material-icons quiz-icon">quiz</i>
                  <div class="quiz-view-details">
                    <span class="quiz-view-title">{{ getChapterQuiz(chapter.id).title }}</span>
                    <span class="quiz-view-meta">
                      {{ getChapterQuiz(chapter.id).questions?.length || 0 }} questions
                      <template v-if="getChapterQuiz(chapter.id).time_limit_minutes">
                        - {{ getChapterQuiz(chapter.id).time_limit_minutes }} min
                      </template>
                    </span>
                  </div>
                </div>

                <!-- Score utilisateur -->
                <div v-if="getChapterQuiz(chapter.id).user_best_score !== null"
                     class="quiz-view-score"
                     :class="getQuizScoreBadge(getChapterQuiz(chapter.id)).class">
                  <i class="material-icons">{{ getChapterQuiz(chapter.id).user_passed ? 'check_circle' : 'trending_up' }}</i>
                  {{ getChapterQuiz(chapter.id).user_best_score }}%
                </div>
              </div>

              <div class="quiz-view-actions">
                <button @click="openQuizPlayer(getChapterQuiz(chapter.id))" class="btn-start-quiz">
                  <i class="material-icons">play_arrow</i>
                  {{ getChapterQuiz(chapter.id).user_best_score !== null ? 'Retenter le quiz' : 'Commencer le quiz' }}
                </button>
              </div>
            </div>
            <div v-else class="quiz-view-empty">
              <i class="material-icons">quiz</i>
              <p>Aucun quiz configure pour ce chapitre.</p>
              <button v-if="!readonly" @click="openQuizEditor(chapter.id)" class="btn-create-quiz-view">
                <i class="material-icons">add</i>
                Creer un quiz
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Add Chapter Button (at the end) -->
      <div v-if="!readonly" class="add-chapter-section">
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

    <!-- Knowledge Check Editor Modal -->
    <div v-if="showQuizEditor" class="quiz-modal-overlay" @click.self="closeQuizEditor">
      <div class="quiz-modal-content">
        <KnowledgeCheckEditor
          :chapter-id="selectedChapterId"
          :existing-quiz="editingQuiz"
          @close="closeQuizEditor"
          @saved="onQuizSaved"
        />
      </div>
    </div>

    <!-- Knowledge Check Player Modal -->
    <div v-if="showQuizPlayer" class="quiz-modal-overlay" @click.self="closeQuizPlayer">
      <div class="quiz-modal-content quiz-player-modal">
        <KnowledgeCheckPlayer
          :quiz="selectedQuiz"
          @close="closeQuizPlayer"
          @completed="onQuizCompleted"
        />
      </div>
    </div>
  </div>
</template>

<script>
import api from '@/services/api'
import { toast } from '@/services/toast'
import { normalizeError } from '@/services/errorHandler'
import TipTapEditor from '@/components/common/TipTapEditor.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import KnowledgeCheckEditor from '@/components/lessons/KnowledgeCheckEditor.vue'
import KnowledgeCheckPlayer from '@/components/lessons/KnowledgeCheckPlayer.vue'
import knowledgeCheckService from '@/services/knowledgeCheck'
import { UPLOAD_CONFIG, ACCEPTED_FILE_TYPES } from '@/constants/upload'

export default {
  name: 'ChapterManager',
  components: {
    TipTapEditor,
    ContentLoader,
    KnowledgeCheckEditor,
    KnowledgeCheckPlayer
  },
  props: {
    lessonId: {
      type: Number,
      required: true
    },
    readonly: {
      type: Boolean,
      default: false
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
      nextTempId: 1,
      // Knowledge Checks
      knowledgeChecks: {},
      showQuizEditor: false,
      showQuizPlayer: false,
      selectedChapterId: null,
      selectedQuiz: null,
      editingQuiz: null
    }
  },

  mounted() {
    this.loadChapters()
  },

  computed: {
    // Libellé de taille max d'upload (source unique #24)
    maxFileSizeLabel() {
      return UPLOAD_CONFIG.MAX_FILE_SIZE_LABEL
    }
  },

  watch: {
    chapters: {
      handler(newChapters) {
        // Charger les quiz pour tous les chapitres
        newChapters.forEach(ch => {
          if (ch.id && !this.knowledgeChecks[ch.id]) {
            this.loadKnowledgeChecks(ch.id)
          }
        })
      },
      deep: true
    }
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
        toast.error(error.userMessage ?? normalizeError(error).userMessage)
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
        toast.error(error.userMessage ?? normalizeError(error).userMessage)
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
        toast.error(error.userMessage ?? normalizeError(error).userMessage)
      }
    },

    handleFileSelect(event, chapter) {
      const file = event.target.files[0]
      if (file) {
        if (file.size > UPLOAD_CONFIG.MAX_FILE_SIZE_BYTES) {
          alert(`Fichier trop volumineux! Max: ${UPLOAD_CONFIG.MAX_FILE_SIZE_LABEL}`)
          event.target.value = ''
          return
        }
        chapter.selectedFile = file
      }
    },

    getAcceptedFileTypes(contentType) {
      return ACCEPTED_FILE_TYPES[contentType] || '*'
    },

    getContentTypeLabel(type) {
      const labels = {
        text: 'Texte / Markdown',
        video: 'Vidéo',
        powerpoint: 'PowerPoint',
        word: 'Document Word',
        pdf: 'PDF',
        link: 'Lien externe',
        quiz: 'Quiz / Testez vos connaissances'
      }
      return labels[type] || type
    },

    getContentPreview(content) {
      if (!content) return ''
      return content.length > 150 ? content.substring(0, 150) + '...' : content
    },

    // =====================
    // Knowledge Checks
    // =====================
    async loadKnowledgeChecks(chapterId) {
      try {
        const response = await knowledgeCheckService.getByChapter(chapterId)
        if (response.success) {
          this.knowledgeChecks[chapterId] = response.data
        }
      } catch (error) {
        console.error('[ChapterManager] Erreur chargement quiz:', error)
      }
    },

    async loadAllKnowledgeChecks() {
      for (const chapter of this.chapters) {
        if (chapter.id) {
          await this.loadKnowledgeChecks(chapter.id)
        }
      }
    },

    openQuizEditor(chapterId, quiz = null) {
      this.selectedChapterId = chapterId
      this.editingQuiz = quiz
      this.showQuizEditor = true
    },

    closeQuizEditor() {
      this.showQuizEditor = false
      this.selectedChapterId = null
      this.editingQuiz = null
    },

    async onQuizSaved(quiz) {
      // Recharger les quiz AVANT de fermer (pour garder selectedChapterId)
      if (quiz && quiz.chapter_id) {
        await this.loadKnowledgeChecks(quiz.chapter_id)
      }
      this.closeQuizEditor()
    },

    openQuizPlayer(quiz) {
      this.selectedQuiz = quiz
      this.showQuizPlayer = true
    },

    closeQuizPlayer() {
      this.showQuizPlayer = false
      this.selectedQuiz = null
    },

    async onQuizCompleted(result) {
      console.log('[ChapterManager] Quiz complete:', result)
      // Recharger les quiz pour mettre a jour les scores
      if (this.selectedQuiz) {
        await this.loadKnowledgeChecks(this.selectedQuiz.chapter_id)
      }
    },

    async deleteKnowledgeCheck(quiz) {
      if (!confirm(`Supprimer le quiz "${quiz.title}" ?`)) {
        return
      }

      try {
        const response = await knowledgeCheckService.delete(quiz.id)
        if (response.success) {
          await this.loadKnowledgeChecks(quiz.chapter_id)
          alert('Quiz supprime!')
        }
      } catch (error) {
        console.error('[ChapterManager] Erreur suppression quiz:', error)
        toast.error(error.userMessage ?? normalizeError(error).userMessage)
      }
    },

    getQuizScoreBadge(quiz) {
      return knowledgeCheckService.getScoreBadge(quiz.user_best_score || 0, quiz.passing_score)
    },

    // Retourne le premier quiz du chapitre (pour type quiz)
    getChapterQuiz(chapterId) {
      const quizzes = this.knowledgeChecks[chapterId]
      return quizzes && quizzes.length > 0 ? quizzes[0] : null
    }
  }
}
</script>

<style scoped>
.chapter-manager-professional {
  background: var(--card-bg);
  border: 3px solid var(--border-color);
  border-radius: 12px;
  padding: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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
  border: 3px solid var(--border-color);
  border-left: 6px solid var(--color-primary, #10b981);
  border-radius: 12px;
  margin-bottom: 24px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  transition: all 0.3s ease;
}

.chapter-block:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  transform: translateY(-3px);
  border-color: var(--color-primary, #10b981);
}

.chapter-header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: var(--bg-secondary);
  border-bottom: 3px solid var(--color-primary, #10b981);
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
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
  border: 3px solid var(--border-color);
  border-radius: 6px;
  background: var(--card-bg);
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.btn-edit {
  color: var(--color-primary, #10b981);
}

.btn-edit:hover {
  background: rgba(16, 185, 129, 0.15);
  border-color: var(--color-primary, #10b981);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-delete {
  color: #dc2626;
}

.btn-delete:hover {
  background: rgba(220, 38, 38, 0.15);
  border-color: #dc2626;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
}

/* Form Professional */
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

/* Word Content Display */
.chapter-word-content {
  font-size: 0.875rem;
  color: var(--text-primary);
  line-height: 1.6;
  margin: 12px 0;
  padding: 16px;
  background: var(--bg-secondary, #f9fafb);
  border-radius: 8px;
  border: 1px solid var(--border-color, #e5e7eb);
  max-height: 400px;
  overflow-y: auto;
}

.chapter-word-content p {
  margin: 0.5em 0;
}

.chapter-word-content h1, .chapter-word-content h2, .chapter-word-content h3 {
  margin-top: 1em;
  margin-bottom: 0.5em;
}

/* Add Chapter Section */
.add-chapter-section {
  text-align: center;
  padding: 24px 0 0;
}

.btn-add-chapter-professional {
  padding: 14px 36px;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-primary, #10b981);
  background: var(--card-bg);
  border: 4px dashed var(--color-primary, #10b981);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.btn-add-chapter-professional:hover {
  background: rgba(16, 185, 129, 0.15);
  border-style: solid;
  border-width: 4px;
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.3);
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

/* Quiz Modal */
.quiz-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
}

.quiz-modal-content {
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow: hidden;
}

.quiz-player-modal {
  max-width: 700px;
}

/* ===================== */
/* Quiz Inline Editor */
/* ===================== */
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

/* ===================== */
/* Quiz View Mode */
/* ===================== */
.chapter-quiz-view {
  margin-top: 16px;
}

.quiz-view-content {
  padding: 20px;
  background: rgba(99, 102, 241, 0.08);
  border: 2px solid rgba(99, 102, 241, 0.3);
  border-radius: 12px;
}

.quiz-view-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.quiz-view-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.quiz-view-info .quiz-icon {
  font-size: 2rem;
  color: #6366f1;
}

.quiz-view-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.quiz-view-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.quiz-view-meta {
  font-size: 0.8125rem;
  color: var(--text-secondary);
}

.quiz-view-score {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9375rem;
}

.quiz-view-score i {
  font-size: 1.125rem;
}

.quiz-view-actions {
  display: flex;
  justify-content: center;
}

.btn-start-quiz {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 28px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-start-quiz:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
}

.btn-start-quiz i {
  font-size: 1.25rem;
}

.quiz-view-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px;
  background: var(--bg-secondary);
  border-radius: 12px;
  text-align: center;
}

.quiz-view-empty i {
  font-size: 3rem;
  color: var(--text-tertiary);
  margin-bottom: 12px;
}

.quiz-view-empty p {
  margin: 0 0 16px 0;
  color: var(--text-secondary);
}

.btn-create-quiz-view {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.btn-create-quiz-view:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
}

.btn-create-quiz-view i {
  font-size: 1.25rem;
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

  .quiz-exists-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .quiz-view-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .quiz-modal-content {
    max-height: 95vh;
  }
}
</style>
