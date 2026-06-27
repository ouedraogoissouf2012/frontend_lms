<template>
  <div class="actions-footer">
    <div class="actions-info">
      <p class="actions-info-title">Mode prévisualisation activé</p>
      <p class="actions-info-subtitle">Les réponses ne seront pas enregistrées</p>
    </div>
    <div class="actions-buttons">
      <button @click="$emit('back')" class="btn-secondary">
        Retour
      </button>
      <button
        v-if="!isPublished"
        @click="$emit('edit')"
        class="btn-edit"
      >
        <PencilIcon class="w-5 h-5" />
        Modifier les questions
      </button>
      <button
        v-if="!isPublished"
        @click="$emit('publish')"
        :disabled="publishing"
        class="btn-publish"
      >
        <CheckCircleIcon class="w-5 h-5" />
        {{ publishing ? 'Publication...' : 'Publier maintenant' }}
      </button>
    </div>
  </div>
</template>

<script setup>
/**
 * Pied d'actions de la prévisualisation (H1) : retour, édition et publication
 * (masquées si déjà publiée). Émet back/edit/publish ; CSS déplacé verbatim
 * depuis PreviewEvaluation.
 */
import { PencilIcon, CheckCircleIcon } from '@heroicons/vue/24/outline'

defineProps({
  isPublished: { type: Boolean, default: false },
  publishing: { type: Boolean, default: false }
})

defineEmits(['back', 'edit', 'publish'])
</script>

<style scoped>
/* Actions footer */
.actions-footer {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: var(--card-shadow);
  gap: 1rem;
  flex-wrap: wrap;
}

.actions-info {
  flex: 1;
  min-width: 200px;
}

.actions-info-title {
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.actions-info-subtitle {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.actions-buttons {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--btn-secondary-bg);
  color: var(--btn-secondary-text);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: 500;
  transition: all var(--transition-fast);
}

.btn-secondary:hover {
  background: var(--btn-secondary-hover);
}

.btn-edit {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--btn-primary-bg);
  color: var(--btn-primary-text);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: 500;
  transition: all var(--transition-fast);
}

.btn-edit:hover {
  background: var(--btn-primary-hover);
  transform: translateY(-1px);
}

.btn-publish {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--emerald-500);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: 500;
  transition: all var(--transition-fast);
}

.btn-publish:hover:not(:disabled) {
  background: var(--emerald-600);
  transform: translateY(-1px);
}

.btn-publish:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
