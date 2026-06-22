<template>
  <DashboardLayout>
    <div class="admin-enseignants-container">
      <!-- Header Section -->
      <div class="header-section">
        <div class="header-content">
          <h1 class="page-title">Gestion des Enseignants</h1>
          <p class="page-subtitle">Liste complète des enseignants et leurs affectations</p>
        </div>
        <button @click="loadEnseignants(true)" class="refresh-btn" :disabled="loading">
          <i class="fa fa-refresh btn-icon"></i>
          <span class="btn-text">Actualiser</span>
        </button>
      </div>

      <EnseignantsStatsCards
        :enseignants="enseignants.length"
        :total-matieres="totalMatieres"
        :total-classes="totalClasses"
        :actifs="enseignantsActifs"
      />

      <!-- Loading State -->
      <ContentLoader v-if="loading" text="Chargement des enseignants..." />

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <div class="error-icon"><i class="fa fa-exclamation-triangle"></i></div>
        <h3 class="error-title">Erreur de Chargement</h3>
        <p class="error-message">{{ error }}</p>
        <button @click="loadEnseignants" class="retry-btn">Réessayer</button>
      </div>

      <!-- Empty State -->
      <div v-else-if="enseignants.length === 0" class="empty-state">
        <i class="fa fa-user empty-icon"></i>
        <h3 class="empty-title">Aucun Enseignant</h3>
        <p class="empty-message">Aucun enseignant n'a été trouvé dans le système.</p>
      </div>

      <!-- Enseignants Grid -->
      <div v-else class="enseignants-grid">
        <EnseignantCard
          v-for="enseignant in enseignants"
          :key="enseignant.id"
          :enseignant="enseignant"
          @view="selectEnseignant"
        />
      </div>

      <EnseignantDetailModal :enseignant="selectedEnseignant" @close="closeModal" />
    </div>
  </DashboardLayout>
</template>

<script setup>
/**
 * Gestion des enseignants (admin). Orchestrateur (#G1 ≤300) : la donnée et la
 * logique vivent dans useAdminEnseignants ; l'UI est composée de
 * EnseignantsStatsCards, EnseignantCard et EnseignantDetailModal.
 */
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import EnseignantsStatsCards from '@/components/admin/EnseignantsStatsCards.vue'
import EnseignantCard from '@/components/admin/EnseignantCard.vue'
import EnseignantDetailModal from '@/components/admin/EnseignantDetailModal.vue'
import { useAdminEnseignants } from '@/composables/useAdminEnseignants'

const {
  enseignants, loading, error, selectedEnseignant,
  totalMatieres, totalClasses, enseignantsActifs,
  loadEnseignants, selectEnseignant, closeModal,
} = useAdminEnseignants()
</script>

<style scoped lang="scss">
@use '../../assets/styles/admin-shared';

.admin-enseignants-container {
  padding: var(--spacing-xl);
  max-width: 1400px;
  margin: 0 auto;
}

.btn-icon {
  font-size: 1.25rem;
}

/* Error State */
.error-state {
  text-align: center;
  padding: var(--spacing-3xl);
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
}

.error-icon {
  font-size: 4rem;
  margin-bottom: var(--spacing-lg);
}

.error-title {
  font-size: var(--font-size-2xl);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-sm) 0;
}

.error-message {
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-lg) 0;
}

.retry-btn {
  padding: var(--spacing-md) var(--spacing-xl);
  background: var(--primary-gradient);
  border: none;
  border-radius: var(--radius-lg);
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.retry-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: var(--spacing-3xl);
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
}

.empty-icon {
  font-size: 4rem;
  opacity: 0.5;
  margin-bottom: var(--spacing-lg);
}

.empty-title {
  font-size: var(--font-size-2xl);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-sm) 0;
}

.empty-message {
  color: var(--text-secondary);
  margin: 0;
}

/* Enseignants Grid */
.enseignants-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: var(--spacing-lg);
}

/* Overrides sombres des badges de la modale détail (parité : escapés du scope
   via :global, ils ciblent EnseignantDetailModal rendu dans cette vue). */
:global(.dark) .badge-filiere {
  background: rgba(59, 130, 246, 0.2);
  color: #93c5fd;
}

:global(.dark) .badge-niveau {
  background: rgba(251, 191, 36, 0.2);
  color: #fde047;
}

/* Responsive */
@media (max-width: 768px) {
  .admin-enseignants-container {
    padding: var(--spacing-lg);
  }

  .header-section {
    flex-direction: column;
    align-items: stretch;
  }

  .enseignants-grid {
    grid-template-columns: 1fr;
  }
}
</style>
