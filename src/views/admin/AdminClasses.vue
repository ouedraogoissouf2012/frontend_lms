<template>
  <DashboardLayout>
    <div class="classes-container">
      <!-- Header -->
      <div class="welcome-header">
        <i class="fa fa-home welcome-icon"></i>
        <div>
          <h1 class="page-title">Gestion des Classes</h1>
          <p class="page-subtitle">Gérez toutes les classes de l'établissement</p>
        </div>
      </div>

      <!-- Statistics -->
      <ClassesStatsCards v-if="!loading && !error" :stats="stats" />

      <!-- Filters -->
      <ClassesFilters
        v-if="!loading && !error"
        v-model:filiere-id="filters.filiere_id"
        v-model:niveau-id="filters.niveau_id"
        v-model:statut="filters.statut"
        :filieres="filieres"
        :niveaux="niveaux"
        @apply="applyFilters"
        @reset="resetFilters"
      />

      <!-- Loading state -->
      <ContentLoader v-if="loading" text="Chargement des classes..." />

      <!-- Error state -->
      <div v-else-if="error" class="error-state">
        <div class="error-icon"><i class="fa fa-exclamation-triangle"></i></div>
        <div class="error-content">
          <h3 class="error-title">Erreur de chargement</h3>
          <p class="error-message">{{ error }}</p>
        </div>
        <button @click="loadClasses" class="error-retry-btn">
          <span class="btn-icon">🔄</span>
          Réessayer
        </button>
      </div>

      <!-- Classes Grid -->
      <div v-else-if="filteredClasses.length > 0" class="classes-grid">
        <ClassCard
          v-for="classe in filteredClasses"
          :key="classe.id"
          :classe="classe"
          @view="viewClasseDetails"
        />
      </div>

      <!-- Empty state -->
      <div v-else class="empty-state">
        <span class="empty-icon">☹</span>
        <h3 class="empty-title">Aucune classe trouvée</h3>
        <p class="empty-message">
          {{ filters.filiere_id || filters.niveau_id || filters.statut
            ? 'Aucune classe ne correspond à vos filtres'
            : 'Aucune classe disponible dans le système' }}
        </p>
        <button
          v-if="filters.filiere_id || filters.niveau_id || filters.statut"
          @click="resetFilters"
          class="btn-empty"
        >
          Réinitialiser les filtres
        </button>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
/**
 * Gestion des classes (admin). Orchestrateur (#G1 ≤300) : la donnée et la logique
 * vivent dans useAdminClasses ; l'UI est composée de ClassesStatsCards,
 * ClassesFilters et de la grille de ClassCard.
 */
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ClassCard from '@/components/admin/ClassCard.vue'
import ClassesStatsCards from '@/components/admin/ClassesStatsCards.vue'
import ClassesFilters from '@/components/admin/ClassesFilters.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import { useAdminClasses } from '@/composables/useAdminClasses'

const {
  filieres, niveaux, loading, error, filters,
  filteredClasses, stats,
  loadClasses, applyFilters, resetFilters, viewClasseDetails,
} = useAdminClasses()
</script>

<style scoped>
.classes-container {
  padding: 2rem;
}

.welcome-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.welcome-icon {
  font-size: 2.5rem;
  line-height: 1;
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

/* Class cards */
.classes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.btn-icon {
  font-size: 1.25rem;
  line-height: 1;
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
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

/* Empty State */
.empty-state {
  text-align: center;
  padding: 3rem 2rem;
}

.empty-icon {
  font-size: 3rem;
  line-height: 1;
  margin: 0 auto 1rem;
  color: var(--text-tertiary);
}

.empty-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
}

.empty-message {
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 2rem;
}

.btn-empty {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, var(--blue-500) 0%, var(--color-info-strong) 100%);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-empty:hover {
  background: linear-gradient(135deg, var(--color-info-strong) 0%, var(--color-info-stronger) 100%);
  transform: translateY(-2px);
}

/* Responsive */
/* Responsive */
@media (max-width: 768px) {
  .classes-container {
    padding: 1rem;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .classes-grid {
    grid-template-columns: 1fr;
  }

  .error-state {
    flex-direction: column;
    text-align: center;
  }

  .error-retry-btn {
    width: 100%;
  }
}</style>
