<template>
  <DashboardLayout>
    <div class="admin-stats-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <ChartBarIcon class="page-icon" />
          <div>
            <h1 class="page-title">Statistiques</h1>
            <p class="page-subtitle">Vue d'ensemble des statistiques de la plateforme</p>
          </div>
        </div>
        <button @click="refreshData" class="refresh-btn" title="Actualiser les données">
          <ArrowPathIcon :class="['w-5 h-5', { 'animate-spin': loading || revalidating }]" />
        </button>
      </div>

      <!-- Loading State -->
      <ContentLoader v-if="loading" text="Chargement des statistiques..." />

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <ExclamationTriangleIcon class="error-icon" />
        <p class="error-message">⚠ {{ error }}</p>
        <button @click="loadStats" class="retry-btn">Réessayer</button>
      </div>

      <!-- Stats Content -->
      <div v-else>
        <StatsMainGrid :stats="stats" />

        <!-- Année universitaire -->
        <div v-if="meta?.annee_universitaire_courante" class="info-card">
          <CalendarIcon class="info-icon" />
          <div class="info-content">
            <h3 class="info-title">Année Universitaire</h3>
            <p class="info-text">{{ meta.annee_universitaire_courante.nom || 'Non définie' }}</p>
          </div>
        </div>

        <StatsSecondaryGrid :stats="stats" />
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
/**
 * Statistiques (admin). Orchestrateur (#H3 ≤300) : la donnée et la logique vivent
 * dans useAdminStats ; l'UI est composée de StatsMainGrid et StatsSecondaryGrid.
 * La vue ne fait que câbler header + états + grilles.
 */
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import StatsMainGrid from '@/components/admin/StatsMainGrid.vue'
import StatsSecondaryGrid from '@/components/admin/StatsSecondaryGrid.vue'
import {
  ChartBarIcon,
  CalendarIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'
import { useAdminStats } from '@/composables/useAdminStats'

const { loading, revalidating, error, stats, meta, loadStats, refreshData } = useAdminStats()
</script>

<style scoped>
.admin-stats-container {
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

/* Info Card */
.info-card {
  background: linear-gradient(135deg, var(--admin-gradient-from) 0%, var(--admin-gradient-to) 100%);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
  color: white;
}

.info-icon {
  width: 3rem;
  height: 3rem;
  flex-shrink: 0;
}

.info-content {
  flex: 1;
}

.info-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
  opacity: 0.9;
}

.info-text {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

/* States */
.error-state {
  text-align: center;
  padding: var(--spacing-xl);
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.error-icon {
  width: 4rem;
  height: 4rem;
  margin: 0 auto var(--spacing-lg);
  color: var(--text-tertiary);
}

.error-message {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
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

/* Responsive */
@media (max-width: 768px) {
  .admin-stats-container {
    padding: var(--spacing-md);
  }

  .page-title {
    font-size: 1.5rem;
  }
}
</style>
