<template>
  <DashboardLayout>
    <div class="page-container">
      <!-- Header avec retour -->
      <div class="page-header">
        <button @click="goBack" class="btn-back">
          <ArrowLeftIcon class="w-5 h-5" />
          Retour
        </button>

        <!-- Bandeau MODE PRÉVISUALISATION -->
        <div class="preview-banner">
          <div class="preview-banner-content">
            <div class="preview-banner-icon">
              <EyeIcon class="w-6 h-6" />
            </div>
            <div>
              <p class="preview-banner-title">MODE PRÉVISUALISATION</p>
              <p class="preview-banner-subtitle">Aperçu de l'évaluation tel qu'elle apparaîtra aux étudiants</p>
            </div>
          </div>
        </div>

        <div class="header-content" v-if="evaluation">
          <DocumentTextIcon class="page-icon" />
          <div>
            <h1 class="page-title">{{ evaluation.titre }}</h1>
            <p v-if="evaluation.description" class="page-subtitle">{{ evaluation.description }}</p>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <ContentLoader v-if="loading" text="Chargement de la prévisualisation..." />

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <div class="error-content">
          <i class="fa fa-exclamation-triangle error-icon"></i>
          <div>
            <h3 class="error-title">Erreur de chargement</h3>
            <p class="error-message">{{ error }}</p>
          </div>
        </div>
        <button @click="loadPreview" class="btn-retry">
          <ArrowPathIcon class="w-5 h-5" />
          Réessayer
        </button>
      </div>

      <!-- Contenu principal -->
      <template v-else-if="evaluation">
        <!-- Statistiques -->
        <PreviewStatsGrid :evaluation="evaluation" />

        <!-- Barre de progression -->
        <PreviewProgress
          :answered-count="answeredCount"
          :questions-count="evaluation.questions_count"
          :progress-percentage="progressPercentage"
        />

        <!-- Questions -->
        <PreviewQuestionsList
          :questions="evaluation.questions"
          :answers="previewAnswers"
          @select="selectAnswer"
        />

        <!-- Actions footer -->
        <PreviewActionsFooter
          :is-published="evaluation.is_published"
          :publishing="publishing"
          @back="goBack"
          @edit="goToEdit"
          @publish="publishEvaluation"
        />
      </template>
    </div>
  </DashboardLayout>
</template>

<script setup>
/**
 * Prévisualisation enseignant d'une évaluation (H1 ≤300). Orchestrateur : la
 * donnée et la logique vivent dans usePreviewEvaluation ; l'UI est composée de
 * PreviewStatsGrid, PreviewProgress, PreviewQuestionsList et PreviewActionsFooter.
 * Rendu/comportement identiques à l'original.
 */
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import { ArrowLeftIcon, ArrowPathIcon, DocumentTextIcon, EyeIcon } from '@heroicons/vue/24/outline'
import PreviewStatsGrid from '@/components/evaluations/PreviewStatsGrid.vue'
import PreviewProgress from '@/components/evaluations/PreviewProgress.vue'
import PreviewQuestionsList from '@/components/evaluations/PreviewQuestionsList.vue'
import PreviewActionsFooter from '@/components/evaluations/PreviewActionsFooter.vue'
import { usePreviewEvaluation } from '@/composables/usePreviewEvaluation'

const {
  loading, error, evaluation, previewAnswers, publishing,
  answeredCount, progressPercentage,
  loadPreview, selectAnswer, goToEdit, publishEvaluation, goBack,
} = usePreviewEvaluation()
</script>

<style scoped>
.page-container {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  background: var(--card-bg);
  color: var(--text-secondary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all var(--transition-fast);
  margin-bottom: 1rem;
}

.btn-back:hover {
  background: var(--bg-hover);
  border-color: var(--border-secondary);
}

/* Bandeau prévisualisation */
.preview-banner {
  background: linear-gradient(135deg, var(--violet-500) 0%, var(--indigo-500) 100%);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(139, 92, 246, 0.1), 0 2px 4px -1px rgba(139, 92, 246, 0.06);
}

.preview-banner-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  color: white;
}

.preview-banner-icon {
  width: 3rem;
  height: 3rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-banner-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.preview-banner-subtitle {
  font-size: 0.875rem;
  opacity: 0.9;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.page-icon {
  width: 3rem;
  height: 3rem;
  color: var(--blue-500);
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.page-subtitle {
  font-size: 1.125rem;
  color: var(--text-secondary);
}

/* Error State */
.error-state {
  padding: 2rem;
  text-align: center;
}

.error-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.error-icon {
  font-size: 3rem;
}

.error-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--error-text);
  margin-bottom: 0.5rem;
}

.error-message {
  color: var(--text-secondary);
}

.btn-retry {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--btn-primary-bg);
  color: var(--btn-primary-text);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: 500;
  transition: all var(--transition-fast);
}

.btn-retry:hover {
  background: var(--btn-primary-hover);
}
</style>
