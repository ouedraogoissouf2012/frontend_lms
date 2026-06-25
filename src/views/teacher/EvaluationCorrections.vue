<template>
  <DashboardLayout>
    <div class="corrections-container">
      <!-- Header avec retour -->
      <div class="page-header">
        <button @click="goBack" class="btn-back">
          <ArrowLeftIcon class="w-5 h-5" />
          Retour
        </button>
        <div class="header-content">
          <div class="header-info">
            <DocumentTextIcon class="page-icon" />
            <div>
              <h1 class="page-title">Notes et Résultats</h1>
              <p v-if="evaluation" class="page-subtitle">{{ evaluation.titre }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <ContentLoader v-if="loading" text="Chargement des résultats..." />

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <div class="error-content">
          <i class="fa fa-exclamation-triangle error-icon"></i>
          <div>
            <h3 class="error-title">Erreur de chargement</h3>
            <p class="error-message">{{ error }}</p>
          </div>
        </div>
        <button @click="loadResults" class="btn-retry">
          <ArrowPathIcon class="w-5 h-5" />
          Réessayer
        </button>
      </div>

      <template v-else-if="evaluation">
        <!-- Informations de l'évaluation -->
        <CorrectionEvalInfo :evaluation="evaluation" />

        <!-- Statistiques -->
        <CorrectionStats :statistiques="statistiques" />

        <!-- Liste des résultats -->
        <CorrectionResultsTable :resultats="resultats" @export="exportToExcel" />
      </template>
    </div>
  </DashboardLayout>
</template>

<script setup>
/**
 * Notes et résultats d'une évaluation (enseignant). Orchestrateur (H2 ≤300) : la
 * donnée et la logique vivent dans useEvaluationCorrections ; l'UI est composée de
 * CorrectionEvalInfo, CorrectionStats et CorrectionResultsTable.
 */
import { ArrowLeftIcon, DocumentTextIcon, ArrowPathIcon } from '@heroicons/vue/24/outline'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import CorrectionEvalInfo from '@/components/evaluations/CorrectionEvalInfo.vue'
import CorrectionStats from '@/components/evaluations/CorrectionStats.vue'
import CorrectionResultsTable from '@/components/evaluations/CorrectionResultsTable.vue'
import { useEvaluationCorrections } from '@/composables/useEvaluationCorrections'

const {
  loading, error, evaluation, resultats, statistiques,
  loadResults, goBack, exportToExcel,
} = useEvaluationCorrections()
</script>

<style scoped>
.corrections-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0;
}

/* Header */
.page-header {
  margin-bottom: 2rem;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 1rem;
}

.btn-back:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.page-icon {
  width: 2.5rem;
  height: 2.5rem;
  color: var(--primary-color);
  flex-shrink: 0;
}

.page-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.page-subtitle {
  font-size: 1rem;
  color: var(--text-secondary);
  margin: 0.25rem 0 0 0;
}

/* Error State */
.error-state {
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 0.75rem;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 2rem;
}

.error-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.error-icon {
  font-size: 2rem;
  line-height: 1;
}

.error-title {
  font-size: 1rem;
  font-weight: 600;
  color: #c00;
  margin: 0 0 0.25rem 0;
}

.error-message {
  font-size: 0.875rem;
  color: #900;
  margin: 0;
}

.btn-retry {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-retry:hover {
  background: #b91c1c;
}

/* Responsive */
@media (max-width: 768px) {
  .corrections-container {
    padding: 0;
  }

  .page-title {
    font-size: 1.5rem;
  }
}
</style>
