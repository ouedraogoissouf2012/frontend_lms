<template>
  <div class="knowledge-check-player">
    <!-- En attente de demarrage -->
    <QuizPlayerIntro
      v-if="state === 'intro'"
      :quiz="quiz"
      :loading="loading"
      @start="startQuiz"
    />

    <!-- Quiz en cours -->
    <QuizPlayerQuestion
      v-else-if="state === 'playing'"
      :current-question="currentQuestion"
      :current-index="currentIndex"
      :questions="questions"
      :answers="answers"
      :progress-percent="progressPercent"
      :time-limit="timeLimit"
      :time-remaining="timeRemaining"
      :submitting="submitting"
      @select="selectOption"
      @toggle="toggleOption"
      @prev="previousQuestion"
      @next="nextQuestion"
      @goto="goToQuestion"
      @submit="submitQuiz"
    />

    <!-- Resultats -->
    <QuizPlayerResults
      v-else-if="state === 'results'"
      :results="results"
      :questions="questions"
      @retry="resetQuiz"
      @close="$emit('close')"
    />
  </div>
</template>

<script setup>
/**
 * Lecteur de quiz « Testez vos connaissances » (#G6 ; éclaté sous 300 lignes en
 * H5). Orchestrateur : la machine à états et la logique vivent dans
 * useKnowledgeCheckPlayer ; chaque état (intro / playing / results) est rendu par
 * un sous-composant présentationnel. Ce composant ne fait que câbler.
 */
import QuizPlayerIntro from '@/components/lessons/QuizPlayerIntro.vue'
import QuizPlayerQuestion from '@/components/lessons/QuizPlayerQuestion.vue'
import QuizPlayerResults from '@/components/lessons/QuizPlayerResults.vue'
import { useKnowledgeCheckPlayer } from '@/composables/useKnowledgeCheckPlayer'

const props = defineProps({
  quiz: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'completed'])

const {
  state, loading, submitting, questions, answers, currentIndex,
  timeLimit, timeRemaining, currentQuestion, progressPercent, results,
  startQuiz, selectOption, toggleOption, previousQuestion, nextQuestion,
  goToQuestion, submitQuiz, resetQuiz
} = useKnowledgeCheckPlayer(props, emit)
</script>

<style scoped>
.knowledge-check-player {
  background: var(--bg-primary);
  border-radius: 12px;
  overflow: hidden;
}
</style>
