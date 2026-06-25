<template>
  <div class="eval-info-card">
    <div class="info-grid">
      <div class="info-item">
        <BookOpenIcon class="info-icon" />
        <div>
          <p class="info-label">Matière</p>
          <p class="info-value">{{ evaluation.matiere?.nom || 'Non définie' }}</p>
        </div>
      </div>
      <div class="info-item">
        <UserGroupIcon class="info-icon" />
        <div>
          <p class="info-label">Classe</p>
          <p class="info-value">{{ evaluation.classe?.nom || evaluation.classe?.libelle || 'Non définie' }}</p>
        </div>
      </div>
      <div class="info-item">
        <CalendarIcon class="info-icon" />
        <div>
          <p class="info-label">Date</p>
          <p class="info-value">{{ formatDate(evaluation.date_evaluation) }}</p>
        </div>
      </div>
      <div class="info-item">
        <ClockIcon class="info-icon" />
        <div>
          <p class="info-label">Coefficient / Barème</p>
          <p class="info-value">{{ evaluation.coefficient || 1 }} - {{ evaluation.bareme || 20 }}/20</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Carte d'informations de l'évaluation (corrections enseignant, H2 ≤300) :
 * matière / classe / date / coefficient. Section présentationnelle extraite
 * verbatim. Reçoit l'évaluation en prop ; format de date via utils (pur).
 */
import { BookOpenIcon, UserGroupIcon, CalendarIcon, ClockIcon } from '@heroicons/vue/24/outline'
import { formatDate } from '@/utils/evaluationCorrectionsFormat'

defineProps({
  evaluation: { type: Object, required: true }
})
</script>

<style scoped>
.eval-info-card {
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.info-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--primary-color);
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.info-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0 0 0.25rem 0;
}

.info-value {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
