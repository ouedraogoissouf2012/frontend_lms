<template>
  <DashboardLayout>
    <div class="evaluations-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <DocumentTextIcon class="page-icon text-blue-600" />
          <div>
            <h1 class="page-title">Toutes les Évaluations</h1>
            <p class="page-subtitle">Vue globale de toutes les évaluations (tous enseignants)</p>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <ContentLoader v-if="loading" text="Chargement des évaluations..." />

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <div class="error-content">
          <i class="fa fa-exclamation-triangle error-icon"></i>
          <div>
            <h3 class="error-title">Erreur de chargement</h3>
            <p class="error-message">{{ error }}</p>
          </div>
        </div>
        <button @click="loadData" class="btn-retry">
          <ArrowPathIcon class="w-5 h-5" />
          Réessayer
        </button>
      </div>

      <template v-else>
        <!-- Stats Cards -->
        <CoordinatorEvalStats :stats="stats" />

        <!-- Filters Card -->
        <CoordinatorEvalFilters
          v-model:filters="filters"
          :enseignants="enseignants"
          :classes="classes"
          :matieres="matieres"
          @apply="applyFilters"
          @reset="resetFilters"
        />

        <!-- Evaluations List -->
        <div class="evaluations-list">
          <div v-if="filteredEvaluations.length === 0" class="empty-state">
            <DocumentTextIcon class="empty-icon" />
            <p class="empty-text">Aucune évaluation trouvée</p>
          </div>

          <CoordinatorEvalCard
            v-for="evaluation in filteredEvaluations"
            :key="evaluation.id"
            :evaluation="evaluation"
            @view-results="viewResults"
            @view-details="viewDetails"
          />
        </div>
      </template>
    </div>
  </DashboardLayout>
</template>

<script setup>
/**
 * Toutes les évaluations (coordinateur). Orchestrateur (H2 ≤300) : la donnée et
 * la logique vivent dans useCoordinatorEvaluations ; l'UI est composée de
 * CoordinatorEvalStats, CoordinatorEvalFilters et CoordinatorEvalCard.
 */
import { DocumentTextIcon, ArrowPathIcon } from '@heroicons/vue/24/outline'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import CoordinatorEvalStats from '@/components/coordinateur/CoordinatorEvalStats.vue'
import CoordinatorEvalFilters from '@/components/coordinateur/CoordinatorEvalFilters.vue'
import CoordinatorEvalCard from '@/components/coordinateur/CoordinatorEvalCard.vue'
import { useCoordinatorEvaluations } from '@/composables/useCoordinatorEvaluations'

const {
  loading, error, enseignants, classes, matieres, filters,
  filteredEvaluations, stats,
  loadData, applyFilters, resetFilters, viewResults, viewDetails,
} = useCoordinatorEvaluations()
</script>

<style scoped>
.evaluations-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  margin-bottom: 2rem;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.page-icon {
  width: 2.5rem;
  height: 2.5rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.page-subtitle {
  font-size: 1rem;
  color: var(--text-secondary);
  margin: 0.25rem 0 0;
}

/* Evaluations List */
.evaluations-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Empty/Error States */
.empty-state,
.error-state {
  text-align: center;
  padding: 3rem;
}

.empty-icon,
.error-icon {
  width: 4rem;
  height: 4rem;
  color: var(--text-secondary);
  margin: 0 auto 1rem;
  opacity: 0.5;
}

.empty-text {
  color: var(--text-secondary);
  font-size: 1rem;
}

.error-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.error-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--danger);
  margin: 0 0 0.5rem;
}

.error-message {
  color: var(--text-secondary);
  margin: 0;
}

.btn-retry {
  padding: 0.75rem 1.5rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: background var(--transition-fast);
}

.btn-retry:hover {
  background: var(--primary-hover);
}
</style>
