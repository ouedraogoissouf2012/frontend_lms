<template>
  <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
    <div class="stat-card border-l-blue">
      <div class="stat-header">
        <UserGroupIcon class="stat-icon text-blue-600" />
        <p class="stat-label">Enseignants</p>
      </div>
      <p class="stat-value text-blue-600">
        {{ nbEnseignants }}
      </p>
    </div>

    <div class="stat-card border-l-green">
      <div class="stat-header">
        <AcademicCapIcon class="stat-icon text-green-600" />
        <p class="stat-label">Étudiants</p>
      </div>
      <p class="stat-value text-green-600">
        {{ nbEtudiants }}
      </p>
    </div>

    <div class="stat-card border-l-purple">
      <div class="stat-header">
        <BuildingLibraryIcon class="stat-icon text-purple-600" />
        <p class="stat-label">Classes actives</p>
      </div>
      <p class="stat-value text-purple-600">
        {{ nbClasses }}
      </p>
    </div>

    <div class="stat-card border-l-orange">
      <div class="stat-header">
        <BookOpenIcon class="stat-icon text-orange-600" />
        <p class="stat-label">Matières</p>
      </div>
      <p class="stat-value text-orange-600">
        {{ nbMatieres }}
      </p>
    </div>
  </div>
</template>

<script setup>
/** Cartes KPI d'AdminDashboard (#H3 ≤300). Présentation : 4 compteurs animés
 *  (count-up) qui respectent le mouvement réduit. */
import { computed } from 'vue'
import {
  UserGroupIcon,
  AcademicCapIcon,
  BuildingLibraryIcon,
  BookOpenIcon
} from '@heroicons/vue/24/outline'
import { useCountUp } from '@/composables/useCountUp'

const props = defineProps({
  stats: { type: Object, default: () => ({}) },
})

/** Compteur animé (arrondi) pour un getter numérique. */
function counter(getter) {
  const { value } = useCountUp(getter)
  return computed(() => Math.round(value.value))
}

const nbEnseignants = counter(() => Number(props.stats?.nb_enseignants) || 0)
const nbEtudiants = counter(() => Number(props.stats?.nb_etudiants) || 0)
const nbClasses = counter(() => Number(props.stats?.nb_classes_actives) || 0)
const nbMatieres = counter(() => Number(props.stats?.nb_matieres_actives) || 0)
</script>

<style scoped>
/* Stat cards */
.stat-card {
  background: var(--bg-primary);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-left: 4px solid transparent;
  transition:
    transform var(--motion-base) var(--motion-spring),
    box-shadow var(--motion-base) var(--motion-spring);
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--card-hover-shadow);
}

.stat-icon {
  transition: transform var(--motion-base) var(--motion-spring);
}

.stat-card:hover .stat-icon {
  transform: scale(1.12);
}

@media (prefers-reduced-motion: reduce) {
  .stat-card,
  .stat-icon {
    transition: none;
  }

  .stat-card:hover {
    transform: none;
  }
}

.border-l-blue {
  border-left-color: var(--blue-500);
}

.border-l-green {
  border-left-color: var(--emerald-500);
}

.border-l-purple {
  border-left-color: var(--violet-500);
}

.border-l-orange {
  border-left-color: var(--amber-500);
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
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
}

@media (max-width: 768px) {
  .stat-value {
    font-size: 1.75rem;
  }
}
</style>
