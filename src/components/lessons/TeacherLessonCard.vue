<template>
  <div class="lesson-card">
    <div class="lesson-header">
      <div class="lesson-type-icon">
        <VideoCameraIcon v-if="lesson.content_type === 'video'" class="w-6 h-6 text-purple-600" />
        <DocumentTextIcon v-else-if="lesson.content_type === 'pdf' || lesson.content_type === 'document'" class="w-6 h-6 text-blue-600" />
        <AcademicCapIcon v-else class="w-6 h-6 text-green-600" />
      </div>
      <div class="lesson-badges">
        <span :class="getStatusClass(lesson.status)" class="status-badge">
          {{ getStatusLabel(lesson.status) }}
        </span>
      </div>
    </div>

    <h3 class="lesson-title">{{ lesson.title || lesson.titre || 'Sans titre' }}</h3>

    <div class="lesson-matiere">
      <BookOpenIcon class="w-4 h-4" />
      <span>{{ getMatiereLabel(lesson.matiere_id) }}</span>
    </div>

    <div class="lesson-meta">
      <div class="meta-item">
        <CalendarIcon class="w-4 h-4" />
        <span>{{ formatDate(lesson.created_at) }}</span>
      </div>
      <div class="meta-item">
        <EyeIcon class="w-4 h-4" />
        <span>{{ lesson.views || 0 }} vues</span>
      </div>
    </div>

    <div class="lesson-actions">
      <button @click="$emit('view', lesson)" class="btn-action btn-view">
        <BookOpenIcon class="w-4 h-4" />
        Voir les chapitres
      </button>
    </div>
  </div>
</template>

<script setup>
/**
 * Carte d'une leçon enseignant (#H4 ≤300) : icône type, statut, titre, matière,
 * méta (date/vues) et action « Voir les chapitres » (emit `view`). Présentationnel ;
 * libellé matière résolu via la prop `matieres`, helpers statut/date locaux (parité).
 */
import {
  BookOpenIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  AcademicCapIcon,
  CalendarIcon,
  EyeIcon
} from '@heroicons/vue/24/outline'

const props = defineProps({
  lesson: { type: Object, required: true },
  matieres: { type: Array, default: () => [] }
})

defineEmits(['view'])

function getStatusClass(status) {
  const classes = {
    published: 'status-published',
    draft: 'status-draft',
    archived: 'status-archived'
  }
  return classes[status] || 'status-draft'
}

function getStatusLabel(status) {
  const labels = {
    published: 'Publiée',
    draft: 'Brouillon',
    archived: 'Archivée'
  }
  return labels[status] || 'Brouillon'
}

function getMatiereLabel(matiereId) {
  const matiere = props.matieres.find(m => m.id == matiereId)
  return matiere ? (matiere.name || matiere.nom) : 'Matière inconnue'
}

function formatDate(dateString) {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>

<style scoped>
.lesson-card {
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
  padding: 1.5rem;
  transition: all 0.2s;
}

.lesson-card:hover {
  box-shadow: var(--card-hover-shadow);
  transform: translateY(-2px);
}

.lesson-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 1rem;
}

.lesson-type-icon {
  width: 3rem;
  height: 3rem;
  background: var(--bg-secondary);
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lesson-badges {
  display: flex;
  gap: 0.5rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-published {
  background: var(--success-bg);
  color: var(--green-700);
}

.status-draft {
  background: var(--warning-bg);
  color: var(--amber-800);
}

.status-archived {
  background: var(--gray-100);
  color: var(--gray-500);
}

.lesson-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 1rem 0;
  line-height: 1.4;
}

.lesson-matiere {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.lesson-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-primary);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.lesson-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.btn-action {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-view {  background: linear-gradient(135deg, var(--blue-500) 0%, var(--color-info-strong) 100%);  color: white;  border: none;}.btn-view:hover {  background: linear-gradient(135deg, var(--color-info-strong) 0%, var(--color-info-stronger) 100%);  transform: translateY(-2px);  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);}

.btn-edit:hover {
  background: var(--bg-tertiary);
}
</style>
