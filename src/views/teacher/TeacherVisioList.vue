<template>
  <DashboardLayout>
    <div class="visio-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <VideoCameraIcon class="page-icon text-blue-600" />
          <div>
            <h1 class="page-title">Visioconférences</h1>
            <p class="page-subtitle">Gérez vos séances en ligne pour toutes vos classes</p>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <ContentLoader v-if="loading" text="Chargement des visioconférences..." />

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <div class="error-content">
          <i class="fa fa-exclamation-triangle error-icon"></i>
          <div>
            <h3 class="error-title">Erreur de chargement</h3>
            <p class="error-message">{{ error }}</p>
          </div>
        </div>
        <button @click="loadVisioConferences" class="btn-retry">
          <ArrowPathIcon class="w-5 h-5" />
          Réessayer
        </button>
      </div>

      <template v-else>
        <!-- Statistics -->
        <VisioStatsCards :stats="stats" />

        <!-- En cours Section -->
        <VisioSeanceSection
          v-if="visioEnCours.length > 0"
          title="En cours maintenant"
          variant="active"
          :seances="visioEnCours"
          :action-loading="actionLoading"
          :build-jitsi-url="buildJitsiUrl"
          :format-date="formatDate"
          :format-time="formatTime"
          @start="handleStartVisio"
          @end="handleEndVisio"
          @activate="handleActivateVisio"
        />

        <!-- À venir Section -->
        <VisioSeanceSection
          v-if="visioAVenir.length > 0"
          title="Séances à venir"
          variant="scheduled"
          :seances="visioAVenir"
          :action-loading="actionLoading"
          :build-jitsi-url="buildJitsiUrl"
          :format-date="formatDate"
          :format-time="formatTime"
          @start="handleStartVisio"
          @end="handleEndVisio"
          @activate="handleActivateVisio"
        />

        <!-- Empty State -->
        <div v-if="visioEnCours.length === 0 && visioAVenir.length === 0" class="empty-state">
          <VideoCameraIcon class="empty-icon" />
          <h3 class="empty-title">Aucune visioconférence disponible</h3>
          <p class="empty-message">
            Vous n'avez pas de séances avec visio activée pour le moment.
          </p>
          <div class="empty-actions">
            <button @click="loadVisioConferences" class="btn-empty-secondary">
              <ArrowPathIcon class="w-5 h-5" />
              Actualiser
            </button>
          </div>
        </div>
      </template>
    </div>
  </DashboardLayout>
</template>

<script setup>
/**
 * Visioconférences enseignant. Orchestrateur (#G1 ≤300) : la donnée et la logique
 * vivent dans useTeacherVisioList ; l'UI est composée de VisioStatsCards et de
 * VisioSeanceSection (« en cours » / « à venir »). Le header et les états
 * loading / error / empty restent ici. Comportement, appels services, routes,
 * usage de buildJitsiUrl, classes/textes/formats : inchangés.
 */
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import VisioStatsCards from '@/components/visio/VisioStatsCards.vue'
import VisioSeanceSection from '@/components/visio/VisioSeanceSection.vue'
import { buildJitsiUrl } from '@/constants/visio'
import { useTeacherVisioList } from '@/composables/useTeacherVisioList'
import {
  VideoCameraIcon,
  ArrowPathIcon
} from '@heroicons/vue/24/outline'

const {
  loading, error, actionLoading,
  visioEnCours, visioAVenir, stats,
  loadVisioConferences,
  handleActivateVisio, handleStartVisio, handleEndVisio,
  formatDate, formatTime,
} = useTeacherVisioList()
</script>

<style scoped>
.visio-container {
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

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
}

.empty-icon {
  width: 6rem;
  height: 6rem;
  color: var(--text-tertiary);
  margin: 0 auto 1.5rem;
}

.empty-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.empty-message {
  font-size: 1rem;
  color: var(--text-secondary);
  margin: 0 0 1.5rem 0;
  line-height: 1.6;
}

.empty-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-empty-secondary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.btn-empty-secondary:hover {
  background: var(--bg-hover);
  transform: translateY(-1px);
}

/* Responsive */
@media (max-width: 768px) {
  .visio-container {
    padding: 0;
  }

  .page-title {
    font-size: 1.5rem;
  }
}
</style>
