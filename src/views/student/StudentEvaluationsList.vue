<template>
  <DashboardLayout>
    <div class="evaluations-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Mes Évaluations</h1>
          <p class="page-subtitle">Consultez et passez vos évaluations en ligne</p>
        </div>
      </div>

      <!-- Loading state -->
      <ContentLoader v-if="loading" text="Chargement des evaluations..." />

      <!-- Error state -->
      <div v-else-if="error" class="error-state">
        <div class="error-icon"><i class="fa fa-exclamation-triangle"></i></div>
        <div class="error-content">
          <h3 class="error-title">Erreur de chargement</h3>
          <p class="error-message">{{ error }}</p>
        </div>
        <button @click="loadEvaluations" class="error-retry-btn">
          Réessayer
        </button>
      </div>

      <template v-else>
        <!-- Section: Évaluations à faire (fenêtre ouverte ou pas encore ouverte, sans soumission terminée) -->
        <div v-if="evaluationsAFaire.length > 0" class="section">
          <h2 class="section-title"><i class="fa fa-pencil-square-o"></i> Évaluations à faire</h2>
          <div class="evaluations-list">
            <StudentEvalTodoCard
              v-for="evaluation in evaluationsAFaire"
              :key="'todo-' + evaluation.id"
              :evaluation="evaluation"
              @start="startEvaluation"
              @continue="continueEvaluation"
            />
          </div>
        </div>

        <!-- Section: Évaluations terminées (avec note) -->
        <div v-if="evaluationsTerminees.length > 0" class="section">
          <h2 class="section-title"><i class="fa fa-check-circle"></i> Évaluations terminées</h2>
          <div class="evaluations-list">
            <StudentEvalDoneCard
              v-for="evaluation in evaluationsTerminees"
              :key="'done-' + evaluation.id"
              :evaluation="evaluation"
              @view-results="viewResults"
              @start="startEvaluation"
            />
          </div>
        </div>

        <!-- Section: S'entraîner (passées, jamais soumises) -->
        <div v-if="evaluationsEntrainement.length > 0" class="section">
          <h2 class="section-title"><i class="fa fa-graduation-cap"></i> S'entraîner</h2>
          <p class="section-description">Ces évaluations sont passées mais vous pouvez vous y exercer pour progresser.</p>
          <div class="evaluations-list">
            <StudentEvalPracticeCard
              v-for="evaluation in evaluationsEntrainement"
              :key="'practice-' + evaluation.id"
              :evaluation="evaluation"
              @start="startEvaluation"
            />
          </div>
        </div>

        <!-- Empty state -->
        <div v-if="evaluations.length === 0" class="empty-state">
          <div class="empty-icon-wrapper">
            <DocumentTextIcon class="empty-icon" />
          </div>
          <h3 class="empty-title">Aucune évaluation disponible</h3>
          <p class="empty-description">
            Vous n'avez pas encore d'évaluations à effectuer.<br>
            Les nouvelles évaluations apparaîtront ici une fois programmées.
          </p>
          <div class="empty-actions">
            <button @click="loadEvaluations" class="btn-action btn-start">
              Actualiser
            </button>
          </div>
        </div>
      </template>
    </div>
  </DashboardLayout>
</template>

<script setup>
/**
 * Mes évaluations — liste segmentée (étudiant). Orchestrateur (H2 ≤300) : la
 * donnée et la logique vivent dans useStudentEvaluationsList ; chaque section est
 * rendue par StudentEvalTodoCard / StudentEvalDoneCard / StudentEvalPracticeCard.
 */
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import { DocumentTextIcon } from '@heroicons/vue/24/outline'
import StudentEvalTodoCard from '@/components/student/StudentEvalTodoCard.vue'
import StudentEvalDoneCard from '@/components/student/StudentEvalDoneCard.vue'
import StudentEvalPracticeCard from '@/components/student/StudentEvalPracticeCard.vue'
import { useStudentEvaluationsList } from '@/composables/useStudentEvaluationsList'

const {
  evaluations, loading, error,
  evaluationsAFaire, evaluationsTerminees, evaluationsEntrainement,
  loadEvaluations, startEvaluation, continueEvaluation, viewResults,
} = useStudentEvaluationsList()
</script>

<style scoped>
.evaluations-container {
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

/* Sections */
.section {
  margin-bottom: 2.5rem;
}

.section-title {
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-description {
  color: var(--text-secondary);
  font-size: 0.875rem;
  margin: 0 0 1.25rem 0;
}

/* Cards */
.evaluations-list {
  display: grid;
  gap: 1.25rem;
}

/* Empty state */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  max-width: 500px;
  margin: 0 auto;
}

.empty-icon-wrapper {
  display: inline-flex;
  padding: 1.5rem;
  background: var(--bg-secondary, #f3f4f6);
  border-radius: 50%;
  margin-bottom: 1.5rem;
}

.empty-icon {
  width: 3rem;
  height: 3rem;
  color: var(--text-tertiary);
}

.empty-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.75rem 0;
}

.empty-description {
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0 0 2rem 0;
}

.empty-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

/* Empty state action button (chrome de bouton repris du partial de carte) */
.btn-action {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-start {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: white;
}

.btn-start:hover {
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  transform: translateY(-1px);
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
  font-size: 1rem;
  font-weight: 700;
  color: #991B1B;
  margin: 0 0 0.25rem 0;
}

.error-message {
  color: #B91C1C;
  margin: 0;
  font-size: 0.875rem;
}

.error-retry-btn {
  padding: 0.625rem 1.25rem;
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
}

/* Responsive */
@media (max-width: 768px) {
  .btn-action {
    justify-content: center;
    width: 100%;
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
