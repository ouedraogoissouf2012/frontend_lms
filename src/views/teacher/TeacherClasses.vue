<template>
  <DashboardLayout>
    <div class="classes-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Mes Classes</h1>
          <p class="page-subtitle">Consultez vos classes et leurs etudiants</p>
        </div>
        <router-link to="/teacher/hub" class="btn-back">
          <i class="fa fa-arrow-left"></i>
          Retour a Mon Espace
        </router-link>
      </div>

      <!-- Loading state -->
      <ContentLoader v-if="loading" text="Chargement des classes..." />

      <!-- Error state -->
      <div v-if="error" class="error-state">
        <div class="error-icon"><i class="fa fa-exclamation-triangle"></i></div>
        <div class="error-content">
          <h3 class="error-title">Erreur de chargement</h3>
          <p class="error-message">{{ error }}</p>
        </div>
        <button @click="loadClasses" class="error-retry-btn">
          Réessayer
        </button>
      </div>

      <!-- Classes Grid -->
      <div v-if="!loading && !error && classes.length > 0" class="classes-grid">
        <TeacherClassCard
          v-for="classe in classes"
          :key="classe.id"
          :classe="classe"
        />
      </div>

      <!-- Empty state -->
      <div v-else-if="!loading && !error" class="empty-state">
        <div class="empty-icon-wrapper">
          <BuildingLibraryIcon class="empty-icon" />
        </div>
        <h3 class="empty-title">Aucune classe assignée</h3>
        <p class="empty-description">
          Vous n'avez pas encore de classes assignées.<br>
          Contactez votre coordinateur pour plus d'informations.
        </p>
        <button @click="loadClasses" class="btn-reload">
          Actualiser
        </button>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
/**
 * Mes Classes (enseignant) (#H9 ≤300). Orchestrateur : donnees/logique dans
 * useTeacherClasses ; chaque classe est rendue par TeacherClassCard.
 */
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import TeacherClassCard from '@/components/teacher/TeacherClassCard.vue'
import { BuildingLibraryIcon } from '@heroicons/vue/24/outline'
import { useTeacherClasses } from '@/composables/useTeacherClasses'

const { classes, loading, error, loadClasses } = useTeacherClasses()
</script>

<style scoped>
.classes-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
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

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: var(--bg-secondary);
  color: var(--text-primary);
  border-radius: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem;
  text-decoration: none;
  transition: all 0.2s;
  border: 1px solid var(--border-primary);
}

.btn-back:hover {
  background: var(--bg-hover);
  border-color: var(--primary-color, var(--blue-500));
  color: var(--primary-color, var(--blue-500));
}

.classes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

/* Empty state */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  max-width: 600px;
  margin: 0 auto;
}

.empty-icon-wrapper {
  display: inline-flex;
  padding: 1.5rem;
  background: var(--bg-secondary);
  border-radius: 50%;
  margin-bottom: 1.5rem;
}

.empty-icon {
  width: 3rem;
  height: 3rem;
  color: var(--text-tertiary);
}

.empty-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
}

.empty-description {
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 2rem;
}

.btn-reload {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, var(--blue-500) 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-reload:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  transform: translateY(-2px);
}

/* Error State */
.error-state {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem;
  background: #FEF2F2;
  border: 1px solid var(--error-border);
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
  color: var(--error-text);
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
}
</style>
