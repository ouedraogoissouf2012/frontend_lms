<template>
  <div class="chapter-view-mode">
    <h3 class="chapter-view-title">{{ chapter.title }}</h3>
    <div class="chapter-view-meta">
      <span class="meta-type">{{ getChapterContentTypeLabel(chapter.content_type) }}</span>
      <span v-if="chapter.slides_count" class="meta-info">{{ chapter.slides_count }} slides</span>
    </div>

    <!-- Affichage du contenu texte -->
    <p v-if="chapter.content && chapter.content_type === 'text'" class="chapter-preview">
      {{ getChapterContentPreview(chapter.content) }}
    </p>

    <!-- Affichage du contenu Word (HTML) -->
    <div v-if="chapter.content && chapter.content_type === 'word'" class="chapter-word-content" v-html="chapter.content"></div>

    <!-- Affichage du Quiz -->
    <div v-if="chapter.content_type === 'quiz' && chapter.id" class="chapter-quiz-view">
      <div v-if="quiz" class="quiz-view-content">
        <div class="quiz-view-header">
          <div class="quiz-view-info">
            <i class="material-icons quiz-icon">quiz</i>
            <div class="quiz-view-details">
              <span class="quiz-view-title">{{ quiz.title }}</span>
              <span class="quiz-view-meta">
                {{ quiz.questions?.length || 0 }} questions
                <template v-if="quiz.time_limit_minutes">
                  - {{ quiz.time_limit_minutes }} min
                </template>
              </span>
            </div>
          </div>

          <!-- Score utilisateur -->
          <div v-if="quiz.user_best_score !== null"
               class="quiz-view-score"
               :class="getQuizScoreBadge(quiz).class">
            <i class="material-icons">{{ quiz.user_passed ? 'check_circle' : 'trending_up' }}</i>
            {{ quiz.user_best_score }}%
          </div>
        </div>

        <div class="quiz-view-actions">
          <button @click="$emit('open-quiz-player', quiz)" class="btn-start-quiz">
            <i class="material-icons">play_arrow</i>
            {{ quiz.user_best_score !== null ? 'Retenter le quiz' : 'Commencer le quiz' }}
          </button>
        </div>
      </div>
      <div v-else class="quiz-view-empty">
        <i class="material-icons">quiz</i>
        <p>Aucun quiz configure pour ce chapitre.</p>
        <button v-if="!readonly" @click="$emit('open-quiz-editor', chapter.id)" class="btn-create-quiz-view">
          <i class="material-icons">add</i>
          Creer un quiz
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Mode lecture d'un chapitre (#28, tranche 2).
 * Sous-composant de présentation extrait de ChapterManager.vue (le mode édition,
 * couplé en two-way binding, reste au parent — refactor props/emit dédié à venir).
 * Émet open-quiz-player / open-quiz-editor.
 */
import { getChapterContentTypeLabel, getChapterContentPreview } from '@/utils/chapterContent'
import knowledgeCheckService from '@/services/knowledgeCheck'

defineProps({
  chapter: { type: Object, required: true },
  // Quiz du chapitre (ou null) — résolu par le parent depuis knowledgeChecks.
  quiz: { type: Object, default: null },
  readonly: { type: Boolean, default: false }
})

defineEmits(['open-quiz-player', 'open-quiz-editor'])

function getQuizScoreBadge(q) {
  return knowledgeCheckService.getScoreBadge(q.user_best_score || 0, q.passing_score)
}
</script>

<style scoped>
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
</style>
