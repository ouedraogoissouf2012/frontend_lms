<template>
  <DashboardLayout>
    <div class="admin-visio-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <VideoCameraIcon class="page-icon" />
          <div>
            <h1 class="page-title">Visioconférences</h1>
            <p class="page-subtitle">Gérer toutes les visioconférences actives et planifiées</p>
          </div>
        </div>
        <button @click="refreshData" class="refresh-btn" title="Actualiser les données">
          <ArrowPathIcon :class="['w-5 h-5', { 'animate-spin': loading }]" />
        </button>
      </div>

      <!-- Stats Cards -->
      <VisioStatsCards :stats="stats" />

      <!-- Filters -->
      <VisioFilters
        v-model:days="filters.days"
        v-model:status="filters.status"
        v-model:search="filters.search"
        @reload="loadVisioconferences"
        @filter="filterVisioconferences"
      />

      <!-- Loading State -->
      <ContentLoader v-if="loading" text="Chargement des visioconferences..." />

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <ExclamationTriangleIcon class="error-icon" />
        <p class="error-message">⚠ {{ error }}</p>
        <button @click="loadVisioconferences" class="retry-btn">Réessayer</button>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredVisioconferences.length === 0" class="empty-state">
        <VideoCameraIcon class="empty-icon" />
        <h3 class="empty-title">Aucune visioconférence trouvée</h3>
        <p class="empty-message">Aucune visioconférence ne correspond aux critères sélectionnés</p>
      </div>

      <!-- Visioconferences Grid -->
      <VisioGrid
        v-else
        :visioconferences="filteredVisioconferences"
        :get-status-label="getStatusLabel"
        :format-date="formatDate"
        :format-time="formatTime"
        @join="joinVisio"
        @view="viewVisioDetails"
      />

      <!-- Pagination -->
      <div v-if="filteredVisioconferences.length > 0" class="pagination">
        <p class="pagination-info">
          Affichage de <strong>{{ filteredVisioconferences.length }}</strong> visioconférence(s)
        </p>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
/**
 * Visioconférences (admin). Orchestrateur (#G1 ≤300) : la donnée et la logique
 * vivent dans useAdminVisio ; l'UI est composée de VisioStatsCards, VisioFilters
 * et VisioGrid. La vue ne garde que header, états (chargement/erreur/vide) et pagination.
 */
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import VisioStatsCards from '@/components/admin/VisioStatsCards.vue'
import VisioFilters from '@/components/admin/VisioFilters.vue'
import VisioGrid from '@/components/admin/VisioGrid.vue'
import {
  VideoCameraIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'
import { useAdminVisio } from '@/composables/useAdminVisio'

const {
  loading, error, filters,
  stats, filteredVisioconferences,
  loadVisioconferences, refreshData, filterVisioconferences,
  getStatusLabel, formatDate, formatTime,
  joinVisio, viewVisioDetails,
} = useAdminVisio()
</script>

<style scoped>
.admin-visio-container {
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
  .admin-visio-container {
    padding: var(--spacing-md);
  }

  .page-title {
    font-size: 1.5rem;
  }
}
</style>
