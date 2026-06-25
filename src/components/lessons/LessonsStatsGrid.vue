<template>
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-header">
        <BookOpenIcon class="stat-icon text-blue-600" />
        <span class="stat-label">Total</span>
      </div>
      <p class="stat-value">{{ stats.total }}</p>
    </div>

    <div class="stat-card">
      <div class="stat-header">
        <CheckCircleIcon class="stat-icon text-green-600" />
        <span class="stat-label">Publiées</span>
      </div>
      <p class="stat-value">{{ stats.published }}</p>
    </div>

    <div class="stat-card">
      <div class="stat-header">
        <DocumentTextIcon class="stat-icon text-orange-600" />
        <span class="stat-label">Brouillons</span>
      </div>
      <p class="stat-value">{{ stats.draft }}</p>
    </div>

    <div class="stat-card">
      <div class="stat-header">
        <ArchiveBoxIcon class="stat-icon text-gray-600" />
        <span class="stat-label">Archivées</span>
      </div>
      <p class="stat-value">{{ stats.archived }}</p>
    </div>
  </div>
</template>

<script setup>
/**
 * Cartes statistiques des leçons enseignant (#H4 ≤300) : total / publiées /
 * brouillons / archivées. Présentationnel, données via la prop `stats`.
 */
import {
  BookOpenIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  ArchiveBoxIcon
} from '@heroicons/vue/24/outline'

defineProps({
  stats: { type: Object, required: true }
})
</script>

<style scoped>
/* Statistiques */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
  padding: 1.5rem;
  transition: all 0.2s;
}

.stat-card:hover {
  box-shadow: var(--card-hover-shadow);
  transform: translateY(-2px);
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.stat-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
