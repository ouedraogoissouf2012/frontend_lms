<template>
  <div class="modal-header">
    <div class="modal-header-content">
      <h3 class="modal-title">Liste de Présence</h3>
      <div class="modal-roles-row">
        <p v-if="attendances?.seance?.enseignant_nom" class="modal-role">
          <span class="role-label">Enseignant:</span> {{ attendances.seance.enseignant_nom }}
        </p>
        <p v-if="attendances?.seance" class="modal-role modal-seance-time" style="text-align: center; flex-grow: 1;">
          <span class="role-label"><i class="fa fa-clock-o"></i> Séance:</span>
          {{ formatTime(attendances.seance.visio_started_at) }} - {{ formatTime(attendances.seance.visio_ended_at) }}
          <span v-if="attendances.seance.duration_minutes" class="duration-text">
            ({{ formatDuration(attendances.seance.duration_minutes) }})
          </span>
        </p>
        <p v-if="attendances?.seance?.coordinateur_nom" class="modal-role">
          <span class="role-label">Coordinateur:</span> {{ attendances.seance.coordinateur_nom }}
        </p>
      </div>
      <p class="modal-subtitle">Séance {{ selectedSeance.klassci_seance_id }} - {{ selectedSeance.matiere_nom }} - {{ formatDate(selectedSeance.date) }}</p>
    </div>
    <button @click="$emit('close')" class="modal-close-btn">✕</button>
  </div>
</template>

<script setup>
/**
 * En-tête de la modale de présences (H7) — sous-composant présentationnel extrait
 * d'AttendanceDetailModal.vue. Affiche titre, enseignant/coordinateur, créneau de
 * séance et sous-titre. Émet « close ». Logique et chargement restent au parent.
 */
// #23 : format date/heure centralisé (parité exacte via fallback '-')
import { formatDate as fmtDate, formatTime as fmtTime } from '@/utils/formatters'

defineProps({
  selectedSeance: { type: Object, default: null },
  attendances: { type: Object, default: null }
})

defineEmits(['close'])

// #23 : date/heure délèguent au formatter centralisé (repli '-' identique à l'origine).
function formatDate(dateString) {
  return fmtDate(dateString, { fallback: '-' })
}

function formatTime(dateString) {
  return fmtTime(dateString, { fallback: '-' })
}

// formatDuration NON convergé : sortie distincte du canonique
// (Math.round vs Math.floor + « 45 min » avec espace) — gardé local (#23).
function formatDuration(minutes) {
  if (!minutes || minutes === 0) return '-'
  const totalMinutes = Math.round(minutes)
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
  }
  return `${totalMinutes} min`
}
</script>

<style scoped>
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-secondary);
}

.modal-header-content {
  flex: 1;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.75rem 0;
}

.modal-roles-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.modal-role {
  font-size: 0.9rem;
  color: var(--text-primary);
  margin: 0;
  white-space: nowrap;
}

.modal-role:last-child {
  margin-left: auto;
  text-align: right;
}

.modal-role .role-label {
  font-weight: 600;
  color: var(--text-secondary);
}

.modal-seance-time {
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
}

.modal-seance-time .duration-text {
  color: var(--text-secondary);
  font-size: 0.85rem;
  margin-left: 0.25rem;
}

.modal-subtitle {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

.modal-close-btn {
  background: transparent;
  border: none;
  width: 2rem;
  height: 2rem;
  border-radius: 0.375rem;
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 1.5rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  flex-shrink: 0;
}

.modal-close-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
</style>
