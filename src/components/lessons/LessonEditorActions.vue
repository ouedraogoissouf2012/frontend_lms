<template>
  <div class="form-actions">
    <button type="button" @click="$emit('cancel')" class="btn-cancel">
      Annuler
    </button>
    <button type="submit" :disabled="saving" class="btn-save">
      {{ saving ? 'Enregistrement...' : (isEditMode ? 'Mettre à jour' : 'Créer la leçon') }}
    </button>
    <button
      v-if="isEditMode"
      type="button"
      @click="$emit('delete')"
      :disabled="saving"
      class="btn-delete"
    >
      Supprimer
    </button>
  </div>
</template>

<script setup>
/**
 * Barre d'actions de LessonEditor (#H4 ≤300) : Annuler / Enregistrer (submit) /
 * Supprimer (mode édition). Le bouton submit déclenche le @submit du formulaire parent ;
 * cancel/delete relayés via emit. Chrome de boutons dupliqué VERBATIM.
 */
defineProps({
  saving: { type: Boolean, default: false },
  isEditMode: { type: Boolean, default: false }
})

defineEmits(['cancel', 'delete'])
</script>

<style scoped>
/* Actions */
.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding: 1.5rem;
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
}

.btn-cancel,
.btn-save,
.btn-delete {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-cancel {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
}

.btn-cancel:hover {
  background: var(--bg-tertiary);
}

.btn-save {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}

.btn-save:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  transform: translateY(-1px);
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-delete {
  background: #fee2e2;
  color: #dc2626;
  border: 1px solid #fca5a5;
}

.btn-delete:hover:not(:disabled) {
  background: #fecaca;
}

.btn-delete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Responsive */
@media (max-width: 768px) {
  .form-actions {
    flex-direction: column;
  }

  .btn-cancel,
  .btn-save,
  .btn-delete {
    width: 100%;
  }
}
</style>
