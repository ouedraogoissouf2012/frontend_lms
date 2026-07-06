<template>
  <div>
    <!-- Modal de confirmation soumission -->
    <Modal
      :model-value="showConfirmModal"
      title="Confirmer la soumission"
      size="sm"
      @close="$emit('close-confirm')"
    >
      <p class="modal-text">
        Vous avez répondu à <strong>{{ answeredCount }}</strong> question(s) sur <strong>{{ evaluation.questions.length }}</strong>.
      </p>
      <p class="modal-warning" v-if="answeredCount < evaluation.questions.length">
        <i class="fa fa-exclamation-triangle"></i>
        Certaines questions n'ont pas été répondues.
      </p>
      <p class="modal-text">Êtes-vous sûr de vouloir soumettre ? Cette action est irréversible.</p>

      <template #footer>
        <div class="modal-actions">
          <BaseButton variant="secondary" class="btn-cancel" @click="$emit('close-confirm')">
            Annuler
          </BaseButton>
          <BaseButton class="btn-submit" @click="$emit('submit')">
            Confirmer
          </BaseButton>
        </div>
      </template>
    </Modal>

    <!-- Modal résultats -->
    <Modal
      :model-value="showResultsModal"
      :show-close="false"
      :close-on-overlay="false"
      size="sm"
      class="modal-results"
    >
      <div class="results-icon">
        <i class="fa fa-check-circle"></i>
      </div>
      <h3 class="modal-title">{{ isPractice ? 'Entraînement terminé !' : 'Évaluation soumise !' }}</h3>
      <p class="modal-text">{{ isPractice ? 'Votre entraînement a été complété.' : 'Votre évaluation a été soumise avec succès.' }}</p>

      <div v-if="results" class="results-score" :class="{ 'results-practice': isPractice }">
        <p class="score-label">{{ isPractice ? 'Note indicative' : 'Votre note' }}</p>
        <p class="score-value">{{ results.note_sur_20 }}<span class="score-unit">/20</span></p>
        <p class="score-detail">Score: {{ results.score }} points</p>
        <p v-if="isPractice" class="practice-note-info">Cette note n'est pas comptabilisée dans votre moyenne.</p>
      </div>

      <BaseButton class="btn-submit btn-full" @click="$emit('return')">
        <i class="fa fa-arrow-left"></i>
        Retour aux évaluations
      </BaseButton>
    </Modal>
  </div>
</template>

<script setup>
/**
 * Modales de TakeEvaluation (H1) : confirmation de soumission et résultats
 * (note/score, variante entraînement). Émet `close-confirm`, `submit`, `return`.
 * CSS déplacé verbatim depuis TakeEvaluation (`.btn-cancel`/`.btn-submit`
 * dupliqués car partagés avec le pied d'actions).
 */
import Modal from '@/components/ui/Modal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

defineProps({
  showConfirmModal: { type: Boolean, default: false },
  showResultsModal: { type: Boolean, default: false },
  evaluation: { type: Object, required: true },
  answeredCount: { type: Number, default: 0 },
  results: { type: Object, default: null },
  isPractice: { type: Boolean, default: false }
})

defineEmits(['close-confirm', 'submit', 'return'])
</script>

<style scoped>
.btn-cancel {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: 2px solid var(--border-color, #d1d5db);
  background: var(--card-bg);
  color: var(--text-secondary);
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: var(--bg-secondary, #f3f4f6);
  color: var(--text-primary);
}

.btn-submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex: 1;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, var(--primary-color), var(--color-info-strong));
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-submit:hover {
  background: linear-gradient(135deg, var(--color-info-strong), var(--color-info-stronger));
  transform: translateY(-1px);
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-full {
  width: 100%;
}

.results-practice {
  border-color: var(--violet-500) !important;
  background: var(--violet-50) !important;
}

.practice-note-info {
  font-size: 0.8rem;
  color: var(--violet-600);
  margin-top: 0.5rem;
  font-style: italic;
}

.modal-results {
  text-align: center;
}

.modal-title {
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 1rem 0;
}

.modal-text {
  color: var(--text-secondary);
  margin: 0 0 1rem 0;
  line-height: 1.6;
}

.modal-warning {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--warning-bg);
  color: var(--amber-800);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  margin: 0 0 1rem 0;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.modal-actions .btn-cancel,
.modal-actions .btn-submit {
  flex: 1;
}

/* Results icon */
.results-icon {
  margin-bottom: 1rem;
}

.results-icon .fa {
  font-size: 3rem;
  color: var(--emerald-500);
}

/* Results score */
.results-score {
  background: var(--bg-secondary, #eff6ff);
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin: 1.5rem 0;
}

.score-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0 0 0.25rem 0;
}

.score-value {
  font-size: 3rem;
  font-weight: 700;
  color: var(--primary-color);
  margin: 0;
}

.score-unit {
  font-size: 1.5rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.score-detail {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0.5rem 0 0 0;
}
</style>
