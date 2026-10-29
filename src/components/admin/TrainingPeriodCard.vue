<template>
  <!-- tabindex -1 : focalisable par script quand plus aucun bouton n'est permis (revue #441, A3). -->
  <article class="card period-card" tabindex="-1">
    <h2>{{ periode.libelle }}</h2>
    <p>{{ libelleStatut(periode.status) }} · {{ libellePhase(periode.phase) }}</p>
    <p>Programme n° {{ periode.program_id }}</p>
    <p v-if="periode.starts_on || periode.ends_on">{{ periode.starts_on || '—' }} → {{ periode.ends_on || '—' }}</p>

    <div v-if="actions.length" class="period-actions">
      <span v-for="action in actions" :key="action" class="period-action">
        <button
          type="button"
          class="transition-btn"
          :class="{ 'is-irreversible': IRREVERSIBLES.includes(action) }"
          :disabled="busy || !!raisonBlocage(periode, action)"
          @click="$emit('transition', action)"
        >{{ LIBELLES_TRANSITION[action] }}</button>
        <small v-if="raisonBlocage(periode, action)" class="period-blocage">{{ raisonBlocage(periode, action) }}</small>
      </span>
    </div>
  </article>
</template>

<script setup>
/**
 * Une période de formation et ses seules transitions possibles (#391). Présentation
 * pure : reçoit la période, émet `transition` avec l'action. La table vient de
 * `constants/trainingSessionTransitions` (copie de l'ADR-845-01, dette nommée) ; le
 * serveur reste l'autorité. « Publier » sans date de début est désactivé avec sa
 * raison, si bien que le 422 du serveur n'est pas atteignable depuis l'écran.
 */
import { computed } from 'vue'
import { libellePhase, libelleStatut } from '@/composables/useAdminTrainingSessions'
import {
  IRREVERSIBLES,
  LIBELLES_TRANSITION,
  raisonBlocage,
  transitionsPermises,
} from '@/constants/trainingSessionTransitions'

const props = defineProps({
  periode: { type: Object, required: true },
  // Une transition de cette période est en cours : aucun double envoi.
  busy: { type: Boolean, default: false },
})

defineEmits(['transition'])

const actions = computed(() => transitionsPermises(props.periode))
</script>

<style scoped>
.period-card {
  background: var(--card-bg);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-md);
}

.period-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
  margin-top: var(--spacing-md);
}

.period-action {
  display: inline-flex;
  flex-direction: column;
  gap: var(--spacing-xs, 0.25rem);
}

.transition-btn {
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-primary);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-weight: 600;
  cursor: pointer;
}

.transition-btn.is-irreversible {
  border-color: var(--color-danger, var(--border-primary));
}

.transition-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.period-blocage {
  color: var(--text-secondary);
}
</style>
