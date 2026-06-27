<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
    <!-- Gestion Cours - Uniquement pour enseignants et superAdmin -->
    <router-link
      v-if="isTeacher || isSuperAdmin"
      to="/teacher/lessons"
      class="action-card"
    >
      <BookOpenIcon class="action-icon text-blue-600" />
      <h3 class="action-title">Gestion Cours LMS</h3>
      <p class="action-description">Créer et gérer le contenu pédagogique</p>
    </router-link>

    <!-- Quiz & Evaluations - Uniquement pour enseignants et superAdmin -->
    <router-link
      v-if="isTeacher || isSuperAdmin"
      to="/teacher/evaluations"
      class="action-card"
    >
      <DocumentTextIcon class="action-icon text-green-600" />
      <h3 class="action-title">Quiz & Évaluations LMS</h3>
      <p class="action-description">Créer et gérer les quiz en ligne</p>
    </router-link>

    <!-- Gestion Séances & Visio - Pour coordinateurs et superAdmin -->
    <router-link
      v-if="isCoordinateur || isSuperAdmin"
      to="/coordinateur/seances"
      class="action-card highlighted"
    >
      <CalendarIcon class="action-icon text-orange-600" />
      <h3 class="action-title">Gestion Séances & Visio</h3>
      <p class="action-description">Activer/désactiver les visioconférences (séances de KLASSCI)</p>
    </router-link>
  </div>
</template>

<script setup>
/**
 * Cartes d'actions admin conditionnelles selon le rôle d'AdminDashboard (#H3 ≤300).
 * Présentation pure : les prédicats de rôle sont passés en props booléennes.
 */
import {
  BookOpenIcon,
  DocumentTextIcon,
  CalendarIcon
} from '@heroicons/vue/24/outline'

defineProps({
  isTeacher: { type: Boolean, default: false },
  isCoordinateur: { type: Boolean, default: false },
  isSuperAdmin: { type: Boolean, default: false },
})
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

.action-card.highlighted {
  border: 2px solid var(--amber-500);
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
