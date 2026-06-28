<template>
  <DashboardLayout>
    <div class="lessons-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Mes Leçons</h1>
          <p class="page-subtitle">Consultez toutes vos leçons. Pour créer une nouvelle leçon, allez dans Matières → Sélectionnez une matière → Créer une leçon</p>
        </div>
      </div>

      <!-- Filtres -->
      <LessonsFilters
        v-model:matiere-id="filters.matiere_id"
        v-model:status="filters.status"
        v-model:type="filters.type"
        :matieres="matieres"
        @apply="applyFilters"
        @reset="resetFilters"
      />

      <!-- Loading state -->
      <ContentLoader v-if="loading" text="Chargement des leçons..." />

      <!-- Error state -->
      <div v-if="error" class="error-state">
        <div class="error-icon"><i class="fa fa-exclamation-triangle"></i></div>
        <div class="error-content">
          <h3 class="error-title">Erreur de chargement</h3>
          <p class="error-message">{{ error }}</p>
        </div>
        <button @click="loadLessons" class="error-retry-btn">
          Réessayer
        </button>
      </div>

      <!-- Content -->
      <div v-if="!loading && !error">
        <!-- Statistiques -->
        <LessonsStatsGrid :stats="stats" />

        <!-- Liste des Leçons -->
        <div v-if="filteredLessons.length > 0" class="lessons-grid">
          <TeacherLessonCard
            v-for="lesson in filteredLessons"
            :key="lesson.id"
            :lesson="lesson"
            :matieres="matieres"
            @view="viewChapters"
          />
        </div>

        <!-- Empty state -->
        <LessonsEmptyState
          v-else
          :has-filters="!!(filters.matiere_id || filters.status || filters.type)"
        />
      </div>
    </div>

    <!-- Modal Création/Édition Leçon -->
    <LessonFormModal
      :show="showCreateModal"
      :editing-lesson="editingLesson"
      :saving="saving"
      :matieres="matieres"
      v-model:matiere-id="lessonForm.matiere_id"
      v-model:title="lessonForm.title"
      v-model:type="lessonForm.type"
      v-model:description="lessonForm.description"
      v-model:status="lessonForm.status"
      @close="closeModal"
      @save="saveLesson"
    />
  </DashboardLayout>
</template>

<script setup>
/**
 * Mes Leçons (enseignant) — orchestrateur (#H4 ≤300). Données/logique dans
 * useTeacherLessons ; UI composée de LessonsFilters, LessonsStatsGrid,
 * TeacherLessonCard, LessonsEmptyState et LessonFormModal. Header, état d'erreur et
 * grille restent ici.
 */
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import LessonsFilters from '@/components/lessons/LessonsFilters.vue'
import LessonsStatsGrid from '@/components/lessons/LessonsStatsGrid.vue'
import TeacherLessonCard from '@/components/lessons/TeacherLessonCard.vue'
import LessonsEmptyState from '@/components/lessons/LessonsEmptyState.vue'
import LessonFormModal from '@/components/lessons/LessonFormModal.vue'
import { useTeacherLessons } from '@/composables/useTeacherLessons'

const {
  matieres,
  loading,
  error,
  showCreateModal,
  editingLesson,
  saving,
  filters,
  lessonForm,
  filteredLessons,
  stats,
  loadLessons,
  applyFilters,
  resetFilters,
  viewChapters,
  saveLesson,
  closeModal
} = useTeacherLessons()
</script>

<style scoped>
.lessons-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
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

.btn-create {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #3b82f6 0%, var(--color-info-strong) 100%);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-create:hover {
  background: linear-gradient(135deg, var(--color-info-strong) 0%, var(--color-info-stronger) 100%);
  transform: translateY(-2px);
}

/* Liste Leçons */
.lessons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
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
  color: #991B1B;
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

/* Responsive */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 1rem;
  }

  .btn-create {
    width: 100%;
    justify-content: center;
  }

  .lessons-grid {
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
