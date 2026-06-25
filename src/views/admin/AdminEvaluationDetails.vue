<template>
  <DashboardLayout>
    <div class="evaluation-details-container">
      <!-- Header avec bouton retour -->
      <div class="page-header">
        <button @click="goBack" class="btn-back">
          <ArrowLeftIcon class="w-5 h-5" />
          Retour
        </button>
        <div class="header-content">
          <DocumentTextIcon class="page-icon text-blue-600" />
          <div>
            <h1 class="page-title">{{ evaluation?.titre || 'Résultats Détaillés' }}</h1>
            <p class="page-subtitle">
              {{ evaluation?.matiere?.nom || 'Matière' }} -
              {{ evaluation?.classe?.nom || evaluation?.classe?.libelle || 'Classe' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <ContentLoader v-if="loading" text="Chargement des resultats..." />

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
        <!-- Statistiques globales -->
        <EvaluationStatsCards :statistiques="statistiques" />

        <!-- Informations évaluation -->
        <EvaluationInfoCard :evaluation="evaluation" :format-date="formatDate" />

        <!-- Tableau des résultats -->
        <EvaluationResultsTable
          :resultats="resultats"
          :get-status-class="getStatusClass"
          :get-status-label="getStatusLabel"
          :get-note-class="getNoteClass"
          :format-date-time="formatDateTime"
          @export="exportCSV"
        />

        <!-- Statistiques détaillées -->
        <EvaluationDistributionStats :statistiques="statistiques" />
      </template>
    </div>
  </DashboardLayout>
</template>

<script setup>
/**
 * Résultats détaillés d'une évaluation (admin). Orchestrateur (#H3 ≤300) : la donnée
 * et la logique vivent dans useAdminEvaluationDetails ; l'UI est composée de
 * EvaluationStatsCards, EvaluationInfoCard, EvaluationResultsTable et
 * EvaluationDistributionStats. La vue ne garde que header + états chargement/erreur.
 */
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import {
  DocumentTextIcon,
  ArrowLeftIcon,
  ArrowPathIcon
} from '@heroicons/vue/24/outline'
import EvaluationStatsCards from '@/components/admin/EvaluationStatsCards.vue'
import EvaluationInfoCard from '@/components/admin/EvaluationInfoCard.vue'
import EvaluationResultsTable from '@/components/admin/EvaluationResultsTable.vue'
import EvaluationDistributionStats from '@/components/admin/EvaluationDistributionStats.vue'
import { useAdminEvaluationDetails } from '@/composables/useAdminEvaluationDetails'

const {
  loading, error, evaluation, resultats, statistiques,
  loadData, goBack,
  getStatusClass, getStatusLabel, getNoteClass,
  formatDate, formatDateTime, exportCSV,
} = useAdminEvaluationDetails()
</script>

<style scoped>
.evaluation-details-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.btn-back {
  padding: 0.625rem;
  background: var(--card-bg);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all var(--transition-fast);
}

.btn-back:hover {
  background: var(--hover-bg);
  transform: translateX(-2px);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
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

/* Loading/Error States */
.loading-state,
.error-state {
  padding: 3rem;
  text-align: center;
}

.error-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.error-icon {
  font-size: 3rem;
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
