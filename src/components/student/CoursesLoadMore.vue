<template>
  <div class="load-more">
    <!--
      Région d'annonce PRÉSENTE DÈS LE MONTAGE (#434) : un lecteur d'écran rate
      l'annonce d'une région créée dynamiquement. Elle porte la phrase complète.
    -->
    <p class="load-more-count" role="status" aria-live="polite">{{ countLabel }}</p>

    <p v-if="error" class="load-more-error">{{ error }}</p>

    <button
      v-if="hasMore"
      type="button"
      class="load-more-btn"
      :disabled="loading"
      @click="$emit('more')"
    >
      {{ loading ? 'Chargement…' : (error ? 'Réessayer' : 'Charger plus de cours') }}
    </button>
  </div>
</template>

<script setup>
/**
 * Pied de liste de StudentCourses (#434) : compteur « N cours affichés sur M » et
 * bouton « Charger plus » tant qu'une page reste à charger. Présentation pure :
 * reçoit des nombres déjà calculés, émet `more`. Une erreur du chargement suivant
 * s'affiche ici, sans effacer la liste au-dessus ; le même bouton réessaie.
 */
import { computed } from 'vue'

const props = defineProps({
  shown: { type: Number, required: true },
  // null = total pas encore mesuré : rien n'est annoncé plutôt qu'un 0 fabriqué.
  total: { type: Number, default: null },
  hasMore: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  error: { type: String, default: null },
})

defineEmits(['more'])

const countLabel = computed(() => {
  if (props.total === null) return ''
  return props.shown < props.total
    ? `${props.shown} cours affichés sur ${props.total}`
    : `${props.total} cours`
})
</script>

<style scoped>
.load-more {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.load-more-count {
  color: var(--text-secondary);
  font-size: 0.875rem;
  margin: 0;
}

.load-more-error {
  color: var(--color-danger, var(--text-primary));
  font-size: 0.875rem;
  margin: 0;
}

.load-more-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  border: 1px solid var(--border-primary);
  background: var(--card-bg);
  color: var(--text-primary);
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.load-more-btn:hover:not(:disabled) {
  border-color: var(--blue-500);
  box-shadow: var(--card-shadow);
}

.load-more-btn:disabled {
  cursor: wait;
  opacity: 0.7;
}
</style>
