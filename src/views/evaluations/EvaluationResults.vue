<template>
  <DashboardLayout>
    <div class="max-w-4xl mx-auto">
      <!-- Loading -->
      <ContentLoader v-if="loading" text="Chargement des résultats..." />

      <!-- Résultats chargés -->
      <div v-else-if="submission">
        <!-- En-tête avec score -->
        <EvalResultScoreHeader :submission="submission" @back="goBack" />

        <!-- front#693 : l'état du corrigé, un message par mode (plus de délai fixe) -->
        <EvalResultCorrigeStatut v-if="!isCorrectionAvailable" :submission="submission" />

        <!-- Questions avec correction -->
        <div class="space-y-6">
          <h2 class="text-xl font-bold text-primary">Détails des réponses</h2>

          <ResultQuestionCard
            v-for="(question, index) in submission.questions"
            :key="question.id"
            :question="question"
            :index="index"
            :answers="submission.answers || {}"
            :correction-available="isCorrectionAvailable"
            :message-corrige="etatCorrige.message"
          />
        </div>

        <!-- Bouton retour en bas -->
        <div class="mt-8 text-center">
          <button
            @click="goBack"
            class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Retour à mes évaluations
          </button>
        </div>
      </div>

      <!-- Erreur -->
      <div v-else class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p class="text-red-700 text-lg">{{ error || 'Impossible de charger vos résultats' }}</p>
        <button
          @click="goBack"
          class="mt-4 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg"
        >
          Retour
        </button>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
/**
 * Résultats d'une évaluation (étudiant). Orchestrateur (H2 ≤300) : la donnée et
 * l'état de correction vivent dans useEvaluationResults ; l'UI est composée de
 * EvalResultScoreHeader, EvalResultCorrigeStatut et ResultQuestionCard (lui-même
 * délègue les options à ResultChoiceOptions, logique pure dans utils).
 */
import { useRouter } from 'vue-router'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import EvalResultScoreHeader from '@/components/evaluations/EvalResultScoreHeader.vue'
import EvalResultCorrigeStatut from '@/components/evaluations/EvalResultCorrigeStatut.vue'
import ResultQuestionCard from '@/components/evaluations/ResultQuestionCard.vue'
import { useEvaluationResults } from '@/composables/useEvaluationResults'

const router = useRouter()

const {
  submission, loading, error,
  isCorrectionAvailable, etatCorrige,
} = useEvaluationResults()

const goBack = () => router.back()
</script>

<style scoped lang="scss">
@use '../../assets/styles/eval-results-theme';
</style>
