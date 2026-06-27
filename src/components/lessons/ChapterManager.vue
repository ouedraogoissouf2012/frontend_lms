<template>
  <div class="chapter-manager-professional">
    <!-- Header Section -->
    <div class="chapters-header">
      <h2 class="chapters-title">Chapitres de la leçon</h2>
      <p class="chapters-subtitle">Organisez votre leçon en chapitres. Chaque chapitre peut avoir un type de contenu différent.</p>
    </div>

    <!-- Loading state -->
    <ContentLoader v-if="loading" text="Chargement des chapitres..." />

    <!-- Chapters List (#28 : extrait en sous-composant) -->
    <ChapterList
      v-else
      :chapters="chapters"
      :readonly="readonly"
      :saving="saving"
      :get-chapter-quiz="getChapterQuiz"
      @edit="editChapter"
      @delete="deleteChapter"
      @save="saveChapter"
      @cancel="cancelEdit"
      @open-quiz-editor="openQuizEditor"
      @open-quiz-player="openQuizPlayer"
      @add="addChapter"
    />

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

<script setup>
/**
 * Gestion des chapitres d'une leçon (#28 ; éclaté sous 300 lignes en H5).
 * Orchestrateur : la donnée et la logique (CRUD chapitres, upload, quiz) vivent
 * dans useChapterManager ; la liste est rendue par ChapterList ; ce composant ne
 * garde que l'en-tête, les modales (upload + éditeur/lecteur de quiz) et le CSS
 * de layout résiduel.
 */
import { toRef } from 'vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import KnowledgeCheckEditor from '@/components/lessons/KnowledgeCheckEditor.vue'
import KnowledgeCheckPlayer from '@/components/lessons/KnowledgeCheckPlayer.vue'
import ChapterList from '@/components/lessons/ChapterList.vue'
import { useChapterManager } from '@/composables/useChapterManager'

const props = defineProps({
  lessonId: { type: Number, required: true },
  readonly: { type: Boolean, default: false }
})

const {
  chapters, loading, saving, uploadingFile, uploadProgress, uploadStatus,
  showQuizEditor, showQuizPlayer, selectedChapterId, selectedQuiz, editingQuiz,
  addChapter, editChapter, cancelEdit, saveChapter, deleteChapter,
  openQuizEditor, closeQuizEditor, onQuizSaved, openQuizPlayer, closeQuizPlayer,
  onQuizCompleted, getChapterQuiz
} = useChapterManager(toRef(props, 'lessonId'))
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

/* Loading — dette pré-existante : remplacé par <ContentLoader>, ces règles
   (.loading-state/.spinner/@keyframes spin) n'ont plus de cible. Conservées
   à l'identique (#H5, parité). */
.loading-state {
  text-align: center;
  padding: 48px 24px;
  color: var(--text-secondary);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-color);
  border-top-color: var(--color-primary, var(--emerald-500));
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
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
  background: var(--color-primary, var(--emerald-500));
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

/* Responsive — les règles .form-actions/.btn-cancel/.btn-save/.quiz-exists-info/
   .quiz-view-header ciblent des classes désormais portées par des sous-composants
   (ChapterEditForm/ChapterViewMode) : déjà sans cible ici en CSS scoped avant H5
   (dette pré-existante du découpage #28). Conservées à l'identique. */
@media (max-width: 768px) {
  .chapters-header {
    padding: 16px;
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
