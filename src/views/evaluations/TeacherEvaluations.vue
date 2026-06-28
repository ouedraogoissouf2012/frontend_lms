<template>
  <DashboardLayout>
    <div class="evaluations-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <DocumentTextIcon class="page-icon text-blue-600" />
          <div>
            <h1 class="page-title">Évaluations</h1>
            <p class="page-subtitle">Gérez les évaluations en ligne de vos classes</p>
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
        <!-- Filters Card -->
        <TeacherEvalFilters
          :filters="filters"
          :classes="classes"
          :matieres="matieres"
          :expired-without-online-count="expiredWithoutOnlineCount"
          v-model:hide-expired="hideExpired"
          @apply="applyFilters"
          @reset="resetFilters"
        />

        <!-- Statistics -->
        <TeacherEvalStats :stats="stats" />

        <!-- Evaluations List -->
        <div v-if="filteredEvaluations.length > 0" class="evaluations-list">
          <EvaluationCard
            v-for="evaluation in filteredEvaluations"
            :key="evaluation.id"
            :evaluation="evaluation"
            :syncing="syncing"
            @create="createOnlineVersion"
            @edit="editOnlineVersion"
            @view-results="viewResults"
            @publish="publishEvaluation"
            @preview="previewEvaluation"
            @sync="syncToKlassci"
            @delete="deleteEvaluation"
          />
        </div>

        <!-- Empty State -->
        <TeacherEvalEmptyState
          v-else
          :has-filters="!!(filters.classe_id || filters.matiere_id || filters.statut)"
          @reset="resetFilters"
        />

        <!-- Modal: Create Online Version -->
        <TeacherEvalCreateModal
          :show="showCreateModal"
          :evaluation="selectedEvaluation"
          :online-form="onlineForm"
          :creating="creating"
          @close="closeCreateModal"
          @submit="submitCreateOnlineVersion"
        />
      </template>

    </div>
  </DashboardLayout>
</template>

<script setup>
/**
 * Évaluations enseignant (H1 ≤300). Orchestrateur : les données/filtres/dérivés
 * vivent dans useTeacherEvaluations (déjà mergé), les actions + l'état de la
 * modale dans useTeacherEvaluationActions ; l'UI est composée de
 * TeacherEvalFilters, TeacherEvalStats, EvaluationCard et TeacherEvalCreateModal.
 * Rendu/comportement identiques à l'original.
 */
import { onMounted } from 'vue'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import { DocumentTextIcon, ArrowPathIcon } from '@heroicons/vue/24/outline'
import { useTeacherEvaluations } from '@/composables/useTeacherEvaluations'
import { useTeacherEvaluationActions } from '@/composables/useTeacherEvaluationActions'
import EvaluationCard from '@/components/evaluations/EvaluationCard.vue'
import TeacherEvalFilters from '@/components/evaluations/TeacherEvalFilters.vue'
import TeacherEvalStats from '@/components/evaluations/TeacherEvalStats.vue'
import TeacherEvalEmptyState from '@/components/evaluations/TeacherEvalEmptyState.vue'
import TeacherEvalCreateModal from '@/components/evaluations/TeacherEvalCreateModal.vue'

// Données, filtres & dérivés délégués au composable (#28, tranche 2)
const {
  evaluationsLMS,
  classes,
  matieres,
  loading,
  error,
  hideExpired,
  filters,
  expiredWithoutOnlineCount,
  filteredEvaluations,
  stats,
  loadData,
  loadEvaluationsLMS,
  applyFilters,
  resetFilters
} = useTeacherEvaluations()

// Actions enseignant + état de la modale de création de version en ligne (H1)
const {
  syncing,
  showCreateModal,
  selectedEvaluation,
  creating,
  onlineForm,
  createOnlineVersion,
  closeCreateModal,
  submitCreateOnlineVersion,
  editOnlineVersion,
  viewResults,
  syncToKlassci,
  publishEvaluation,
  previewEvaluation,
  deleteEvaluation
} = useTeacherEvaluationActions({ evaluationsLMS, loadEvaluationsLMS })

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.evaluations-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0;
}

/* Header */
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
  background: var(--red-600);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-retry:hover {
  background: var(--red-700);
}

/* Evaluations List */
.evaluations-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Responsive */
/* NB : les règles responsive de .filters-grid et .stats-grid sont déplacées dans
   TeacherEvalFilters/TeacherEvalStats (CSS scoped — nécessaire à la parité).
   Les règles .eval-* ci-dessous sont du CSS mort PRÉEXISTANT (classes absentes de
   ce fichier depuis l'extraction d'EvaluationCard) : conservées verbatim. */
@media (max-width: 768px) {
  .evaluations-container {
    padding: 0;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .eval-info-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .eval-actions {
    flex-direction: column;
  }

  .btn-action {
    width: 100%;
  }

  .online-stats {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
