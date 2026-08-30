<template>
  <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
    <div class="stat-card">
      <div class="stat-header">
        <BookOpenIcon class="stat-icon text-blue-600" />
        <p class="stat-label">Matières Enseignées</p>
      </div>
      <p class="stat-value text-blue-600">
        {{ nbMatieres }}
      </p>
    </div>

    <div class="stat-card">
      <div class="stat-header">
        <UserGroupIcon class="stat-icon text-green-600" />
        <p class="stat-label">Classes</p>
      </div>
      <p class="stat-value text-green-600">
        {{ nbClasses }}
      </p>
    </div>

    <div class="stat-card">
      <div class="stat-header">
        <DocumentTextIcon class="stat-icon text-orange-600" />
        <p class="stat-label">Évaluations</p>
      </div>
      <p class="stat-value text-orange-600">
        {{ nbEvaluations }}
      </p>
    </div>

    <div class="stat-card">
      <div class="stat-header">
        <CalendarIcon class="stat-icon text-purple-600" />
        <p class="stat-label">Séances à venir</p>
      </div>
      <p class="stat-value text-purple-600">
        {{ nbSeances }}
      </p>
    </div>
  </div>
</template>

<script setup>
/** Cartes de statistiques principales du dashboard enseignant (#H11 ≤300).
 *  Présentation : 4 compteurs animés (count-up) qui respectent le mouvement réduit. */
import { computed } from 'vue'
import { BookOpenIcon, UserGroupIcon, DocumentTextIcon, CalendarIcon } from '@heroicons/vue/24/outline'
import { useCountUp } from '@/composables/useCountUp'

const props = defineProps({
  dashboardData: { type: Object, required: true }
})

/** Compteur animé (arrondi) pour un getter numérique. */
function counter(getter) {
  const { value } = useCountUp(getter)
  return computed(() => Math.round(value.value))
}

const nbMatieres = counter(() => Number(props.dashboardData?.matieres?.length) || 0)
const nbClasses = counter(() => Number(props.dashboardData?.classes?.length) || 0)
const nbEvaluations = counter(() => Number(props.dashboardData?.evaluations?.length) || 0)
const nbSeances = counter(() => Number(props.dashboardData?.seances?.length) || 0)
</script>

<style scoped>
/* Stat cards */
.stat-card {
  background: var(--bg-primary);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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
