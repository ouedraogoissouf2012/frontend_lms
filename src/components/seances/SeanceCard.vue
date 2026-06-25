<template>
  <div class="seance-card">
    <SeanceCardHeader :seance="seance" />

    <SeanceCardInfo :seance="seance" />

    <SeanceCardActions
      :seance="seance"
      :is-enseignant="isEnseignant"
      :action-loading="actionLoading"
      @activate="$emit('activate', $event)"
      @start="$emit('start', $event)"
      @deactivate="$emit('deactivate', $event)"
      @join="$emit('join', $event)"
      @end="$emit('end', $event)"
    />
  </div>
</template>

<script setup>
/**
 * Carte d'une séance enseignant (#28, tranche 2 ; #H6 ≤300).
 * Orchestrateur de présentation : compose en-tête, grille d'infos et actions
 * visio. Émet les intentions d'action ; la logique (services, participation,
 * lien Jitsi) reste dans la vue parente.
 */
import SeanceCardHeader from '@/components/seances/SeanceCardHeader.vue'
import SeanceCardInfo from '@/components/seances/SeanceCardInfo.vue'
import SeanceCardActions from '@/components/seances/SeanceCardActions.vue'

defineProps({
  seance: { type: Object, required: true },
  isEnseignant: { type: Boolean, default: false },
  // id de la séance dont une action est en cours (ou null)
  actionLoading: { type: [Number, String, null], default: null }
})

defineEmits(['activate', 'start', 'deactivate', 'join', 'end'])
</script>

<style scoped>
.seance-card {
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
  padding: 1.5rem;
  transition: all 0.2s;
}

.seance-card:hover {
  box-shadow: var(--card-shadow-hover);
}
</style>
