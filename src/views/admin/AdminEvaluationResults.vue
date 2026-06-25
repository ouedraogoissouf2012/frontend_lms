<template>
  <DashboardLayout>
    <div class="evaluations-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <DocumentTextIcon class="page-icon text-blue-600" />
          <div>
            <h1 class="page-title">Résultats des Évaluations</h1>
            <p class="page-subtitle">Consultez les résultats détaillés par classe et évaluation</p>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <ContentLoader v-if="loading" text="Chargement des evaluations..." />

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
        <EvalResultsStatsCards :stats="stats" />

        <!-- Filters Card -->
        <EvalResultsFilters
          v-model:enseignant-id="filters.enseignant_id"
          v-model:classe-id="filters.classe_id"
          v-model:matiere-id="filters.matiere_id"
          v-model:statut="filters.statut"
          :enseignants="enseignants"
          :classes="classes"
          :matieres="matieres"
          @reset="resetFilters"
        />

        <!-- Evaluations List -->
        <EvalResultsList
          :evaluations="filteredEvaluations"
          :is-coordinateur="isCoordinateur"
          :get-status-class="getStatusClass"
          :get-status-label="getStatusLabel"
          :is-evaluation-terminee="isEvaluationTerminee"
          :format-date="formatDate"
          @view-results="viewResults"
          @view-details="viewDetails"
        />
      </template>
    </div>
  </DashboardLayout>
</template>

<script setup>
/**
 * Résultats des évaluations (admin/coordinateur). Orchestrateur (#H3 ≤300) : la
 * donnée et la logique vivent dans useAdminEvaluationResults ; l'UI est composée
 * de EvalResultsStatsCards, EvalResultsFilters et EvalResultsList.
 */
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import { DocumentTextIcon, ArrowPathIcon } from '@heroicons/vue/24/outline'
import EvalResultsStatsCards from '@/components/admin/EvalResultsStatsCards.vue'
import EvalResultsFilters from '@/components/admin/EvalResultsFilters.vue'
import EvalResultsList from '@/components/admin/EvalResultsList.vue'
import { useAdminEvaluationResults } from '@/composables/useAdminEvaluationResults'

const {
  isCoordinateur,
  loading, error, enseignants, classes, matieres,
  filters, filteredEvaluations, stats,
  loadData, resetFilters, viewResults, viewDetails,
  getStatusClass, getStatusLabel, isEvaluationTerminee, formatDate,
} = useAdminEvaluationResults()
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

/* Error State */
.error-state {
  text-align: center;
  padding: 3rem;
}

.error-icon {
  width: 4rem;
  height: 4rem;
  color: var(--text-secondary);
  margin: 0 auto 1rem;
  opacity: 0.5;
}

.loading-state {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
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
