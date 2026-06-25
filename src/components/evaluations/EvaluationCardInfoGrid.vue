<template>
  <div class="eval-info-grid">
    <div class="info-item">
      <BookOpenIcon class="info-icon" />
      <div>
        <p class="info-label">Matière</p>
        <p class="info-value">
          {{ evaluation.matiere?.nom || evaluation.matiere?.name || 'Non définie' }}
        </p>
      </div>
    </div>

    <div class="info-item">
      <UserGroupIcon class="info-icon" />
      <div>
        <p class="info-label">Classe</p>
        <p class="info-value">
          {{ evaluation.classe?.nom || evaluation.classe?.name || evaluation.classe?.libelle || 'Non définie' }}
        </p>
      </div>
    </div>

    <div class="info-item">
      <CalendarIcon class="info-icon" />
      <div>
        <p class="info-label">Date</p>
        <p class="info-value">
          {{ formatDate(evaluation.programmation?.date_evaluation || evaluation.date_evaluation) }}
        </p>
      </div>
    </div>

    <div class="info-item">
      <ClockIcon class="info-icon" />
      <div>
        <p class="info-label">Coefficient / Barème</p>
        <p class="info-value">
          {{ evaluation.programmation?.coefficient || evaluation.coefficient || 1 }} -
          {{ evaluation.programmation?.bareme || evaluation.bareme || 20 }}/20
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Grille d'informations d'EvaluationCard (H2 ≤300) : matière, classe, date,
 * coefficient/barème. Section présentationnelle extraite verbatim. Prop seule.
 */
import {
  BookOpenIcon,
  UserGroupIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/vue/24/outline'

defineProps({
  evaluation: { type: Object, required: true }
})

// Format date (identique à l'ex-vue ; migration vers formatDateTime = dette #23).
function formatDate(date) {
  if (!date) return 'Non définie'
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.eval-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.info-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--text-secondary);
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.info-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0 0 0.25rem 0;
}

.info-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}
</style>
