<template>
  <DashboardLayout>
    <div class="attendance-history-container">
      <!-- Header -->
      <div class="welcome-header">
        <i class="fa fa-list-alt welcome-icon"></i>
        <div>
          <h1 class="page-title">Historique des Présences</h1>
          <p class="page-subtitle">Consultez l'historique complet des participations aux visioconférences</p>
        </div>
      </div>

      <!-- Filters -->
      <AttendanceHistoryFilters
        v-model:date-from="filters.dateFrom"
        v-model:date-to="filters.dateTo"
        v-model:seance-id="filters.seanceId"
        @change="loadHistory"
        @input="debouncedLoad"
        @reset="resetFilters"
      />

      <!-- Loading -->
      <ContentLoader v-if="loading" text="Chargement de l'historique..." />

      <!-- Error -->
      <div v-else-if="error" class="error-container">
        <p class="error-message">{{ error }}</p>
        <button @click="loadHistory" class="btn-retry">Réessayer</button>
      </div>

      <!-- Results -->
      <div v-else-if="attendances.length > 0" class="results-section">
        <AttendanceHistoryStats
          :total="pagination.total"
          :average-duration="averageDuration"
          :connected-count="connectedCount"
          :disconnected-count="disconnectedCount"
        />

        <AttendanceHistoryTable
          :attendances="attendances"
          :user="user"
          :pagination="pagination"
          :format-date="formatDate"
          :format-time="formatTime"
          @export="exportToCSV"
          @view-details="viewDetails"
          @load-page="loadPage"
        />
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <span class="empty-icon">☹</span>
        <p class="empty-message">Aucune participation trouvée</p>
        <p class="empty-hint">Essayez de modifier les filtres ou d'élargir la période de recherche</p>
      </div>

      <!-- Details Modal -->
      <AttendanceParticipationModal
        :attendance="selectedAttendance"
        :format-date="formatDate"
        :format-date-time="formatDateTime"
        @close="closeDetails"
      />
    </div>
  </DashboardLayout>
</template>

<script setup>
/**
 * Historique des présences (orchestrateur H7, ≤300). La donnée et la logique
 * vivent dans useAttendanceHistory ; l'UI est composée de AttendanceHistoryFilters,
 * AttendanceHistoryStats, AttendanceHistoryTable et AttendanceParticipationModal.
 */
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import AttendanceHistoryFilters from '@/components/attendance/AttendanceHistoryFilters.vue'
import AttendanceHistoryStats from '@/components/attendance/AttendanceHistoryStats.vue'
import AttendanceHistoryTable from '@/components/attendance/AttendanceHistoryTable.vue'
import AttendanceParticipationModal from '@/components/attendance/AttendanceParticipationModal.vue'
import { useAttendanceHistory } from '@/composables/useAttendanceHistory'

const {
  loading, error, attendances, pagination, filters, selectedAttendance,
  user, averageDuration, connectedCount, disconnectedCount,
  loadHistory, loadPage, resetFilters, debouncedLoad,
  viewDetails, closeDetails, exportToCSV,
  formatDate, formatTime, formatDateTime
} = useAttendanceHistory()
</script>

<style scoped>
.attendance-history-container {
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* Header */
.welcome-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.welcome-icon {
  font-size: 2.5rem;
  color: #3b82f6;
}

.page-title {
  font-size: 1.875rem;
  font-weight: bold;
  margin: 0;
  color: var(--text-primary);
}

.page-subtitle {
  margin: 0.5rem 0 0;
  color: var(--text-secondary);
}

/* Loading & Error */
.loading-container,
.error-container {
  padding: 3rem;
  text-align: center;
}

.error-message {
  color: #ef4444;
  font-size: 1rem;
  margin-bottom: 1rem;
}

.btn-retry {
  padding: 0.625rem 1.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-retry:hover {
  background: #2563eb;
}

/* Empty State */
.empty-state {
  padding: 4rem 2rem;
  text-align: center;
  background: var(--bg-primary);
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.empty-icon {
  font-size: 4rem;
  display: block;
  margin-bottom: 1rem;
}

.empty-message {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.empty-hint {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

/* Responsive */
@media (max-width: 768px) {
  .attendance-history-container {
    padding: 1rem;
  }
}
</style>
