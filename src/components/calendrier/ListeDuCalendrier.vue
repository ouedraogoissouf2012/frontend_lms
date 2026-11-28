<template>
  <p v-if="!evenements.length" class="cal-aide">{{ ERROR_MESSAGES.calendrierAucunEvenement }}</p>
  <ul v-else class="cal-liste">
    <li v-for="e in evenements" :key="e.id" class="cal-evenement" :class="`cal-evenement--${e.type}`" data-evenement>
      <span class="cal-dates">{{ jourFr(e.debut) }}<template v-if="e.fin !== e.debut"> → {{ jourFr(e.fin) }}</template></span>
      <span class="cal-type">{{ libelleDuType(e.type) }}</span>
      <strong>{{ e.titre }}</strong>
      <span class="cal-portee-texte">{{ portee(e) }}</span>
      <span v-if="estGestion" class="cal-actions">
        <button type="button" class="cal-btn" data-action="modifier" @click="emit('modifier', e)">Modifier <span class="sr-only">{{ e.titre }}</span></button>
        <button type="button" class="cal-btn" data-action="supprimer" @click="emit('supprimer', e)">Supprimer <span class="sr-only">{{ e.titre }}</span></button>
      </span>
    </li>
  </ul>
</template>

<script setup>
/**
 * #678 — la vue LISTE du mois : un événement par ligne, lisible sur téléphone. La portée se dit par les libellés des
 * classes quand l'écran les connaît (la gestion) ; sinon « certaines classes » : la liste de l'établissement est
 * réservée à la gestion.
 */
import { ERROR_MESSAGES } from '@/constants/errorMessages'
import { jourFr, libelleDuType } from '@/utils/calendrierDeLAnnee'

const props = defineProps({
  evenements: { type: Array, required: true },
  estGestion: { type: Boolean, default: false },
  libelleDeClasse: { type: Function, required: true },
})
const emit = defineEmits(['modifier', 'supprimer'])

function portee(e) {
  if (e.portee !== 'classes') return 'Toute l’école'
  const libelles = e.classe_ids.map(props.libelleDeClasse).filter(Boolean)
  return libelles.length === e.classe_ids.length && libelles.length ? libelles.join(', ') : 'Certaines classes'
}
</script>

<style scoped>
.cal-liste {
  display: grid;
  gap: var(--spacing-sm);
  margin: 0;
  padding: 0;
  list-style: none;
}

.cal-evenement {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.cal-evenement--vacances,
.cal-evenement--fermeture {
  background: var(--warning-bg);
  border-color: var(--warning-border);
}

.cal-dates {
  font-variant-numeric: tabular-nums;
}

.cal-type,
.cal-portee-texte {
  color: var(--text-secondary);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
</style>
