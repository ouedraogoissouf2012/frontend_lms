<template>
  <div class="lesson-card">
    <!-- Header avec badge type -->
    <div class="lesson-card-header">
      <div class="lesson-card-header-content">
        <LessonCardBadges :lesson="lesson" :show-status="showStatus" />
        <h3 class="lesson-title">
          {{ lesson.title }}
        </h3>
        <p v-if="lesson.description" class="lesson-description">
          {{ lesson.description }}
        </p>
      </div>
    </div>

    <!-- Body avec infos -->
    <div class="lesson-card-body">
      <!-- Durée et Type de contenu -->
      <div class="lesson-info-row">
        <div v-if="lesson.duration_minutes" class="lesson-info-item">
          <i class="fa fa-clock-o info-icon"></i>
          <span>{{ formatDuration(lesson.duration_minutes) }}</span>
        </div>
        <div v-if="lesson.content_type" class="lesson-info-item">
          <i :class="`fa ${getContentTypeIcon(lesson.content_type)} info-icon`"></i>
          <span>{{ getContentTypeLabel(lesson.content_type) }}</span>
        </div>
      </div>

      <!-- Progression (si étudiant) -->
      <div v-if="showProgress && lesson.user_progress" class="lesson-progress-container">
        <LessonProgress :progress="lesson.user_progress" :compact="true" />
      </div>

      <!-- Statistiques (si enseignant) -->
      <LessonStatsGrid v-if="showStats && lesson.statistics" :statistics="lesson.statistics" />
    </div>

    <!-- Footer avec actions -->
    <div class="lesson-card-footer">
      <!-- Date de publication -->
      <span class="lesson-date">
        <i class="fa fa-calendar date-icon"></i>
        <span v-if="lesson.published_at">{{ formatDate(lesson.published_at) }}</span>
        <span v-else>{{ formatDate(lesson.created_at) }}</span>
      </span>

      <!-- Actions selon le rôle -->
      <LessonCardActions
        :lesson="lesson"
        :is-teacher="isTeacher"
        @view="$emit('view', $event)"
        @edit="$emit('edit', $event)"
        @delete="$emit('delete', $event)"
        @publish="$emit('publish', $event)"
        @unpublish="$emit('unpublish', $event)"
      />
    </div>
  </div>
</template>

<script setup>
/**
 * Carte de leçon (#H4 ≤300) — orchestrateur présentationnel. Header (badges/titre),
 * corps (durée + type de contenu, progression, stats) et pied (date + actions) sont
 * composés à partir de sous-composants ; helpers délégués à useLessonCard.
 */
import { useLessonCard } from '@/composables/useLessonCard'
import LessonProgress from './LessonProgress.vue'
import LessonCardBadges from './LessonCardBadges.vue'
import LessonStatsGrid from './LessonStatsGrid.vue'
import LessonCardActions from './LessonCardActions.vue'

defineProps({
  lesson: { type: Object, required: true },
  isTeacher: { type: Boolean, default: false },
  showProgress: { type: Boolean, default: true },
  showStats: { type: Boolean, default: false },
  showStatus: { type: Boolean, default: false }
})

defineEmits(['view', 'edit', 'delete', 'publish', 'unpublish'])

const { getContentTypeIcon, getContentTypeLabel, formatDuration, formatDate } = useLessonCard()
</script>

<style scoped>
/* Card Container */
.lesson-card {
  background: var(--card-bg);
  border-radius: 0.75rem;
  border: 1px solid var(--border-primary);
  box-shadow: var(--card-shadow);
  transition: all 0.2s ease;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.lesson-card:hover {
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
  border-color: #3b82f6;
}

/* Header */
.lesson-card-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-primary);
}

.lesson-card-header-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.lesson-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.4;
}

.lesson-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
}

/* Body */
.lesson-card-body {
  padding: 1.5rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.lesson-info-row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.lesson-info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
  padding: 0.5rem 0.75rem;
  background: var(--bg-primary);
  border-radius: 0.375rem;
  border: 1px solid var(--border-primary);
}

.info-icon {
  font-size: 1rem;
}

.lesson-progress-container {
  margin-top: 0.5rem;
}

/* Footer */
.lesson-card-footer {
  padding: 1rem 1.5rem;
  background: var(--bg-primary);
  border-top: 1px solid var(--border-primary);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.lesson-date {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.date-icon {
  font-size: 0.875rem;
}

/* Responsive */
@media (max-width: 640px) {
  .lesson-card-footer {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
