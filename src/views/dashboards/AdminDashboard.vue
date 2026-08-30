<template>
  <DashboardLayout>
    <div class="dashboard-content">
      <!-- Header -->
      <div v-reveal class="welcome-header">
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

      <!-- Échec du chargement des données d'établissement. Bannière NON bloquante :
           le reste du tableau de bord (analytics, actions) demeure exploitable, mais
           la panne est DITE — sans elle, l'écran restait muet, garni de compteurs à
           zéro qui se lisaient comme un établissement vide. -->
      <div
        v-if="loadError && !loading.stats && !loading.classes && !loading.matieres"
        class="dashboard-error"
        role="alert"
      >
        <ExclamationTriangleIcon class="dashboard-error-icon" />
        <span>{{ loadError }}</span>
        <button class="dashboard-error-retry" @click="loadKlassciData()">Réessayer</button>
      </div>

      <!-- Dashboard Content -->
      <div v-if="!loading.stats && !loading.classes && !loading.matieres">
        <!-- Statistiques Admin depuis KLASSCI -->
        <DashboardStatsCards v-if="stats" v-reveal="70" :stats="stats" />

        <!-- Widget Graphe Activité (30 jours) -->
        <DashboardActivityChart v-if="activityData" v-reveal="140" :data="activityData" />

        <!-- Widget Tâches en Attente -->
        <DashboardPendingTasks v-if="pendingTasks" v-reveal="210" :pending-tasks="pendingTasks" />

        <!-- Widgets Activité et Système -->
        <DashboardSystemWidgets v-reveal :stats="stats" />

        <!-- Widget Actions Rapides -->
        <DashboardQuickActions
          v-reveal
          @navigate="navigateTo"
          @generate-report="showGenerateReportModal = true"
        />

        <!-- Actions Admin (Navigation) - Conditionnelles selon role -->
        <DashboardRoleActions
          v-reveal
          :is-teacher="isTeacher()"
          :is-coordinateur="isCoordinateur()"
          :is-admin="isAdmin()"
        />

        <!-- Classes KLASSCI -->
        <DashboardClasses
          v-reveal
          :classes="classes"
          :loading="loading.classes"
          :limit="6"
          view-all-to="/admin/classes"
        />

        <!-- Widget Utilisateurs Récents -->
        <div v-reveal class="mb-6">
          <DashboardRecentUsers :users="recentUsers" :limit="5" />
        </div>

        <!-- Calendrier des événements -->
        <div v-reveal class="mb-6">
          <CalendarWidget :events="calendarEvents" height="500px" />
        </div>

        <!-- Matières KLASSCI -->
        <DashboardMatieres
          v-reveal
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
import { ShieldCheckIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import { useAdminDashboard } from '@/composables/useAdminDashboard'

const {
  user, meta, stats, classes, matieres,
  activityData, pendingTasks, recentUsers, calendarEvents,
  showGenerateReportModal, loading, loadError,
  navigateTo, handleReportGenerated, getDashboardTitle,
  isCoordinateur, isTeacher, isAdmin, loadKlassciData,
} = useAdminDashboard()
</script>

<style scoped>
.dashboard-content {
  padding: 2rem;
}

/* Bannière d'erreur : paire de tokens adaptative (fond ET texte basculent
   ensemble par thème), même règle que les badges de rôle. */
.dashboard-error {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1.25rem;
  margin-bottom: 1.5rem;
  background: var(--error-bg);
  border: 1px solid var(--error-border);
  border-radius: 0.75rem;
  color: var(--error-text);
}

.dashboard-error-icon {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}

.dashboard-error-retry {
  margin-left: auto;
  padding: 0.25rem 0.75rem;
  background: transparent;
  border: 1px solid var(--error-border);
  border-radius: 0.5rem;
  color: var(--error-text);
  cursor: pointer;
  font-weight: 600;
  white-space: nowrap;
}

.dashboard-error-retry:hover {
  opacity: 0.85;
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
