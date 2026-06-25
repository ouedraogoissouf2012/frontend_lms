<template>
  <DashboardLayout>
    <div class="dashboard-content">
      <!-- Header -->
      <div class="page-header">
        <h1 class="page-title">Mes Matières</h1>
        <p class="page-subtitle">
          Gérez vos matières et créez des leçons
        </p>
      </div>

      <!-- Loading state -->
      <ContentLoader v-if="loading" text="Chargement des matières..." />

      <!-- Error state -->
      <div v-else-if="error" class="error-state">
        <div class="error-icon"><i class="fa fa-exclamation-triangle"></i></div>
        <div class="error-content">
          <h3 class="error-title">Erreur de chargement</h3>
          <p class="error-message">{{ error }}</p>
        </div>
        <button @click="loadMatieres" class="error-retry-btn">
          Réessayer
        </button>
      </div>

      <!-- Grille de matières -->
      <div v-else-if="matieres && matieres.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MatiereCourseCard
          v-for="matiere in matieres"
          :key="matiere.id || matiere.matiere_id"
          :matiere="matiere"
          @navigate="navigateToMatiere(matiere)"
        />
      </div>

      <!-- Empty state -->
      <div v-else class="empty-state-inline">
        <p class="empty-message">Aucune matière assignée</p>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
/**
 * Mes Matières (enseignant) (#H9 ≤300). Orchestrateur : donnees/logique dans
 * useTeacherMatieres ; chaque matiere est rendue par MatiereCourseCard.
 */
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import MatiereCourseCard from '@/components/teacher/MatiereCourseCard.vue'
import { useTeacherMatieres } from '@/composables/useTeacherMatieres'

const { loading, error, matieres, loadMatieres, navigateToMatiere } = useTeacherMatieres()
</script>

<style scoped>
.dashboard-content {
  padding: 2rem;
}

.page-header {
  margin-bottom: 2rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.page-subtitle {
  font-size: 1rem;
  color: var(--text-secondary);
}

/* Loading */
.loading-container {
  padding: 2rem 0;
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

/* Empty state inline */
.empty-state-inline {
  padding: 4rem 2rem;
  text-align: center;
}

.empty-message {
  color: var(--text-secondary);
  font-size: 1rem;
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
