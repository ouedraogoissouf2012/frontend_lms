<template>
  <DashboardLayout>
    <div class="admin-seances-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <CalendarIcon class="page-icon" />
          <div>
            <h1 class="page-title">Gestion des Séances</h1>
            <p class="page-subtitle">Gérer toutes les séances de visioconférence</p>
          </div>
        </div>
        <button @click="refreshData" class="refresh-btn" title="Actualiser les données">
          <ArrowPathIcon :class="['w-5 h-5', { 'animate-spin': loading }]" />
        </button>
      </div>

      <!-- Filters -->
      <SeancesFilters
        v-model:days="filters.days"
        v-model:teacher-id="filters.teacher_id"
        v-model:classe-id="filters.classe_id"
        v-model:status="filters.status"
        :teachers="teachers"
        :classes="classes"
        @change="loadSeances"
      />

      <!-- Loading State -->
      <ContentLoader v-if="loading" text="Chargement des seances..." />

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <ExclamationTriangleIcon class="error-icon" />
        <p class="error-message">⚠ {{ error }}</p>
        <button @click="loadSeances" class="retry-btn">Réessayer</button>
      </div>

      <!-- Empty State -->
      <div v-else-if="seances.length === 0" class="empty-state">
        <CalendarIcon class="empty-icon" />
        <h3 class="empty-title">Aucune séance trouvée</h3>
        <p class="empty-message">Aucune séance ne correspond aux critères sélectionnés</p>
      </div>

      <!-- Seances Grid -->
      <SeancesList
        v-else
        :seances="seances"
        @view-details="viewSeanceDetails"
        @enable-visio="enableVisio"
      />

      <!-- Pagination -->
      <div v-if="seances.length > 0" class="pagination">
        <p class="pagination-info">
          Affichage de <strong>{{ seances.length }}</strong> séance(s)
        </p>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
/**
 * Gestion des séances (admin). Orchestrateur (#G1 ≤300) : la donnée et la logique
 * vivent dans useAdminSeances ; l'UI est composée de SeancesFilters et SeancesList.
 */
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import SeancesFilters from '@/components/admin/SeancesFilters.vue'
import SeancesList from '@/components/admin/SeancesList.vue'
import { useAdminSeances } from '@/composables/useAdminSeances'
import {
  CalendarIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'

const {
  loading, error, seances, teachers, classes, filters,
  loadSeances, refreshData, viewSeanceDetails, enableVisio,
} = useAdminSeances()
</script>

<style scoped>
.admin-seances-container {
  padding: var(--spacing-xl);
  max-width: 1400px;
  margin: 0 auto;
}

/* Header */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-xl);
}

.header-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.page-icon {
  width: 2.5rem;
  height: 2.5rem;
  color: var(--color-primary);
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
  margin-top: 0.25rem;
}

.refresh-btn {
  padding: var(--spacing-md);
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-primary);
}

.refresh-btn:hover {
  background: var(--bg-hover);
  border-color: var(--color-primary);
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* States */
.error-state,
.empty-state {
  text-align: center;
  padding: var(--spacing-xl);
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.error-icon,
.empty-icon {
  width: 4rem;
  height: 4rem;
  margin: 0 auto var(--spacing-lg);
  color: var(--text-tertiary);
}

.error-message,
.empty-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

.empty-message {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.retry-btn {
  margin-top: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.retry-btn:hover {
  background: var(--color-primary-dark);
}

/* Pagination */
.pagination {
  text-align: center;
  padding: var(--spacing-lg);
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.pagination-info {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

/* Responsive */
@media (max-width: 768px) {
  .admin-seances-container {
    padding: var(--spacing-md);
  }

  .page-title {
    font-size: 1.5rem;
  }
}
</style>
