<template>
  <DashboardLayout>
    <div class="admin-institutions-container">
      <!-- Header Section -->
      <div class="header-section">
        <div class="header-content">
          <h1 class="page-title">Gestion des Institutions</h1>
          <p class="page-subtitle">Administration globale des institutions KLASSCI</p>
        </div>
        <div class="header-actions">
          <button @click="loadInstitutions" class="refresh-btn" :disabled="loading">
            <i class="fa fa-refresh btn-icon"></i>
            <span class="btn-text">Actualiser</span>
          </button>
          <button @click="openCreateModal" class="create-btn">
            <i class="fa fa-plus btn-icon"></i>
            <span class="btn-text">Nouvelle Institution</span>
          </button>
        </div>
      </div>

      <InstitutionsStatsCards
        :total="overview.total_institutions || 0"
        :active="overview.active_institutions || 0"
        :users="overview.total_users || 0"
        :content="totalContent"
      />

      <!-- Loading State -->
      <ContentLoader v-if="loading" text="Chargement des institutions..." />

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <div class="error-icon"><i class="fa fa-exclamation-triangle"></i></div>
        <h3 class="error-title">Erreur de Chargement</h3>
        <p class="error-message">{{ error }}</p>
        <button @click="loadInstitutions" class="retry-btn">Ressayer</button>
      </div>

      <!-- Empty State -->
      <div v-else-if="institutionsList.length === 0" class="empty-state">
        <i class="fa fa-university empty-icon"></i>
        <h3 class="empty-title">Aucune Institution</h3>
        <p class="empty-message">Aucune institution n'a encore ete creee.</p>
        <button @click="openCreateModal" class="retry-btn" style="margin-top: 16px;">Creer une institution</button>
      </div>

      <!-- Institutions Table -->
      <InstitutionsTable
        v-else
        :institutions="institutionsList"
        :testing-id="testingId"
        @edit="openEditModal"
        @toggle="toggleStatus"
        @test="testConnection"
      />

      <InstitutionModals
        :show-form="showModal"
        :form="form"
        :editing="!!editingInstitution"
        :form-errors="formErrors"
        :saving="saving"
        :connection-result="connectionResult"
        @close="closeModal"
        @save="saveInstitution"
        @close-result="connectionResult = null"
      />
    </div>
  </DashboardLayout>
</template>

<script setup>
/**
 * Gestion des institutions (admin). Orchestrateur (#G1 ≤300) : la donnée et la
 * logique vivent dans useAdminInstitutions ; l'UI est composée de
 * InstitutionsStatsCards, InstitutionsTable et InstitutionModals.
 */
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import InstitutionModals from '@/components/admin/InstitutionModals.vue'
import InstitutionsStatsCards from '@/components/admin/InstitutionsStatsCards.vue'
import InstitutionsTable from '@/components/admin/InstitutionsTable.vue'
import { useAdminInstitutions } from '@/composables/useAdminInstitutions'

const {
  institutionsList, overview, loading, error,
  showModal, editingInstitution, saving, formErrors,
  testingId, connectionResult, form,
  totalContent,
  loadInstitutions, openCreateModal, openEditModal, saveInstitution,
  toggleStatus, testConnection, closeModal,
} = useAdminInstitutions()
</script>

<style scoped lang="scss">
@use '../../assets/styles/admin-shared';

.admin-institutions-container {
  padding: var(--spacing-xl);
  max-width: 1400px;
  margin: 0 auto;
}

.header-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.create-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  background: linear-gradient(135deg, var(--blue-500), var(--color-info-strong));
  border: none;
  border-radius: var(--radius-lg);
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.create-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.btn-icon {
  font-size: 1rem;
}

/* Error & Empty States */
.error-state,
.empty-state {
  text-align: center;
  padding: var(--spacing-3xl);
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
}

.error-icon,
.empty-icon {
  font-size: 4rem;
  opacity: 0.5;
  margin-bottom: var(--spacing-lg);
}

.error-title,
.empty-title {
  font-size: var(--font-size-2xl);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-sm) 0;
}

.error-message,
.empty-message {
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-lg) 0;
}

.retry-btn {
  padding: var(--spacing-md) var(--spacing-xl);
  background: linear-gradient(135deg, var(--blue-500), var(--color-info-strong));
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

/* Responsive */
@media (max-width: 768px) {
  .admin-institutions-container {
    padding: var(--spacing-md);
  }

  .header-section {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
  }

  .header-actions button {
    flex: 1;
  }
}

@media (max-width: 480px) {
  .header-actions {
    flex-direction: column;
  }
}
</style>
