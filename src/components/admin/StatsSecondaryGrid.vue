<template>
  <div class="stats-grid-secondary">
    <div class="stat-card-small">
      <BookOpenIcon class="stat-card-icon" />
      <div class="stat-card-content">
        <p class="stat-card-label">Leçons créées</p>
        <p class="stat-card-value">{{ formatCount(stats.nb_lessons) }}</p>
      </div>
    </div>

    <div class="stat-card-small">
      <ChatBubbleLeftRightIcon class="stat-card-icon" />
      <div class="stat-card-content">
        <p class="stat-card-label">Discussions actives</p>
        <p class="stat-card-value">{{ formatCount(stats.nb_forum_topics) }}</p>
      </div>
    </div>

    <div class="stat-card-small">
      <ClockIcon class="stat-card-icon" />
      <div class="stat-card-content">
        <p class="stat-card-label">Heures de cours</p>
        <p class="stat-card-value">{{ formatCount(stats.nb_heures_cours) }}</p>
      </div>
    </div>

    <div class="stat-card-small">
      <CheckCircleIcon class="stat-card-icon" />
      <div class="stat-card-content">
        <p class="stat-card-label">Taux de présence</p>
        <p class="stat-card-value">{{ formatCount(stats.taux_presence, { suffix: '%' }) }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Grille secondaire d'AdminStats (#H3 ≤300). Présentation pure : 4 petites cartes
 * (leçons, discussions, heures de cours, taux de présence). Données en prop.
 */
import {
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/vue/24/outline'
import { formatCount } from '@/utils/formatters'

defineProps({
  stats: { type: Object, default: () => ({}) },
})
</script>

<style scoped>
/* Secondary Stats Grid */
.stats-grid-secondary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-lg);
}

.stat-card-small {
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  transition: all 0.2s;
}

.stat-card-small:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-card-icon {
  width: 2.5rem;
  height: 2.5rem;
  color: var(--color-primary);
  flex-shrink: 0;
}

.stat-card-content {
  flex: 1;
}

.stat-card-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
}

.stat-card-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

@media (max-width: 768px) {
  .stats-grid-secondary {
    grid-template-columns: 1fr;
  }

  .stat-card-value {
    font-size: 1.5rem;
  }
}
</style>
