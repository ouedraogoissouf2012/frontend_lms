<template>
  <transition name="modal-fade">
    <div v-if="selectedSeance" class="modal-overlay" @click="$emit('close')">
      <div class="modal-container" @click.stop>
        <!-- Modal Header -->
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

        <!-- Modal Body -->
        <div class="modal-body">
          <!-- Loading State -->
          <div v-if="loadingAttendances" class="modal-loading">
            <div class="loading-spinner"></div>
            <p>Chargement des présences...</p>
          </div>

          <!-- Attendances Table -->
          <div v-else-if="attendances && attendances.attendances.length > 0">
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

          <!-- Empty State -->
          <div v-else-if="attendances" class="modal-empty">
            <i class="fa fa-clipboard empty-icon"></i>
            <p>Aucune participation enregistrée</p>
          </div>

          <!-- Error State -->
          <div v-else-if="attendancesError" class="modal-error">
            <span><i class="fa fa-exclamation-triangle"></i></span>
            <p>{{ attendancesError }}</p>
            <button @click="$emit('retry')" class="btn-retry">Réessayer</button>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="modal-footer">
          <button
            @click="$emit('export-pdf')"
            :disabled="exporting"
            class="btn-export-pdf"
            title="Exporter en PDF"
          >
            <i class="fa fa-file-pdf-o"></i>
            {{ exporting ? 'Export...' : 'Exporter PDF' }}
          </button>
          <button
            @click="$emit('export-excel')"
            :disabled="exporting"
            class="btn-export-excel"
            title="Exporter en Excel"
          >
            <i class="fa fa-file-excel-o"></i>
            {{ exporting ? 'Export...' : 'Exporter Excel' }}
          </button>
          <button @click="$emit('close')" class="btn-modal-close">Fermer</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
/**
 * Modale de détail des présences d'une séance (#28, tranche 3).
 * Sous-composant de présentation extrait de SeanceAttendanceHistory.vue.
 * Émet les intentions ; la logique (chargement, export) reste dans le parent.
 */
import { getAttendanceStatusBadgeClass } from '@/utils/attendance'
// #23 : format date/heure centralisé (parité exacte via fallback '-')
import { formatDate as fmtDate, formatTime as fmtTime } from '@/utils/formatters'

defineProps({
  selectedSeance: { type: Object, default: null },
  attendances: { type: Object, default: null },
  loadingAttendances: { type: Boolean, default: false },
  attendancesError: { type: String, default: null },
  exporting: { type: Boolean, default: false }
})

defineEmits(['close', 'export-pdf', 'export-excel', 'retry'])

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
.text-center {
  text-align: center;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 999;
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.modal-container {
  background: var(--bg-primary);
  border-radius: 1rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 1200px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

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

.modal-body {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

/* Modal Loading */
.modal-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  gap: 1rem;
  color: var(--text-secondary);
}

.loading-spinner {
  width: 3rem;
  height: 3rem;
  border: 3px solid var(--bg-secondary);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Modal Info Banner */
.modal-info-banner {
  background: #DBEAFE;
  border: 1px solid #93C5FD;
  color: #1E40AF;
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
  background: var(--bg-hover, rgba(0, 0, 0, 0.02));
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
  background: #FEE2E2;
  color: #991B1B;
}

/* En cours - Bleu (séance non terminée) */
.status-badge.status-ongoing {
  background: #DBEAFE;
  color: #1E40AF;
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

/* Modal Empty */
.modal-empty {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}

.modal-empty .empty-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 1rem;
  opacity: 0.5;
}

/* Modal Error */
.modal-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem;
  text-align: center;
  color: var(--text-secondary);
}

.modal-error span {
  font-size: 3rem;
  color: #EF4444;
}

.btn-retry {
  padding: 0.625rem 1.5rem;
  background: var(--primary-color, #3b82f6);
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-retry:hover {
  background: #2563eb;
}

/* Modal Footer */
.modal-footer {
  padding: 1.5rem 2rem;
  border-top: 1px solid var(--border-color);
  background: var(--bg-secondary);
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.btn-export-pdf {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
}

.btn-export-pdf:hover:not(:disabled) {
  background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
}

.btn-export-pdf:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn-export-excel {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.btn-export-excel:hover:not(:disabled) {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.btn-export-excel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn-modal-close {
  padding: 0.75rem 2rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  transition: all 0.15s;
}

.btn-modal-close:hover {
  background: var(--bg-hover);
  border-color: var(--text-tertiary);
}

/* Modal Transitions */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: all 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .modal-container,
.modal-fade-leave-to .modal-container {
  transform: scale(0.95);
  opacity: 0;
}
</style>
