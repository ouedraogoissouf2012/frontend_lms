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

        <!-- Edit Mode (#28 : extrait en sous-composant) -->
        <ChapterEditForm
          v-if="chapter.isEditing"
          :chapter="chapter"
          :quiz="getChapterQuiz(chapter.id)"
          :saving="saving"
          @save="saveChapter"
          @cancel="cancelEdit"
          @open-quiz-editor="openQuizEditor"
        />

        <!-- View Mode (#28 : extrait en sous-composant) -->
        <ChapterViewMode
          v-else
          :chapter="chapter"
          :quiz="getChapterQuiz(chapter.id)"
          :readonly="readonly"
          @open-quiz-player="openQuizPlayer"
          @open-quiz-editor="openQuizEditor"
        />
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
import ContentLoader from '@/components/common/ContentLoader.vue'
import KnowledgeCheckEditor from '@/components/lessons/KnowledgeCheckEditor.vue'
import KnowledgeCheckPlayer from '@/components/lessons/KnowledgeCheckPlayer.vue'
import knowledgeCheckService from '@/services/knowledgeCheck'
import ChapterViewMode from '@/components/lessons/ChapterViewMode.vue'
import ChapterEditForm from '@/components/lessons/ChapterEditForm.vue'
import { createEmptyChapter, buildChapterPayload } from '@/utils/chapterManager'

export default {
  name: 'ChapterManager',
  components: {
    ContentLoader,
    KnowledgeCheckEditor,
    KnowledgeCheckPlayer,
    ChapterViewMode,
    ChapterEditForm
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
      this.chapters.push(createEmptyChapter(this.chapters.length, this.nextTempId++))
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
        const chapterData = buildChapterPayload(chapter)

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

    // handleFileSelect / getAcceptedFileTypes / maxFileSizeLabel : déplacés dans
    // ChapterEditForm. getContentTypeLabel / getContentPreview / getQuizScoreBadge
    // dans ChapterViewMode (#28).

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
