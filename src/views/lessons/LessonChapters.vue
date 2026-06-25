<template>
  <DashboardLayout>
    <div class="lesson-chapters-page">
      <!-- Breadcrumb & Header -->
      <div class="page-header">
        <div class="breadcrumb">
          <button @click="goBack" class="breadcrumb-link">
            ← Retour
          </button>
        </div>

        <!-- Message mode lecture seule -->
        <div v-if="isReadOnly" class="readonly-notice">
          <div class="notice-icon">ℹ️</div>
          <div class="notice-content">
            <strong>Mode consultation</strong>
            <p>Vous consultez cette leçon. Pour la modifier, allez dans <strong>Matières</strong> → Sélectionnez la matière → Modifier la leçon.</p>
          </div>
        </div>

        <!-- Lesson info -->
        <LessonInfoCard
          v-if="lesson"
          :lesson="lesson"
          :is-read-only="isReadOnly"
          :publishing="publishing"
          @preview="previewLesson"
          @publish="publishLesson"
        />

        <!-- Loading lesson -->
        <div v-else-if="loadingLesson" class="loading-card">
          <div class="spinner"></div>
          <p>Chargement de la leçon...</p>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="error-card">
          <p class="error-message">{{ error }}</p>
          <button @click="loadLesson" class="btn-retry">Réessayer</button>
        </div>
      </div>

      <!-- Chapter Manager Component -->
      <ChapterManager
        v-if="lesson"
        :lesson-id="lessonId"
        :readonly="isReadOnly"
        @chapters-updated="onChaptersUpdated"
      />
    </div>
  </DashboardLayout>
</template>

<script setup>
/**
 * Chapitres d'une leçon (#H4 ≤300) — orchestrateur. Données/logique dans
 * useLessonChapters ; UI composée de LessonInfoCard + ChapterManager. Header,
 * notice lecture seule, états chargement/erreur restent ici.
 */
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ChapterManager from '@/components/lessons/ChapterManager.vue'
import LessonInfoCard from '@/components/lessons/LessonInfoCard.vue'
import { useLessonChapters } from '@/composables/useLessonChapters'

const {
  lesson,
  loadingLesson,
  error,
  publishing,
  lessonId,
  isReadOnly,
  loadLesson,
  previewLesson,
  publishLesson,
  onChaptersUpdated,
  goBack
} = useLessonChapters()
</script>

<style scoped>

/* Readonly Notice */
.readonly-notice {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%);
  border: 2px solid #3b82f6;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
}

.notice-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.notice-content {
  flex: 1;
}

.notice-content strong {
  display: block;
  color: #1e40af;
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.notice-content p {
  margin: 0;
  color: #1e3a8a;
  font-size: 0.875rem;
  line-height: 1.5;
}

<style scoped>
.lesson-chapters-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  background: var(--bg-primary);
}

.page-header {
  margin-bottom: 32px;
}

.breadcrumb {
  margin-bottom: 16px;
}

.breadcrumb-link {
  background: none;
  border: none;
  color: var(--color-primary, #3b82f6);
  font-size: 0.875rem;
  cursor: pointer;
  padding: 4px 0;
  transition: color 0.2s;
}

.breadcrumb-link:hover {
  color: var(--color-primary-dark, #2563eb);
  text-decoration: underline;
}

/* Loading */
.loading-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 48px;
  text-align: center;
  box-shadow: var(--card-shadow, 0 1px 3px rgba(0, 0, 0, 0.1));
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-color);
  border-top-color: var(--color-primary, #3b82f6);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-card p {
  color: var(--text-secondary);
  margin: 0;
}

/* Error */
.error-card {
  background: var(--card-bg);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
  padding: 24px;
  text-align: center;
}

.error-message {
  color: #dc2626;
  font-weight: 500;
  margin: 0 0 16px 0;
}

.btn-retry {
  padding: 8px 16px;
  background-color: var(--color-primary, #3b82f6);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-retry:hover {
  opacity: 0.9;
}

/* Responsive */
@media (max-width: 768px) {
  .lesson-chapters-page {
    padding: 16px;
  }
}
</style>
