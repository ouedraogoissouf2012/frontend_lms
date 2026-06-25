<template>
  <div class="evaluation-card">
    <EvaluationCardHeader :evaluation="evaluation" />
    <EvaluationCardInfoGrid :evaluation="evaluation" />
    <EvaluationCardStatus :evaluation="evaluation" />
    <EvaluationCardActions
      :evaluation="evaluation"
      :syncing="syncing"
      @create="$emit('create', $event)"
      @edit="$emit('edit', $event)"
      @view-results="$emit('view-results', $event)"
      @publish="$emit('publish', $event)"
      @preview="$emit('preview', $event)"
      @sync="$emit('sync', $event)"
      @delete="$emit('delete', $event)"
    />
  </div>
</template>

<script setup>
/**
 * Carte d'une évaluation enseignant (#28, tranche 3 → décomposée H2 ≤300).
 * Orchestrateur présentationnel : compose en-tête, grille d'infos, statut et
 * actions ; relaie l'API publique inchangée (props evaluation/syncing + emits)
 * consommée par TeacherEvaluations.vue. La logique métier reste dans la vue parente.
 */
import EvaluationCardHeader from '@/components/evaluations/EvaluationCardHeader.vue'
import EvaluationCardInfoGrid from '@/components/evaluations/EvaluationCardInfoGrid.vue'
import EvaluationCardStatus from '@/components/evaluations/EvaluationCardStatus.vue'
import EvaluationCardActions from '@/components/evaluations/EvaluationCardActions.vue'

defineProps({
  evaluation: { type: Object, required: true },
  // id de l'évaluation en cours de synchronisation (ou null)
  syncing: { type: [Number, String, null], default: null }
})

defineEmits(['create', 'edit', 'view-results', 'publish', 'preview', 'sync', 'delete'])
</script>

<style scoped>
.evaluation-card {
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
  padding: 1.5rem;
  transition: all 0.2s;
}

.evaluation-card:hover {
  box-shadow: var(--card-shadow-hover);
}
</style>
