<template>
  <div class="load-retry-notice">
    <p class="load-retry-message">{{ message }}</p>
    <button type="button" class="load-retry-button" :disabled="busy" @click="$emit('retry')">
      Réessayer
    </button>
  </div>
</template>

<script setup>
/**
 * Une donnée qui n'a pas pu être lue : son message et « Réessayer ». Présentation
 * pure — le parent relance. Sert là où un état INCONNU ne doit pas passer pour un
 * état vide (liste de chapitres, quiz d'un chapitre).
 */
defineProps({
  message: { type: String, required: true },
  // Un chargement est en cours : on ne relance pas une seconde fois.
  busy: { type: Boolean, default: false }
})

defineEmits(['retry'])
</script>

<style scoped>
.load-retry-notice {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin: 1rem 1.5rem;
  padding: 0.75rem 1rem;
  background: var(--error-bg);
  border: 1px solid var(--error-border);
  border-radius: 0.5rem;
}

.load-retry-message {
  margin: 0;
  color: var(--error-text);
  font-weight: 600;
}

.load-retry-button {
  padding: 0.375rem 0.875rem;
  border: 1px solid var(--error-border);
  border-radius: 0.375rem;
  background: var(--card-bg);
  color: var(--error-text);
  font-weight: 600;
  cursor: pointer;
}

.load-retry-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
