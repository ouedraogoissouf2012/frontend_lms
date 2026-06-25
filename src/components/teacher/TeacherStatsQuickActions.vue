<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <router-link to="/teacher/dashboard" class="action-card">
      <ChartBarIcon class="action-icon text-blue-600" />
      <h3 class="action-title">Dashboard</h3>
      <p class="action-description">Retour au tableau de bord</p>
    </router-link>

    <router-link to="/teacher/evaluations" class="action-card">
      <DocumentTextIcon class="action-icon text-orange-600" />
      <h3 class="action-title">Évaluations</h3>
      <p class="action-description">Gérer mes évaluations</p>
    </router-link>

    <router-link to="/teacher/classes" class="action-card">
      <UserGroupIcon class="action-icon text-green-600" />
      <h3 class="action-title">Mes Classes</h3>
      <p class="action-description">Consulter mes classes</p>
    </router-link>
  </div>
</template>

<script setup>
/** Actions rapides des statistiques enseignant (#H11 ≤300).
 *  Présentation pure : 3 raccourcis (dashboard, évaluations, classes). */
import { ChartBarIcon, DocumentTextIcon, UserGroupIcon } from '@heroicons/vue/24/outline'
</script>

<style scoped>
/* Action Cards */
.action-card {
  background: var(--card-bg);
  padding: 1.5rem;
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
  text-decoration: none;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.action-card:hover {
  box-shadow: var(--card-hover-shadow);
  transform: translateY(-4px);
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
