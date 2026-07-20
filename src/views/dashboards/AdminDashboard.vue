<template>
  <DashboardLayout>
    <div class="dashboard-content">
      <!-- Header -->
      <div class="welcome-header">
        <ShieldCheckIcon class="welcome-icon" />
        <div>
          <h1 class="page-title">Dashboard {{ getDashboardTitle() }}</h1>
          <p class="page-subtitle">
            Bienvenue, <strong>{{ user?.name }}</strong> ({{ user?.role_display_name }})
          </p>
        </div>
      </div>

      <!-- Année universitaire -->
      <DashboardInfoBanner
        v-if="meta?.annee_universitaire_courante"
        :annee="meta.annee_universitaire_courante"
        class="mb-6"
      />

      <!-- Loading state -->
      <ContentLoader v-if="loading.stats || loading.classes || loading.matieres" text="Chargement du tableau de bord..." />

      <!-- Dashboard Content -->
      <div v-if="!loading.stats && !loading.classes && !loading.matieres">
        <!-- Statistiques Admin depuis KLASSCI -->
        <DashboardStatsCards v-if="stats" :stats="stats" />

        <!-- Widget Graphe Activité (30 jours) -->
        <DashboardActivityChart v-if="activityData" :data="activityData" />

        <!-- Widget Tâches en Attente -->
        <DashboardPendingTasks v-if="pendingTasks" :pending-tasks="pendingTasks" />

        <!-- Widgets Activité et Système -->
        <DashboardSystemWidgets :stats="stats" />

        <!-- Widget Actions Rapides -->
        <DashboardQuickActions
          @navigate="navigateTo"
          @generate-report="showGenerateReportModal = true"
        />

        <!-- Actions Admin (Navigation) - Conditionnelles selon role -->
        <DashboardRoleActions
          :is-teacher="isTeacher()"
          :is-coordinateur="isCoordinateur()"
          :is-super-admin="isSuperAdmin()"
        />

        <!-- Classes KLASSCI -->
        <DashboardClasses
          :classes="classes"
          :loading="loading.classes"
          :limit="6"
          view-all-to="/admin/classes"
        />

        <!-- Widget Utilisateurs Récents -->
        <div class="mb-6">
          <DashboardRecentUsers :users="recentUsers" :limit="5" />
        </div>

        <!-- Calendrier des événements -->
        <div class="mb-6">
          <CalendarWidget :events="calendarEvents" height="500px" />
        </div>

        <!-- Matières KLASSCI -->
        <DashboardMatieres
          :matieres="matieres"
          :loading="loading.matieres"
          :limit="12"
          view-all-to="/admin/matieres"
        />
      </div>
    </div>

    <!-- Modals -->
    <GenerateReportModal
      v-model="showGenerateReportModal"
      @generated="handleReportGenerated"
    />
  </DashboardLayout>
</template>

<script setup>
/**
 * Tableau de bord admin/coordinateur. Orchestrateur (#H3 ≤300) : la donnée et la
 * logique vivent dans useAdminDashboard ; l'UI est composée de sous-composants
 * présentation (cartes KPI, graphe d'activité, tâches en attente, widgets système,
 * actions rapides, actions de rôle, classes, utilisateurs récents, matières,
 * bannière année). La vue ne fait que câbler header + états + conteneurs.
 */
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import GenerateReportModal from '@/components/modals/GenerateReportModal.vue'
import CalendarWidget from '@/components/widgets/CalendarWidget.vue'
import DashboardStatsCards from '@/components/dashboard/DashboardStatsCards.vue'
import DashboardActivityChart from '@/components/dashboard/DashboardActivityChart.vue'
import DashboardPendingTasks from '@/components/dashboard/DashboardPendingTasks.vue'
import DashboardSystemWidgets from '@/components/dashboard/DashboardSystemWidgets.vue'
import DashboardQuickActions from '@/components/dashboard/DashboardQuickActions.vue'
import DashboardRoleActions from '@/components/dashboard/DashboardRoleActions.vue'
import DashboardClasses from '@/components/dashboard/DashboardClasses.vue'
import DashboardRecentUsers from '@/components/dashboard/DashboardRecentUsers.vue'
import DashboardMatieres from '@/components/dashboard/DashboardMatieres.vue'
import DashboardInfoBanner from '@/components/dashboard/DashboardInfoBanner.vue'
import { ShieldCheckIcon } from '@heroicons/vue/24/outline'
import { useAdminDashboard } from '@/composables/useAdminDashboard'

const {
  user, meta, stats, classes, matieres,
  activityData, pendingTasks, recentUsers, calendarEvents,
  showGenerateReportModal, loading,
  navigateTo, handleReportGenerated, getDashboardTitle,
  isCoordinateur, isTeacher, isSuperAdmin,
} = useAdminDashboard()
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
