<template>
  <DashboardLayout>
    <div class="courses-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Mes Cours</h1>
          <p class="page-subtitle">Tous vos cours disponibles</p>
        </div>
      </div>

      <!-- Filtres -->
      <CoursesFilters
        v-if="availableFilters.matieres.length > 0 || availableFilters.enseignants.length > 0"
        :availableFilters="availableFilters"
        v-model:selectedMatiere="selectedMatiere"
        v-model:selectedEnseignant="selectedEnseignant"
        @apply="applyFilters"
        @reset="resetFilters"
      />

      <!-- Loading state -->
      <ContentLoader v-if="loading" text="Chargement des cours..." />

      <!-- Error state -->
      <div v-if="error" class="error-state">
        <div class="error-icon"><i class="fa fa-exclamation-triangle"></i></div>
        <div class="error-content">
          <h3 class="error-title">Erreur de chargement</h3>
          <p class="error-message">{{ error }}</p>
        </div>
        <button @click="loadCourses" class="error-retry-btn">
          Réessayer
        </button>
      </div>

      <!-- Courses Grid -->
      <div v-if="!loading && !error && courses.length > 0" class="courses-grid">
        <CourseCard
          v-for="course in courses"
          :key="course.id"
          :course="course"
          @select="navigateToCourse(course)"
        />
      </div>

      <!-- Empty state -->
      <div v-else-if="!loading && !error" class="empty-state">
        <div class="empty-icon-wrapper">
          <i class="fa fa-book empty-icon"></i>
        </div>
        <h3 class="empty-title">Aucun cours disponible</h3>
        <p class="empty-description">
          <template v-if="selectedMatiere || selectedEnseignant">
            Aucun cours ne correspond à vos filtres.<br>
            Essayez de modifier vos critères de recherche.
          </template>
          <template v-else>
            Vos enseignants n'ont pas encore publié de cours.<br>
            Revenez plus tard pour consulter les nouveaux cours.
          </template>
        </p>
        <div class="empty-actions">
          <button v-if="selectedMatiere || selectedEnseignant" @click="resetFilters" class="btn-reload">
            Effacer les filtres
          </button>
          <button @click="loadCourses" class="btn-reload" aria-label="Actualiser la liste des cours">
            Actualiser
          </button>
          <router-link to="/student/dashboard" class="btn-secondary-link" aria-label="Retourner au tableau de bord">
            Retour au dashboard
          </router-link>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
/**
 * Mes Cours (élève). Orchestrateur (#G1 ≤300) : la donnée et la logique vivent
 * dans useStudentCourses ; l'UI est composée de CoursesFilters et CourseCard.
 */
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import CoursesFilters from '@/components/student/CoursesFilters.vue'
import CourseCard from '@/components/student/CourseCard.vue'
import { useStudentCourses } from '@/composables/useStudentCourses'

defineOptions({ name: 'StudentCourses' })

const {
  courses,
  loading,
  error,
  selectedMatiere,
  selectedEnseignant,
  availableFilters,
  loadCourses,
  applyFilters,
  resetFilters,
  navigateToCourse,
} = useStudentCourses()
</script>

<style scoped>
.courses-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0;
}

.page-header {
  margin-bottom: 1.5rem;
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

/* Courses Grid */
.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
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
  font-size: 3rem;
  color: var(--text-secondary);
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

.empty-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-reload, .btn-secondary-link {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  font-size: 1rem;
  text-decoration: none;
  display: inline-block;
}

.btn-reload {
  background: linear-gradient(135deg, var(--blue-500) 0%, #2563eb 100%);
  color: white;
}

.btn-reload:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  transform: translateY(-2px);
}

.btn-secondary-link {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.btn-secondary-link:hover {
  background: var(--bg-tertiary);
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
  .courses-grid {
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
