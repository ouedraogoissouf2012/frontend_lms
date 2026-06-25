<template>
  <DashboardLayout>
    <div class="seances-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <i class="fa fa-dot-circle-o page-icon"></i>
          <div>
            <h1 class="page-title">Mes Séances</h1>
            <p class="page-subtitle">Gérez vos cours et visioconférences</p>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <ContentLoader v-if="loading" text="Chargement des séances..." />

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <div class="error-content">
          <i class="fa fa-exclamation-triangle error-icon"></i>
          <div>
            <h3 class="error-title">Erreur de chargement</h3>
            <p class="error-message">{{ error }}</p>
          </div>
        </div>
        <button @click="loadSeances" class="btn-retry">
          <i class="fa fa-refresh icon"></i>
          Réessayer
        </button>
      </div>

      <template v-else>
        <!-- Filters Card -->
        <TeacherSeancesFilters
          :matieres="matieres"
          v-model:matiere-id="filters.matiere_id"
          v-model:visio-status="filters.visio_status"
          v-model:period="filters.period"
          @apply="applyFilters"
          @reset="resetFilters"
        />

        <!-- Statistics -->
        <TeacherSeancesStats :stats="stats" />

        <!-- Séances List (#28 : carte extraite en sous-composant) -->
        <div v-if="filteredSeances.length > 0" class="seances-list">
          <SeanceCard
            v-for="seance in filteredSeances"
            :key="seance.id"
            :seance="seance"
            :is-enseignant="isEnseignant"
            :action-loading="actionLoading"
            @activate="handleActivateVisio"
            @start="handleStartVisio"
            @deactivate="handleDeactivateVisio"
            @join="handleJoinVisio"
            @end="handleEndVisio"
          />
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state">
          <span class="empty-icon">◷</span>
          <h3 class="empty-title">Aucune séance trouvée</h3>
          <p class="empty-message">
            {{ filters.matiere_id || filters.visio_status || filters.period !== 'all'
              ? 'Aucune séance ne correspond à vos filtres'
              : 'Vos prochaines séances apparaîtront ici' }}
          </p>
          <button v-if="filters.matiere_id || filters.visio_status || filters.period !== 'all'"
                  @click="resetFilters"
                  class="btn-empty">
            Voir toutes les séances
          </button>
        </div>
      </template>
    </div>


  </DashboardLayout>
</template>

<script setup>
/**
 * Mes Séances (enseignant) (#H6 ≤300). Orchestrateur : données et logique dans
 * useTeacherSeances ; l'UI compose filtres (TeacherSeancesFilters), statistiques
 * (TeacherSeancesStats) et la liste de cartes (SeanceCard). Comportement et
 * rendu strictement identiques au `<script setup>` d'origine.
 */
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import SeanceCard from '@/components/seances/SeanceCard.vue'
import TeacherSeancesFilters from '@/components/seances/TeacherSeancesFilters.vue'
import TeacherSeancesStats from '@/components/seances/TeacherSeancesStats.vue'
import { useTeacherSeances } from '@/composables/useTeacherSeances'

const {
  matieres, loading, error, actionLoading, isEnseignant,
  filters, filteredSeances, stats,
  loadSeances, applyFilters, resetFilters,
  handleActivateVisio, handleDeactivateVisio, handleStartVisio,
  handleJoinVisio, handleEndVisio,
} = useTeacherSeances()
</script>

<style scoped>
.seances-container {
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
  font-size: 2.5rem;
  line-height: 1;
  flex-shrink: 0;
  color: #3b82f6;
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
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-retry:hover {
  background: #b91c1c;
}

/* Seances List */
.seances-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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
  font-size: 6rem;
  line-height: 1;
  color: var(--text-tertiary);
  margin: 0 auto 1.5rem;
  display: block;
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
}

.btn-empty {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-empty:hover {
  background: var(--primary-hover);
  transform: translateY(-1px);
}

/* Responsive
   NB (#H6) : les règles .seance-header/.seance-info-grid/.action-info/
   .action-buttons/.btn-action ci-dessous ciblent des éléments désormais
   internes à SeanceCard (extrait #28) ; inertes via le scoping. Dette
   pré-existante conservée à l'identique. */
@media (max-width: 768px) {
  .seances-container {
    padding: 0;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .seance-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .seance-info-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .action-info {
    flex-direction: column;
    align-items: stretch;
  }

  .action-buttons {
    flex-direction: column;
  }

  .btn-action {
    width: 100%;
  }
}
</style>
