<template>
  <div>
    <!-- Message pour séance en cours -->
    <div v-if="!attendances.seance?.is_finished" class="modal-info-banner">
      ℹ️ Séance en cours - La liste définitive sera disponible après la fermeture de la séance
    </div>

    <div class="modal-table-wrapper">
      <table class="modal-table">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Email</th>
            <th class="text-center">Arrivée</th>
            <th class="text-center">Départ</th>
            <th class="text-center">Durée</th>
            <th class="text-center">Statut</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="attendance in attendances.attendances" :key="attendance.id">
            <td>{{ attendance.nom }}</td>
            <td class="email-cell">{{ attendance.email }}</td>
            <td class="text-center time-cell">{{ formatTime(attendance.joined_at) }}</td>
            <td class="text-center time-cell">
              {{ attendance.left_at ? formatTime(attendance.left_at) : '-' }}
            </td>
            <td class="text-center">{{ formatDuration(attendance.duration_minutes) }}</td>
            <td class="text-center">
              <span :class="getAttendanceStatusBadgeClass(attendance.status_level)">
                {{ attendance.presence_status }}
                <span v-if="attendance.participation_percentage !== null" class="percentage-text">
                  ({{ attendance.participation_percentage }}%)
                </span>
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Statistics Summary -->
    <div class="modal-stats">
      <div class="modal-stat-item">
        <span class="stat-label">Total participants:</span>
        <span class="stat-value">{{ attendances.statistics.total_participants }}</span>
      </div>
      <div class="modal-stat-item">
        <span class="stat-label">Durée moyenne:</span>
        <span class="stat-value">{{ formatDuration(attendances.statistics.average_duration) }}</span>
      </div>
      <div class="modal-stat-item">
        <span class="stat-label">Taux de présence:</span>
        <span class="stat-value">{{ attendances.statistics.presence_rate }}%</span>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Tableau + statistiques de la modale de présences (H7) — sous-composant
 * présentationnel extrait d'AttendanceDetailModal.vue. Reçoit la réponse
 * `attendances` peuplée (liste + statistics + seance) ; aucune logique métier.
 */
import { getAttendanceStatusBadgeClass } from '@/utils/attendance'
// #23 : format heure centralisé (parité exacte via fallback '-')
import { formatTime as fmtTime } from '@/utils/formatters'

defineProps({
  attendances: { type: Object, required: true }
})

// #23 : heure délègue au formatter centralisé (repli '-' identique à l'origine).
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
.text-center {
  text-align: center;
}

/* Modal Info Banner */
.modal-info-banner {
  background: var(--info-bg);
  border: 1px solid var(--info-border);
  color: var(--info-text);
  padding: 0.875rem 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Modal Table */
.modal-table-wrapper {
  overflow-x: auto;
  margin-bottom: 2rem;
}

.modal-table {
  width: 100%;
  border-collapse: collapse;
}

.modal-table thead {
  background: var(--bg-secondary);
  border-bottom: 2px solid var(--border-color);
}

.modal-table th {
  padding: 0.875rem 1rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.modal-table tbody tr {
  border-bottom: 1px solid var(--border-color);
  transition: background-color 0.15s ease;
}

.modal-table tbody tr:hover {
  background: var(--bg-hover);
}

.modal-table td {
  padding: 0.875rem 1rem;
  font-size: 0.875rem;
  color: var(--text-primary);
}

.email-cell {
  color: var(--text-secondary);
  font-size: 0.8125rem;
}

.time-cell {
  font-family: 'Courier New', monospace;
  font-size: 0.8125rem;
  color: var(--text-secondary);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-badge .percentage-text {
  font-size: 0.7rem;
  opacity: 0.9;
}

/* Présent - Vert (≥80%) */
.status-badge.status-present {
  background: #D1FAE5;
  color: #065F46;
}

/* Partiel - Orange (50-79%) */
.status-badge.status-partial {
  background: #FED7AA;
  color: #92400E;
}

/* Faible - Rouge clair (20-49%) */
.status-badge.status-low {
  background: #FECACA;
  color: #7F1D1D;
}

/* Absent - Rouge foncé (<20%) */
.status-badge.status-absent {
  background: var(--error-bg);
  color: var(--error-text);
}

/* En cours - Bleu (séance non terminée) */
.status-badge.status-ongoing {
  background: var(--info-bg);
  color: var(--info-text);
}

/* Modal Stats */
.modal-stats {
  display: flex;
  gap: 2rem;
  padding: 1.5rem;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
  border: 1px solid var(--border-color);
}

.modal-stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.modal-stat-item .stat-label {
  color: var(--text-secondary);
  font-weight: 500;
}

.modal-stat-item .stat-value {
  color: var(--text-primary);
  font-weight: 600;
}
</style>
