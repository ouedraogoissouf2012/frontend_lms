<template>
  <div class="seance-card">
    <SeanceCardHeader :seance="seance" />

    <SeanceCardInfo :seance="seance" />

    <!-- lms_backend#1121 : « Modifier », seulement si le serveur le permet (`can_be_edited`). -->
    <SeanceEditAction :seance="seance" class="seance-card-edit" @updated="$emit('updated', $event)" />
    <!-- #719 : l'appel, seulement si le serveur l'offre à ce lecteur (`can_take_attendance`). -->
    <SeanceAppelAction :seance="seance" class="seance-card-edit" />

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
import SeanceEditAction from '@/components/seances/SeanceEditAction.vue'
import SeanceAppelAction from '@/components/seances/SeanceAppelAction.vue'

defineProps({
  seance: { type: Object, required: true },
  isEnseignant: { type: Boolean, default: false },
  // id de la séance dont une action est en cours (ou null)
  actionLoading: { type: [Number, String, null], default: null }
})

defineEmits(['activate', 'start', 'deactivate', 'join', 'end', 'updated'])
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

.seance-card-edit {
  margin-top: 0.75rem;
}
</style>
