<template>
  <div class="quick-stats">
    <h3 class="section-title">Apercu rapide</h3>
    <div class="stats-grid">
      <div class="stat-card">
        <CalendarIcon class="stat-icon text-blue-500" />
        <div>
          <p class="stat-value">{{ stats.seancesAVenir }}</p>
          <p class="stat-label">Seances a venir</p>
        </div>
      </div>
      <div class="stat-card">
        <ClipboardDocumentCheckIcon class="stat-icon text-orange-500" />
        <div>
          <p class="stat-value">{{ stats.evaluations }}</p>
          <p class="stat-label">Evaluations actives</p>
        </div>
      </div>
      <div class="stat-card">
        <UsersIcon class="stat-icon text-green-500" />
        <div>
          <p class="stat-value">{{ stats.etudiants }}</p>
          <p class="stat-label">Etudiants total</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/** Aperçu rapide du hub enseignant (#H11 ≤300). Présentation pure :
 *  3 compteurs (séances à venir, évaluations actives, étudiants). */
import { CalendarIcon, ClipboardDocumentCheckIcon, UsersIcon } from '@heroicons/vue/24/outline'

defineProps({
  stats: { type: Object, required: true }
})
</script>

<style scoped>
/* Quick Stats Section */
.quick-stats {
  margin-top: 1rem;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 1rem 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.stat-card {
  background: var(--card-bg);
  border-radius: 0.75rem;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: var(--card-shadow);
}

.stat-icon {
  width: 2.5rem;
  height: 2.5rem;
  flex-shrink: 0;
}

.stat-card .stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.stat-card .stat-label {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  margin: 0;
}

/* Responsive */
@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}

/* Text color utilities */
.text-blue-500 {
  color: var(--blue-500);
}

.text-orange-500 {
  color: var(--amber-500);
}

.text-green-500 {
  color: var(--emerald-500);
}
</style>
