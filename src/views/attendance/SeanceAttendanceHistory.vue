<template>
  <DashboardLayout>
    <div class="attendance-container">
      <!-- Header -->
      <div class="welcome-header">
        <i class="fa fa-home welcome-icon"></i>
        <div>
          <h1 class="page-title">Historique des Séances</h1>
          <p class="page-subtitle">Consultez les séances et leurs listes de présences</p>
        </div>
      </div>

      <!-- Period Tabs + Custom Range + Search -->
      <SeancePeriodFilters
        :period-tabs="periodTabs"
        :selected-period="selectedPeriod"
        v-model:search-query="searchQuery"
        v-model:custom-from="customDates.from"
        v-model:custom-to="customDates.to"
        @select-period="selectPeriod"
        @apply-custom="applyCustomDates"
        @search="debouncedSearch"
        @clear="clearSearch"
      />

      <!-- Loading State -->
      <ContentLoader v-if="loading" text="Chargement des séances..." />

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <i class="fa fa-exclamation-triangle error-icon"></i>
        <div class="error-content">
          <h3 class="error-title">Une erreur est survenue</h3>
          <p class="error-message">{{ error }}</p>
        </div>
        <button @click="loadSeances" class="error-retry-btn">
          <span>↻</span>
          Réessayer
        </button>
      </div>

      <!-- Seances Table -->
      <SeancesTable
        v-else-if="seances.length > 0"
        :seances="seances"
        :selected-seance="selectedSeance"
        :pagination="pagination"
        :format-date="formatDate"
        :format-time="formatTime"
        :format-duration="formatDuration"
        @view-attendances="viewAttendances"
        @delete-seance="deleteSeance"
        @change-page="changePage"
      />

      <!-- Empty State -->
      <div v-else class="empty-state">
        <i class="fa fa-clipboard empty-icon"></i>
        <h3 class="empty-title">Aucune séance trouvée</h3>
        <p class="empty-message">
          {{ searchQuery ? 'Aucun résultat ne correspond à votre recherche.' : 'Aucune séance trouvée pour cette période.' }}
        </p>
        <button v-if="searchQuery" @click="clearSearch" class="btn-empty">
          Effacer la recherche
        </button>
      </div>

      <!-- Modal - Détails des Présences (#28 : sous-composant extrait) -->
      <AttendanceDetailModal
        :selected-seance="selectedSeance"
        :attendances="attendances"
        :loading-attendances="loadingAttendances"
        :attendances-error="attendancesError"
        :exporting="exporting"
        @close="closeModal"
        @export-pdf="exportPDF"
        @export-excel="exportExcel"
        @retry="viewAttendances(selectedSeance)"
      />
    </div>
  </DashboardLayout>
</template>

<script setup>
/**
 * Historique des séances + présences (orchestrateur H7, ≤300). La donnée et la
 * logique vivent dans useSeanceAttendanceHistory ; l'UI est composée de
 * SeancePeriodFilters, SeancesTable et AttendanceDetailModal (#28).
 */
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import SeancePeriodFilters from '@/components/attendance/SeancePeriodFilters.vue'
import SeancesTable from '@/components/attendance/SeancesTable.vue'
import AttendanceDetailModal from '@/components/attendance/AttendanceDetailModal.vue'
import { useSeanceAttendanceHistory } from '@/composables/useSeanceAttendanceHistory'

const {
  loading, error, seances, pagination,
  selectedPeriod, periodTabs, customDates, searchQuery,
  selectedSeance, loadingAttendances, attendances, attendancesError, exporting,
  loadSeances, selectPeriod, applyCustomDates, debouncedSearch, clearSearch,
  changePage, viewAttendances, closeModal,
  exportPDF, exportExcel, deleteSeance,
  formatDate, formatTime, formatDuration
} = useSeanceAttendanceHistory()
</script>

<style scoped>
/* Container */
.attendance-container {
  padding: 2rem;
  max-width: 1600px;
  margin: 0 auto;
}

/* Header */
.welcome-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: var(--bg-secondary);
  border-radius: 1rem;
  border: 1px solid var(--border-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.welcome-icon {
  font-size: 3rem;
  line-height: 1;
  flex-shrink: 0;
  color: var(--primary-color, #3b82f6);
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.025em;
}

.page-subtitle {
  font-size: 1rem;
  color: var(--text-secondary);
  margin: 0;
  font-weight: 500;
}

/* Loading State (dette : CSS scoped sans cible — ContentLoader est utilisé, #H7) */
.loading-state {
  background: var(--bg-primary);
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Error State */
.error-state {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem;
  background: var(--red-50);
  border: 1px solid var(--red-300);
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
}

.error-icon {
  font-size: 2rem;
  color: var(--red-600);
  flex-shrink: 0;
}

.error-content {
  flex: 1;
}

.error-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--red-800);
  margin: 0 0 0.5rem 0;
}

.error-message {
  color: var(--red-700);
  margin: 0;
  font-size: 0.875rem;
}

.error-retry-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--red-600);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.error-retry-btn:hover {
  background: var(--red-700);
  transform: scale(1.02);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: var(--bg-primary);
  border-radius: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.empty-icon {
  font-size: 4rem;
  line-height: 1;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.75rem 0;
}

.empty-message {
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 2rem;
  font-size: 1rem;
}

.btn-empty {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, var(--blue-500-fixed) 0%, var(--color-info-strong) 100%);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.btn-empty:hover {
  background: linear-gradient(135deg, var(--color-info-strong) 0%, var(--color-info-stronger) 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

/* Responsive */
/* Dette #H7 : .panel-stats-grid / .attendance-info-grid / .side-panel sont du
   CSS scoped sans cible (classes absentes du template d'origine) — conservé
   verbatim. Les règles .period-tabs (1024) et .date-inputs-row (768) ont migré
   avec leurs éléments dans SeancePeriodFilters (pas de copie morte ici). */
@media (max-width: 1024px) {
  .panel-stats-grid {
    grid-template-columns: 1fr;
  }

  .attendance-info-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .attendance-container {
    padding: 1rem;
  }

  .welcome-header {
    padding: 1rem;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .side-panel {
    width: 100%;
  }
}
</style>
