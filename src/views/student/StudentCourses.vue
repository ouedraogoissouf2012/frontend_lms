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
      <div
        v-if="!loading && !error && courses.length > 0"
        ref="gridRef"
        class="courses-grid"
        :aria-busy="loadingMore"
      >
        <CourseCard
          v-for="course in courses"
          :key="course.id"
          :course="course"
          @select="navigateToCourse(course)"
        />
      </div>

      <!-- Empty state -->
      <CoursesEmptyState
        v-else-if="!loading && !error"
        :filtered="!!(selectedMatiere || selectedEnseignant)"
        @reset="resetFilters"
        @reload="loadCourses"
      />

      <!-- Pied de liste (#434) : rendu DÈS LE MONTAGE, pour que sa région d'annonce existe. -->
      <CoursesLoadMore
        :shown="courses.length"
        :total="loading || error ? null : totalCount"
        :has-more="!loading && !error && hasMore"
        :loading="loadingMore"
        :error="loadMoreError"
        @more="onLoadMore"
      />
    </div>
  </DashboardLayout>
</template>

<script setup>
/**
 * Mes Cours (élève). Orchestrateur (#G1 ≤300) : la donnée et la logique vivent
 * dans useStudentCourses ; l'UI est composée de CoursesFilters, CourseCard,
 * CoursesEmptyState et CoursesLoadMore.
 */
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import CoursesFilters from '@/components/student/CoursesFilters.vue'
import CourseCard from '@/components/student/CourseCard.vue'
import CoursesLoadMore from '@/components/student/CoursesLoadMore.vue'
import CoursesEmptyState from '@/components/student/CoursesEmptyState.vue'
import { ref, nextTick } from 'vue'
import { useStudentCourses } from '@/composables/useStudentCourses'

defineOptions({ name: 'StudentCourses' })

const {
  courses,
  loading,
  error,
  selectedMatiere,
  selectedEnseignant,
  availableFilters,
  totalCount,
  hasMore,
  loadingMore,
  loadMoreError,
  loadCourses,
  loadMore,
  applyFilters,
  resetFilters,
  navigateToCourse,
} = useStudentCourses()

const gridRef = ref(null)

/**
 * Le focus reste sur « Charger plus » tant qu'il existe. Quand il disparaît (fin de
 * liste), le focus passerait à <body> : on le pose sur la première carte ajoutée.
 */
async function onLoadMore() {
  const firstNewIndex = courses.value.length
  await loadMore()
  if (hasMore.value) return
  await nextTick()
  gridRef.value?.querySelectorAll('.course-card')[firstNewIndex]?.focus()
}
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

/* Error State */
.error-state {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem;
  background: var(--red-50);
  border: 1px solid var(--error-border);
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
