<template>
  <div class="lesson-info-card">
    <div class="lesson-info-header">
      <div>
        <h1 class="lesson-title">{{ lesson.title }}</h1>
        <p v-if="lesson.description" class="lesson-description">{{ lesson.description }}</p>
        <div class="lesson-meta">
          <span v-if="lesson.niveau_difficulte" class="meta-badge" :class="`badge-${lesson.niveau_difficulte}`">
            {{ getNiveauLabel(lesson.niveau_difficulte) }}
          </span>
          <span v-if="lesson.duree_estimee_minutes" class="meta-info">
            ⏱ {{ lesson.duree_estimee_minutes }} min
          </span>
          <span class="meta-info status-badge" :class="lesson.status === 'published' ? 'status-published' : 'status-draft'">
            <i :class="lesson.status === 'published' ? 'fa fa-check' : 'fa fa-pencil'"></i>
            {{ lesson.status === 'published' ? 'Publiee' : 'Brouillon' }}
          </span>
        </div>
      </div>
      <div v-if="lesson.status === 'draft' && !isReadOnly" class="lesson-actions">
        <button
          @click="$emit('preview')"
          class="btn-preview"
        >
          <i class="fa fa-eye"></i> Previsualiser
        </button>
        <button
          @click="$emit('publish')"
          class="btn-publish"
          :disabled="publishing"
        >
          {{ publishing ? 'Publication...' : 'Publier la leçon' }}
        </button>
      </div>
    </div>

    <!-- Prerequisites -->
    <div v-if="lesson.prerequis" class="lesson-section">
      <h3 class="section-title"><i class="fa fa-list-ul"></i> Prérequis</h3>
      <p class="section-content">{{ lesson.prerequis }}</p>
    </div>

    <!-- Objectifs -->
    <div v-if="lesson.objectifs_pedagogiques" class="lesson-section">
      <h3 class="section-title"><i class="fa fa-bullseye"></i> Objectifs pédagogiques</h3>
      <p class="section-content">{{ lesson.objectifs_pedagogiques }}</p>
    </div>
  </div>
</template>

<script setup>
/**
 * Carte d'information d'une leçon (#H4 ≤300) : titre, description, méta (niveau,
 * durée, status), actions brouillon (prévisualiser/publier) et sections prérequis/
 * objectifs. Présentationnel ; actions relayées via emit (preview/publish).
 */
defineProps({
  lesson: { type: Object, required: true },
  isReadOnly: { type: Boolean, default: false },
  publishing: { type: Boolean, default: false }
})

defineEmits(['preview', 'publish'])

function getNiveauLabel(niveau) {
  const labels = {
    debutant: 'Débutant',
    intermediaire: 'Intermédiaire',
    avance: 'Avancé'
  }
  return labels[niveau] || niveau
}
</script>

<style scoped>
/* Lesson info card */
.lesson-info-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--card-shadow);
  margin-bottom: 24px;
}

.lesson-info-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--border-color);
}

.lesson-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.lesson-description {
  font-size: 1rem;
  color: var(--text-secondary);
  margin: 0 0 12px 0;
}

.lesson-meta {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.meta-badge {
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-debutant {
  background-color: rgba(59, 130, 246, 0.1);
  color: var(--blue-500);
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.badge-intermediaire {
  background-color: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.badge-avance {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.meta-info {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-badge i {
  font-size: 0.7rem;
}

.status-published {
  background-color: rgba(16, 185, 129, 0.15);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.status-draft {
  background-color: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.lesson-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.btn-preview {
  padding: 10px 20px;
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-preview:hover {
  background-color: var(--hover-bg);
  border-color: var(--border-hover);
}

.btn-publish {
  padding: 10px 20px;
  background-color: var(--color-primary, #10b981);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-publish:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-publish:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Lesson sections */
.lesson-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.section-content {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.6;
  white-space: pre-wrap;
}

/* Responsive */
@media (max-width: 768px) {
  .lesson-info-header {
    flex-direction: column;
  }

  .lesson-actions {
    width: 100%;
    flex-direction: column;
  }

  .btn-preview,
  .btn-publish {
    width: 100%;
  }

  .lesson-title {
    font-size: 1.5rem;
  }
}
</style>
