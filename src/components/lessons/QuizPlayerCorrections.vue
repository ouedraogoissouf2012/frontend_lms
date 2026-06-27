<template>
  <div v-if="answers && answers.length > 0" class="corrections">
    <h4>Correction</h4>
    <div
      v-for="(answer, index) in answers"
      :key="index"
      class="correction-item"
      :class="{ correct: answer.is_correct, incorrect: !answer.is_correct }"
    >
      <div class="correction-header">
        <i class="material-icons">{{ answer.is_correct ? 'check_circle' : 'cancel' }}</i>
        <span class="correction-question">{{ questions[answer.question_index]?.question }}</span>
      </div>
      <div class="correction-body">
        <p v-if="!answer.is_correct && answer.correct_answer !== null">
          <strong>Bonne reponse:</strong>
          {{ getAnswerText(answer.question_index, answer.correct_answer) }}
        </p>
        <p v-if="answer.explanation" class="explanation">
          <i class="material-icons">lightbulb</i>
          {{ answer.explanation }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Corrections par question du lecteur de quiz (#G6 ; éclaté sous 300 lignes en
 * H5). Sous-composant présentationnel extrait de QuizPlayerResults.vue : pour
 * chaque réponse, indique correct/incorrect, la bonne réponse attendue et
 * l'explication. Le helper d'affichage pur getAnswerText (lecture des questions)
 * est local.
 */
const props = defineProps({
  answers: { type: Array, default: () => [] },
  questions: { type: Array, default: () => [] }
})

function getAnswerText(questionIndex, answerValue) {
  const q = props.questions[questionIndex]
  if (!q) return ''

  if (Array.isArray(answerValue)) {
    return answerValue.map(i => q.options[i]).join(', ')
  }

  return q.options[answerValue] || ''
}
</script>

<style scoped>
.corrections {
  margin-bottom: 2rem;
}

.corrections h4 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 1rem 0;
}

.correction-item {
  margin-bottom: 1rem;
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid;
}

.correction-item.correct {
  background: rgba(16, 185, 129, 0.1);
  border-color: var(--emerald-500);
}

.correction-item.incorrect {
  background: rgba(239, 68, 68, 0.1);
  border-color: var(--red-500);
}

.correction-header {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.correction-header i {
  font-size: 1.25rem;
}

.correction-item.correct .correction-header i {
  color: var(--emerald-500);
}

.correction-item.incorrect .correction-header i {
  color: var(--red-500);
}

.correction-question {
  font-weight: 500;
  color: var(--text-primary);
}

.correction-body {
  padding-left: 1.75rem;
}

.correction-body p {
  margin: 0.25rem 0;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.explanation {
  display: flex;
  align-items: flex-start;
  gap: 0.375rem;
  margin-top: 0.5rem !important;
  padding: 0.5rem;
  background: rgba(99, 102, 241, 0.1);
  border-radius: 6px;
  color: var(--indigo-600) !important;
}

.explanation i {
  font-size: 1rem;
  flex-shrink: 0;
}
</style>
