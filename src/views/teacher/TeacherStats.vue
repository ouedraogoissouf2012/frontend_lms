<template>
  <DashboardLayout>
    <div class="stats-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Mes Statistiques</h1>
          <p class="page-subtitle">Consultez vos statistiques personnelles et performances</p>
        </div>
      </div>

      <!-- Loading state -->
      <ContentLoader v-if="loading" text="Chargement des statistiques..." />

      <!-- Error state -->
      <div v-if="error" class="error-state">
        <div class="error-icon"><i class="fa fa-exclamation-triangle"></i></div>
        <div class="error-content">
          <h3 class="error-title">Erreur de chargement</h3>
          <p class="error-message">{{ error }}</p>
        </div>
        <button @click="loadStats" class="error-retry-btn">
          Réessayer
        </button>
      </div>

      <!-- Stats Content -->
      <div v-if="!loading && !error && stats">
        <!-- Statistiques Globales -->
        <TeacherStatsGlobalCards :stats="stats" />

        <!-- Grilles Détaillées -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <TeacherStatsPerMatiere :matieres="stats.par_matiere" />
          <TeacherStatsActivity :stats="stats" />
        </div>

        <!-- Widget Classes -->
        <TeacherStatsParClasse :classes="stats.par_classe" />

        <!-- Actions Rapides -->
        <TeacherStatsQuickActions />
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
/**
 * Statistiques enseignant — orchestrateur (#H11 ≤300). La donnée/logique vit
 * dans useTeacherStats ; l'UI est composée de TeacherStatsGlobalCards,
 * TeacherStatsPerMatiere, TeacherStatsActivity, TeacherStatsParClasse et
 * TeacherStatsQuickActions.
 */
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import TeacherStatsGlobalCards from '@/components/teacher/TeacherStatsGlobalCards.vue'
import TeacherStatsPerMatiere from '@/components/teacher/TeacherStatsPerMatiere.vue'
import TeacherStatsActivity from '@/components/teacher/TeacherStatsActivity.vue'
import TeacherStatsParClasse from '@/components/teacher/TeacherStatsParClasse.vue'
import TeacherStatsQuickActions from '@/components/teacher/TeacherStatsQuickActions.vue'
import { useTeacherStats } from '@/composables/useTeacherStats'

const { stats, loading, error, loadStats } = useTeacherStats()
</script>

<style scoped>
.stats-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0;
}

.page-header {
  margin-bottom: 2rem;
}

.page-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.page-subtitle {
  color: var(--text-secondary);
  font-size: 1rem;
}

/* Error State */
.error-state {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem;
  background: #FEF2F2;
  border: 1px solid #FCA5A5;
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
}

.error-icon {
  font-size: 2rem;
  color: #DC2626;
  flex-shrink: 0;
}

.error-content {
  flex: 1;
}

.error-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #991B1B;
  margin: 0 0 0.5rem 0;
}

.error-message {
  color: #B91C1C;
  margin: 0;
}

.error-retry-btn {
  padding: 0.75rem 1.5rem;
  background: #DC2626;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.error-retry-btn:hover {
  background: #B91C1C;
  transform: scale(1.02);
}

@media (max-width: 768px) {
  .error-state {
    flex-direction: column;
    text-align: center;
  }

  .error-retry-btn {
    width: 100%;
  }
}
</style>
