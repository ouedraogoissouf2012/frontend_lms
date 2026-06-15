<template>
  <div class="lesson-card">
    <!-- Header avec badge type -->
    <div class="lesson-card-header">
      <div class="lesson-card-header-content">
        <div class="lesson-badges">
          <span :class="`badge-${lesson.type}`" class="lesson-badge">
            <i :class="`fa ${getTypeIcon(lesson.type)}`"></i> {{ typeBadge.text }}
          </span>
          <span v-if="showStatus" :class="`badge-status-${lesson.status}`" class="lesson-badge">
            <i :class="`fa ${getStatusIcon(lesson.status)}`"></i> {{ statusBadge.text }}
          </span>
        </div>
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
      <div v-if="showStats && lesson.statistics" class="lesson-stats">
        <div class="stat-item stat-started">
          <div class="stat-value">{{ lesson.statistics.students_started }}</div>
          <div class="stat-label">Débutés</div>
        </div>
        <div class="stat-item stat-completed">
          <div class="stat-value">{{ lesson.statistics.students_completed }}</div>
          <div class="stat-label">Terminés</div>
        </div>
        <div class="stat-item stat-average">
          <div class="stat-value">{{ lesson.statistics.average_completion_rate }}%</div>
          <div class="stat-label">Moyenne</div>
        </div>
      </div>
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
      <div class="lesson-actions">
        <!-- Enseignant: actions CRUD -->
        <template v-if="isTeacher">
          <button
            v-if="lesson.status === 'draft'"
            @click.stop="$emit('publish', lesson.id)"
            class="btn-action btn-publish"
          >
            <i class="fa fa-check"></i> Publier
          </button>
          <button
            v-else-if="lesson.status === 'published'"
            @click.stop="$emit('unpublish', lesson.id)"
            class="btn-action btn-unpublish"
          >
            <i class="fa fa-times"></i> Dépublier
          </button>
          <button
            @click.stop="$emit('edit', lesson.id)"
            class="btn-action btn-edit"
          >
            <i class="fa fa-pencil"></i> Modifier
          </button>
          <button
            @click.stop="$emit('delete', lesson.id)"
            class="btn-action btn-delete"
          >
            <i class="fa fa-trash-o"></i> Supprimer
          </button>
        </template>

        <!-- Étudiant/Tous: bouton consulter -->
        <button
          @click.stop="$emit('view', lesson.id)"
          class="btn-primary"
        >
          {{ isTeacher ? '▶ Détails' : '▶ Consulter' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import lessonService from '@/services/lesson'
import { formatDateShort } from '@/utils/formatters'
import LessonProgress from './LessonProgress.vue'

export default {
  name: 'LessonCard',
  components: {
    LessonProgress
  },
  props: {
    lesson: {
      type: Object,
      required: true
    },
    isTeacher: {
      type: Boolean,
      default: false
    },
    showProgress: {
      type: Boolean,
      default: true
    },
    showStats: {
      type: Boolean,
      default: false
    },
    showStatus: {
      type: Boolean,
      default: false
    }
  },
  emits: ['view', 'edit', 'delete', 'publish', 'unpublish'],
  computed: {
    typeBadge() {
      return lessonService.getTypeBadge(this.lesson.type)
    },
    statusBadge() {
      return lessonService.getStatusBadge(this.lesson.status)
    }
  },
  methods: {
    formatDuration(minutes) {
      return lessonService.formatDuration(minutes)
    },
    formatDate(dateString) {
      return formatDateShort(dateString, { fallback: 'N/A' })
    },
    getTypeIcon(type) {
      const icons = {
        cours: 'fa-book',
        tp: 'fa-laptop',
        td: 'fa-pencil',
        projet: 'fa-rocket',
        autre: 'fa-file-text-o'
      }
      return icons[type] || 'fa-question-circle'
    },
    getStatusIcon(status) {
      const icons = {
        draft: 'fa-pencil',
        published: 'fa-check',
        archived: 'fa-archive'
      }
      return icons[status] || 'fa-circle'
    },
    getContentTypeIcon(type) {
      const icons = {
        text: 'fa-pencil-square-o',
        video: 'fa-video-camera',
        pdf: 'fa-file-pdf-o',
        audio: 'fa-music',
        presentation: 'fa-bar-chart',
        link: 'fa-link',
        mixed: 'fa-book'
      }
      return icons[type] || 'fa-file-o'
    },
    getContentTypeLabel(type) {
      const labels = {
        text: 'Texte',
        video: 'Vidéo',
        pdf: 'PDF',
        audio: 'Audio',
        presentation: 'Présentation',
        link: 'Lien',
        mixed: 'Mixte'
      }
      return labels[type] || 'Inconnu'
    }
  }
}
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

.lesson-badges {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.lesson-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

/* Badges par type */
.badge-cours {
  background: #dbeafe;
  color: #1e40af;
}

.badge-tp {
  background: #e9d5ff;
  color: #7c3aed;
}

.badge-td {
  background: #ddd6fe;
  color: #6366f1;
}

.badge-projet {
  background: #fce7f3;
  color: #be123c;
}

.badge-autre {
  background: var(--border-primary);
  color: var(--text-secondary);
}

/* Badges par status */
.badge-status-draft {
  background: #fef3c7;
  color: #92400e;
}

.badge-status-published {
  background: #d1fae5;
  color: #065f46;
}

.badge-status-archived {
  background: #fee2e2;
  color: #991b1b;
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

/* Stats */
.lesson-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.stat-item {
  padding: 1rem;
  border-radius: 0.5rem;
  text-align: center;
}

.stat-started {
  background: #dbeafe;
}

.stat-completed {
  background: #d1fae5;
}

.stat-average {
  background: #e9d5ff;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
}

.stat-started .stat-value {
  color: #1e40af;
}

.stat-completed .stat-value {
  color: #065f46;
}

.stat-average .stat-value {
  color: #7c3aed;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
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

.lesson-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

/* Buttons */
.btn-action,
.btn-primary {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-action {
  background: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
}

.btn-action:hover {
  background: var(--border-primary);
}

.btn-publish {
  color: #059669;
  border-color: #059669;
}

.btn-publish:hover {
  background: #d1fae5;
}

.btn-unpublish {
  color: #d97706;
  border-color: #d97706;
}

.btn-unpublish:hover {
  background: #fef3c7;
}

.btn-edit {
  color: #3b82f6;
  border-color: #3b82f6;
}

.btn-edit:hover {
  background: #dbeafe;
}

.btn-delete {
  color: #dc2626;
  border-color: #dc2626;
}

.btn-delete:hover {
  background: #fee2e2;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  transform: translateY(-1px);
}

/* Responsive */
@media (max-width: 640px) {
  .lesson-card-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .lesson-actions {
    flex-direction: column;
  }

  .lesson-stats {
    grid-template-columns: 1fr;
  }
}
</style>
