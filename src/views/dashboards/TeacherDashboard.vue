<template>
  <DashboardLayout>
    <div class="dashboard-content">
      <!-- Header -->
      <div v-reveal class="welcome-header">
        <UserIcon class="welcome-icon" />
        <div>
          <h1 class="page-title">Dashboard Enseignant</h1>
          <p class="page-subtitle">
            Bienvenue, <strong>{{ user?.name }}</strong>
          </p>
        </div>
      </div>

      <!-- Loading state -->
      <ContentLoader v-if="loading" text="Chargement du tableau de bord..." />

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
      <div v-if="!loading && !error && dashboardData">
        <DashboardStatCards v-reveal="70" :dashboard-data="dashboardData" />
        <DashboardActivityWidgets v-reveal="140" :dashboard-data="dashboardData" />
        <DashboardMatieresList v-reveal :matieres="dashboardData.matieres" @navigate="navigateToMatiere" />
        <DashboardClassesList v-reveal :classes="dashboardData.classes" />
        <DashboardEvaluationsList
          v-if="dashboardData.evaluations && dashboardData.evaluations.length > 0"
          v-reveal
          :evaluations="dashboardData.evaluations"
          :format-date="formatDate"
        />
        <DashboardQuickActions v-reveal />
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
/**
 * Dashboard enseignant — orchestrateur (#H11 ≤300). La donnée/logique vit dans
 * useTeacherDashboard ; l'UI est composée de DashboardStatCards,
 * DashboardActivityWidgets, DashboardMatieresList, DashboardClassesList,
 * DashboardEvaluationsList et DashboardQuickActions.
 */
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import DashboardStatCards from '@/components/teacher/DashboardStatCards.vue'
import DashboardActivityWidgets from '@/components/teacher/DashboardActivityWidgets.vue'
import DashboardMatieresList from '@/components/teacher/DashboardMatieresList.vue'
import DashboardClassesList from '@/components/teacher/DashboardClassesList.vue'
import DashboardEvaluationsList from '@/components/teacher/DashboardEvaluationsList.vue'
import DashboardQuickActions from '@/components/teacher/DashboardQuickActions.vue'
import { UserIcon } from '@heroicons/vue/24/outline'
import { useTeacherDashboard } from '@/composables/useTeacherDashboard'

const { user, dashboardData, loading, error, loadDashboard, formatDate, navigateToMatiere } = useTeacherDashboard()
</script>

<style scoped>
.dashboard-content {
  padding: 2rem;
}

.welcome-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.welcome-icon {
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

/* Error state */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.error-content {
  margin-bottom: 2rem;
}

.error-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.error-message {
  color: var(--text-secondary);
}

.error-retry-btn {
  padding: 0.75rem 2rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.error-retry-btn:hover {
  background: var(--color-primary-dark);
  transform: translateY(-2px);
}

/* Responsive */
@media (max-width: 768px) {
  .dashboard-content {
    padding: 1rem;
  }

  .page-title {
    font-size: 1.5rem;
  }
}
</style>
