<template>
  <DashboardLayout>
    <div class="matieres-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <BookOpenIcon class="page-icon" />
          <div>
            <h1 class="page-title">Gestion des Matières</h1>
            <p class="page-subtitle">{{ stats.total }} matière(s) · {{ stats.totalHeures }}h au total</p>
          </div>
        </div>
        <div class="header-actions">
          <button @click="refreshData" class="btn-refresh" title="Actualiser les données">
            <ArrowPathIcon class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Filters -->
      <MatieresFilters
        v-if="!loading && !error"
        v-model:search="filters.search"
        v-model:filiere-id="filters.filiere_id"
        v-model:niveau-id="filters.niveau_id"
        :filieres="filieres"
        :niveaux="niveaux"
        @reset="resetFilters"
      />

      <!-- Loading state -->
      <ContentLoader v-if="loading" text="Chargement des matieres..." />

      <!-- Error state -->
      <div v-else-if="error" class="error-state">
        <div class="error-icon"><i class="fa fa-exclamation-triangle"></i></div>
        <div class="error-content">
          <h3 class="error-title">Erreur de chargement</h3>
          <p class="error-message">{{ error }}</p>
        </div>
        <button @click="loadMatieres" class="error-retry-btn">
          <ArrowPathIcon class="w-5 h-5" />
          Réessayer
        </button>
      </div>

      <!-- Matieres Table -->
      <MatieresTable
        v-else-if="filteredMatieres.length > 0"
        :matieres="filteredMatieres"
        @view="viewMatiereDetails"
      />

      <!-- Empty state -->
      <div v-else class="empty-state">
        <BookOpenIcon class="empty-icon" />
        <p class="empty-message">Aucune matière trouvée</p>
      </div>

      <MatiereModals
        :niveau="showNiveauModal ? selectedNiveau : null"
        :matiere="showMatiereModal ? selectedMatiere : null"
        @close-niveau="closeNiveauModal"
        @close-matiere="closeMatiereModal"
        @view-matiere="viewMatiereDetails"
      />
    </div>
  </DashboardLayout>
</template>

<script setup>
/**
 * Gestion des matières (admin). Orchestrateur (#G1 ≤300) : la donnée et la logique
 * vivent dans useAdminMatieres ; l'UI est composée de MatieresFilters, MatieresTable
 * et MatiereModals. La vue ne fait que câbler header, états et sous-composants.
 */
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import MatiereModals from '@/components/admin/MatiereModals.vue'
import MatieresFilters from '@/components/admin/MatieresFilters.vue'
import MatieresTable from '@/components/admin/MatieresTable.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import { useAdminMatieres } from '@/composables/useAdminMatieres'
import { BookOpenIcon, ArrowPathIcon } from '@heroicons/vue/24/outline'

const {
  filieres, niveaux, loading, error, filters,
  showNiveauModal, selectedNiveau, showMatiereModal, selectedMatiere,
  filteredMatieres, stats,
  closeNiveauModal, viewMatiereDetails, closeMatiereModal,
  loadMatieres, refreshData, resetFilters,
} = useAdminMatieres()
</script>

<style scoped>
/* Container */
.matieres-container {
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.page-icon {
  width: 3rem;
  height: 3rem;
  color: var(--primary-color, #6366f1);
  flex-shrink: 0;
}

.page-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.page-subtitle {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0.25rem 0 0 0;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.btn-refresh {
  padding: 0.625rem;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-refresh:hover {
  background: var(--hover-bg);
  transform: rotate(180deg);
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: var(--card-bg);
  border-radius: 0.75rem;
}

.empty-icon {
  width: 4rem;
  height: 4rem;
  margin: 0 auto 1rem;
  color: var(--text-tertiary);
}

.empty-message {
  font-size: 1rem;
  color: var(--text-secondary);
}

/* Error State */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 3rem 2rem;
  background: var(--card-bg);
  border-radius: 0.75rem;
}

.error-icon {
  font-size: 4rem;
}

.error-content {
  text-align: center;
}

.error-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.error-message {
  font-size: 1rem;
  color: var(--text-secondary);
  margin: 0;
}

.error-retry-btn {
  padding: 0.75rem 1.5rem;
  background: var(--primary-color);
  border: none;
  border-radius: 0.5rem;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  transition: all 0.2s;
}

.error-retry-btn:hover {
  background: var(--indigo-600);
}

/* Responsive */
@media (max-width: 768px) {
  .matieres-container {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
