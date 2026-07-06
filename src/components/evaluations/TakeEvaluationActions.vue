<template>
  <div>
    <!-- Actions sticky -->
    <div class="eval-actions">
      <button @click="$emit('cancel')" class="btn-cancel">
        <i class="fa fa-times"></i>
        Annuler
      </button>
      <button @click="$emit('submit')" :disabled="submitting" class="btn-submit">
        <i :class="submitting ? 'fa fa-spinner fa-spin' : 'fa fa-paper-plane'"></i>
        {{ submitting ? 'Soumission en cours...' : (isPractice ? 'Terminer l\'entraînement' : 'Soumettre l\'évaluation') }}
      </button>
    </div>
    <p class="actions-hint">Assurez-vous d'avoir répondu à toutes les questions avant de soumettre</p>
  </div>
</template>

<script setup>
/**
 * Pied d'actions de TakeEvaluation (H1) : boutons Annuler / Soumettre (libellé
 * adapté au mode entraînement et à l'état de soumission). Émet `cancel`/`submit`.
 * CSS déplacé verbatim depuis TakeEvaluation (`.btn-cancel`/`.btn-submit`
 * dupliqués car partagés avec les modales).
 */
defineProps({
  submitting: { type: Boolean, default: false },
  isPractice: { type: Boolean, default: false }
})

defineEmits(['cancel', 'submit'])
</script>

<style scoped>
/* Actions */
.eval-actions {
  display: flex;
  gap: 0.75rem;
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
  padding: 1.25rem 1.5rem;
}

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

.actions-hint {
  text-align: center;
  font-size: 0.8125rem;
  color: var(--text-tertiary);
  margin: 0.75rem 0 0 0;
}

/* Responsive */
@media (max-width: 768px) {
  .eval-actions {
    flex-direction: column;
  }

  .btn-cancel {
    justify-content: center;
  }
}
</style>
