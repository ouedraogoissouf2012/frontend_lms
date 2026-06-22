<template>
  <DashboardLayout>
    <div class="admin-users-container">
      <!-- Header Section -->
      <div class="header-section">
        <div class="header-content">
          <h1 class="page-title">Gestion des Utilisateurs</h1>
          <p class="page-subtitle">Enseignants, étudiants et autres utilisateurs de l'institution</p>
        </div>
        <button @click="loadAllUsers(true)" class="refresh-btn" :disabled="loading">
          <i class="fa fa-refresh btn-icon"></i>
          <span class="btn-text">Actualiser</span>
        </button>
      </div>

      <UsersStatsCards
        :total="totalUsers"
        :etudiants="etudiants.length"
        :enseignants="enseignants.length"
        :classes="classes.length"
      />

      <UsersFilters
        v-model:search="searchQuery"
        v-model:role="filterRole"
        v-model:classe="filterClasse"
        :classes="classes"
      />

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p class="loading-text">Chargement des utilisateurs...</p>
        <p v-if="loadingProgress" class="loading-progress">{{ loadingProgress }}</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <div class="error-icon"><i class="fa fa-exclamation-triangle"></i></div>
        <h3 class="error-title">Erreur de Chargement</h3>
        <p class="error-message">{{ error }}</p>
        <button @click="loadAllUsers()" class="retry-btn">Réessayer</button>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredUsers.length === 0 && !loading" class="empty-state">
        <i class="fa fa-users empty-icon"></i>
        <h3 class="empty-title">Aucun Utilisateur Trouvé</h3>
        <p class="empty-message" v-if="searchQuery || filterRole !== 'all' || filterClasse !== 'all'">
          Aucun résultat pour les filtres sélectionnés. Essayez de modifier vos critères.
        </p>
        <p class="empty-message" v-else>
          Aucun utilisateur n'a été trouvé dans le système KLASSCI.
        </p>
      </div>

      <!-- Users Table -->
      <UsersTable
        v-else
        :users="paginatedUsers"
        :sort-field="sortField"
        :sort-asc="sortAsc"
        v-model:current-page="currentPage"
        :total-pages="totalPages"
        :filtered-count="filteredUsers.length"
        @sort="sortBy"
        @select="selectUser"
      />

      <UserDetailModal :user="selectedUser" @close="closeModal" />
    </div>
  </DashboardLayout>
</template>

<script setup>
/**
 * Gestion des utilisateurs (admin). Orchestrateur (#G1 ≤300) : la donnée et la
 * logique vivent dans useAdminUsers ; l'UI est composée de UsersStatsCards,
 * UsersFilters, UsersTable et UserDetailModal.
 */
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import UserDetailModal from '@/components/admin/UserDetailModal.vue'
import UsersStatsCards from '@/components/admin/UsersStatsCards.vue'
import UsersFilters from '@/components/admin/UsersFilters.vue'
import UsersTable from '@/components/admin/UsersTable.vue'
import { useAdminUsers } from '@/composables/useAdminUsers'

const {
  etudiants, enseignants, classes, loading, loadingProgress, error, selectedUser,
  searchQuery, filterRole, filterClasse, currentPage, sortField, sortAsc,
  totalUsers, filteredUsers, totalPages, paginatedUsers,
  sortBy, selectUser, closeModal, loadAllUsers,
} = useAdminUsers()
</script>

<style scoped lang="scss">
@use '../../assets/styles/admin-shared';

.admin-users-container {
  padding: var(--spacing-xl);
  max-width: 1400px;
  margin: 0 auto;
}

.btn-icon {
  font-size: 1.25rem;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4rem 2rem;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--border-color);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  margin-top: var(--spacing-lg);
  color: var(--text-secondary);
  font-size: var(--font-size-md);
}

.loading-progress {
  color: var(--text-tertiary);
  font-size: var(--font-size-sm);
  margin-top: var(--spacing-xs);
}

/* Error / Empty States */
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4rem 2rem;
  text-align: center;
}

.error-icon {
  font-size: 3rem;
  color: #ef4444;
  margin-bottom: var(--spacing-lg);
}

.error-title,
.empty-title {
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

.error-message {
  color: var(--text-secondary);
  margin-bottom: var(--spacing-lg);
}

.retry-btn {
  padding: var(--spacing-md) var(--spacing-xl);
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  font-weight: 500;
}

.retry-btn:hover {
  opacity: 0.9;
}

.empty-icon {
  font-size: 4rem;
  color: var(--text-tertiary);
  margin-bottom: var(--spacing-lg);
}

.empty-message {
  color: var(--text-secondary);
  max-width: 400px;
}

@media (max-width: 768px) {
  .admin-users-container {
    padding: var(--spacing-md);
  }

  .header-section {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
