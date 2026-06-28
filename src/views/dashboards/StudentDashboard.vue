<template>
  <DashboardLayout>
    <div class="dashboard-content">
      <!-- Header -->
      <div class="welcome-header">
        <AcademicCapIcon class="welcome-icon" />
        <div>
          <h1 class="page-title">Dashboard Étudiant</h1>
          <p class="page-subtitle">
            Bienvenue, <strong>{{ user?.name || user?.nom + ' ' + user?.prenom }}</strong>
          </p>
        </div>
      </div>

      <!-- Loading state -->
      <DashboardSkeleton v-if="loading" />

      <!-- Error state -->
      <div v-if="error" class="error-state">
        <div class="error-icon"><i class="fa fa-exclamation-triangle"></i></div>
        <div class="error-content">
          <h3 class="error-title">Erreur de chargement</h3>
          <p class="error-message">{{ error }}</p>
        </div>
        <button @click="loadDashboard(true)" class="error-retry-btn">
          Réessayer
        </button>
      </div>

      <!-- Dashboard Content -->
      <DashboardWidgets v-if="!loading && dashboardData" :dashboard-data="dashboardData" />
    </div>
  </DashboardLayout>
</template>

<script setup>
/**
 * Dashboard Étudiant. Orchestrateur (#G1 ≤300) : la donnée et la logique (cache +
 * rafraîchissement en arrière-plan) vivent dans useStudentDashboard ; l'UI est
 * composée de DashboardSkeleton (chargement) et DashboardWidgets (contenu).
 */
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import DashboardSkeleton from '@/components/student/DashboardSkeleton.vue'
import DashboardWidgets from '@/components/student/DashboardWidgets.vue'
import { AcademicCapIcon } from '@heroicons/vue/24/outline'
import { useStudentDashboard } from '@/composables/useStudentDashboard'

defineOptions({ name: 'StudentDashboard' })

const { user, dashboardData, loading, error, loadDashboard } = useStudentDashboard()
</script>

<style scoped>
.dashboard-content {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0;
}

/* Welcome Header */
.welcome-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.welcome-icon {
  width: 2.5rem;
  height: 2.5rem;
  color: var(--blue-600);
}

.page-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.page-subtitle {
  color: var(--text-secondary);
  margin-top: 0.25rem;
}

/* Error State */
.error-state {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem;
  background: var(--red-50);
  border: 1px solid #FCA5A5;
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
  color: var(--error-text);
  margin: 0 0 0.5rem 0;
}

.error-message {
  color: var(--red-700);
  margin: 0;
}

.error-retry-btn {
  padding: 0.75rem 1.5rem;
  background: var(--red-600);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.error-retry-btn:hover {
  background: var(--red-700);
  transform: scale(1.02);
}

/* Responsive */
@media (max-width: 768px) {
  .page-title {
    font-size: 1.5rem;
  }

  .error-state {
    flex-direction: column;
    text-align: center;
  }

  .error-retry-btn {
    width: 100%;
  }
}
</style>
