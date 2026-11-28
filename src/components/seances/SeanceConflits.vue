<template>
  <div v-if="conflits.length" class="seance-conflits" role="alert">
    <p class="seance-conflits__titre">Séances en conflit sur ce créneau :</p>
    <ul class="seance-conflits__liste">
      <li v-for="c in conflits" :key="c.id">
        <strong>{{ c.titre ?? 'Séance sans titre' }}</strong>
        — {{ formatDateTime(c.debut) }} à {{ formatTime(c.fin) }}
        <span v-if="c.motifs.length" class="seance-conflits__motifs">({{ c.motifs.join(', ').toLowerCase() }})</span>
      </li>
    </ul>
    <button v-if="peutForcer" type="button" class="btn-forcer" :disabled="envoi" @click="$emit('forcer')">
      {{ libelleForcer }}
    </button>
  </div>
</template>

<script setup>
/**
 * #675 (lms_backend#1668) : les séances qui gênent le créneau, nommées par le 409 du serveur (titre, bornes —
 * la fin effective —, motifs traduits par `conflitsDuRefus`). La gestion se voit offrir de passer outre ;
 * l'enseignant non (le serveur le refuserait, 403). Partagé par la création et la modification.
 */
import { formatDateTime, formatTime } from '@/utils/formatters'

defineProps({
  conflits: { type: Array, default: () => [] },
  peutForcer: { type: Boolean, default: false },
  envoi: { type: Boolean, default: false },
  libelleForcer: { type: String, default: 'Créer quand même' },
})
defineEmits(['forcer'])
</script>

<style scoped>
.seance-conflits {
  margin-top: 0.75rem;
  padding: 0.75rem;
  border-left: 4px solid var(--color-warning);
  background: var(--warning-bg);
  border-radius: 0.5rem;
  color: var(--text-primary);
  font-size: 0.875rem;
}

.seance-conflits__titre {
  margin: 0 0 0.5rem;
  font-weight: 600;
}

.seance-conflits__liste {
  margin: 0 0 0.5rem;
  padding-left: 1.25rem;
}

.seance-conflits__motifs {
  color: var(--text-secondary);
}

.btn-forcer {
  padding: 0.5rem 0.875rem;
  border: 1px solid var(--border-primary);
  border-radius: 0.5rem;
  background: var(--card-bg);
  color: var(--text-primary);
  cursor: pointer;
}

.btn-forcer:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
