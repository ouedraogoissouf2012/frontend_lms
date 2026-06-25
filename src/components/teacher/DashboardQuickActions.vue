<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
    <router-link
      to="/teacher/lessons"
      class="action-card"
    >
      <BookOpenIcon class="action-icon text-blue-600" />
      <h3 class="action-title">Gérer mes Leçons</h3>
      <p class="action-description">Créer et modifier les cours</p>
    </router-link>

    <router-link
      to="/teacher/evaluations"
      class="action-card"
    >
      <DocumentTextIcon class="action-icon text-orange-600" />
      <h3 class="action-title">Mes Évaluations</h3>
      <p class="action-description">Gérer les évaluations en ligne</p>
    </router-link>

    <router-link
      to="/teacher/seances"
      class="action-card"
    >
      <CalendarIcon class="action-icon text-purple-600" />
      <h3 class="action-title">Mes Séances</h3>
      <p class="action-description">Gérer les séances de cours</p>
    </router-link>

    <router-link
      to="/teacher/stats"
      class="action-card"
    >
      <ChartBarIcon class="action-icon text-green-600" />
      <h3 class="action-title">Statistiques</h3>
      <p class="action-description">Voir mes performances</p>
    </router-link>
  </div>
</template>

<script setup>
/** Actions rapides du dashboard enseignant (#H11 ≤300).
 *  Présentation pure : 4 raccourcis (leçons, évaluations, séances, stats). */
import { BookOpenIcon, DocumentTextIcon, CalendarIcon, ChartBarIcon } from '@heroicons/vue/24/outline'
</script>

<style scoped>
/* Action card */
.action-card {
  background: var(--bg-primary);
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-decoration: none;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.action-icon {
  width: 3rem;
  height: 3rem;
  margin-bottom: 1rem;
}

.action-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.action-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
}
</style>
