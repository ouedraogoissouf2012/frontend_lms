<template>
  <div class="bg-card rounded-lg shadow-md p-6 mb-6">
    <div class="flex justify-between items-start mb-4">
      <div>
        <h1 class="text-2xl font-bold text-primary">{{ submission.evaluation.titre }}</h1>
        <p class="text-secondary text-sm mt-1">Évaluation terminée le {{ formatDate(submission.submitted_at) }}</p>
      </div>
      <button
        @click="$emit('back')"
        class="px-4 py-2 text-secondary hover:text-primary flex items-center gap-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
        </svg>
        Retour
      </button>
    </div>

    <!-- Score principal -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
      <div class="score-card score-card-note">
        <p class="score-label">Note finale</p>
        <p class="score-value">{{ submission.note_sur_20 }}/20</p>
      </div>
      <div class="score-card score-card-score">
        <p class="score-label">Score obtenu</p>
        <p class="score-value">{{ submission.score }}</p>
        <p class="score-sublabel">points</p>
      </div>
      <div class="score-card score-card-coef">
        <p class="score-label">Coefficient</p>
        <p class="score-value">{{ submission.evaluation.coefficient }}</p>
      </div>
    </div>

    <!-- Feedback enseignant -->
    <div v-if="submission.feedback" class="feedback-card">
      <p class="feedback-title"><i class="fa fa-pencil-square-o"></i> Commentaire de l'enseignant</p>
      <p class="feedback-text">{{ submission.feedback }}</p>
    </div>
  </div>
</template>

<script setup>
/**
 * En-tête « score » de EvaluationResults (H2 ≤300) : titre, date, note/score/coef
 * et feedback enseignant. Section présentationnelle extraite verbatim. Reçoit la
 * soumission en prop, émet `back`. CSS score/feedback + overrides de thème @use'd.
 */
defineProps({
  submission: { type: Object, required: true }
})

defineEmits(['back'])

function formatDate(date) {
  if (!date) return 'Non disponible'
  const d = new Date(date)
  return d.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped lang="scss">
@use '../../assets/styles/eval-results-theme';

/* Cartes de score */
.score-card {
  background-color: var(--bg-secondary);
  border-radius: 0.5rem;
  padding: 1rem;
  text-align: center;
}

.score-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
}

.score-value {
  font-size: 2.25rem;
  font-weight: 700;
  color: var(--text-primary);
}

.score-sublabel {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
}

/* Carte de feedback */
.feedback-card {
  margin-top: 1rem;
  padding: 1rem;
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  border-radius: 0.5rem;
}

.feedback-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.feedback-text {
  color: var(--text-secondary);
}
</style>
