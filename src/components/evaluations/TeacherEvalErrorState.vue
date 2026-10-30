<template>
  <!-- #420 : région d'alerte présente dès le montage ; seul son contenu change. -->
  <div role="alert" data-test="erreur-evaluations">
    <div v-if="message" class="error-state">
      <div class="error-content">
        <i class="fa fa-exclamation-triangle error-icon"></i>
        <div>
          <h3 class="error-title">Erreur de chargement</h3>
          <p class="error-message">{{ message }}</p>
        </div>
      </div>
      <button @click="$emit('retry')" class="btn-retry">
        <ArrowPathIcon class="w-5 h-5" />
        Réessayer
      </button>
    </div>
  </div>
</template>

<script setup>
/**
 * État d'erreur de TeacherEvaluations (#420). Le conteneur `role="alert"` est
 * rendu en permanence : un lecteur d'écran n'annonce que ce qui change dans une
 * région qui existait déjà. Présentation pure ; CSS déplacé verbatim depuis
 * TeacherEvaluations.
 */
import { ArrowPathIcon } from '@heroicons/vue/24/outline'

defineProps({
  message: { type: String, default: null }
})

defineEmits(['retry'])
</script>

<style scoped>
/* Error State */
.error-state {
  background: var(--correction-red-100);
  border: 1px solid var(--correction-red-200);
  border-radius: 0.75rem;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 2rem;
}

.error-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.error-icon {
  font-size: 2rem;
  line-height: 1;
}

.error-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--correction-red-600);
  margin: 0 0 0.25rem 0;
}

.error-message {
  font-size: 0.875rem;
  color: var(--correction-red-700);
  margin: 0;
}

.btn-retry {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: var(--red-600);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-retry:hover {
  background: var(--red-700);
}
</style>
