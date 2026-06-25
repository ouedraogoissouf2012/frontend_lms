<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-6xl mx-auto px-4">
      <!-- En-tête -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Mes Évaluations</h1>
        <p class="text-gray-600 mt-2">Consultez et passez vos évaluations en ligne</p>
      </div>

      <!-- Loading -->
      <ContentLoader v-if="loading" text="Chargement des évaluations..." />

      <!-- Erreur -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {{ error }}
      </div>

      <!-- Liste des évaluations -->
      <div v-else>
        <div v-if="evaluations.length === 0" class="text-center py-12">
          <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <p class="text-gray-600 text-lg">Aucune évaluation disponible pour le moment</p>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StudentEvaluationCard
            v-for="evaluation in evaluations"
            :key="evaluation.id"
            :evaluation="evaluation"
            @start="startEvaluation"
            @continue="continueEvaluation"
            @retake="retakeEvaluation"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Mes évaluations (étudiant). Orchestrateur (H2 ≤300) : la donnée et la logique
 * vivent dans useStudentEvaluations ; chaque évaluation est rendue par
 * StudentEvaluationCard. La vue ne garde que l'en-tête et les états de chargement.
 */
import ContentLoader from '@/components/common/ContentLoader.vue'
import StudentEvaluationCard from '@/components/evaluations/StudentEvaluationCard.vue'
import { useStudentEvaluations } from '@/composables/useStudentEvaluations'

const {
  evaluations, loading, error,
  startEvaluation, continueEvaluation, retakeEvaluation,
} = useStudentEvaluations()
</script>
