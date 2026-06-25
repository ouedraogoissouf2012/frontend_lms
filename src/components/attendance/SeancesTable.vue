<template>
  <div class="table-card">
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>Matière</th>
            <th>Séance</th>
            <th>Classe</th>
            <th>Date & Heure</th>
            <th class="text-center">Durée</th>
            <th class="text-center">Participants</th>
            <th class="text-center">Durée Moy.</th>
            <th class="text-center">Taux</th>
            <th class="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="seance in seances"
            :key="seance.id"
            :class="{ 'row-selected': selectedSeance?.id === seance.id }"
          >
            <td>{{ seance.matiere.nom }}</td>
            <td>
              <div class="seance-cell">
                <div class="seance-title">{{ seance.titre }}</div>
                <div class="seance-ref">{{ seance.klassci_seance_id }}</div>
              </div>
            </td>
            <td>
              <span v-if="seance.classe">{{ seance.classe.nom }}</span>
              <span v-else class="text-muted">-</span>
            </td>
            <td>
              <div class="date-cell">
                <div>{{ formatDate(seance.date) }}</div>
                <div v-if="seance.visio_started_at" class="time-text">
                  {{ formatTime(seance.visio_started_at) }}
                </div>
              </div>
            </td>
            <td class="text-center">{{ formatDuration(seance.duree_seance_minutes) }}</td>
            <td class="text-center num-cell">{{ seance.participants_count }}</td>
            <td class="text-center">{{ formatDuration(seance.duree_moyenne_minutes) }}</td>
            <td class="text-center">
              <span :class="['rate-text', getRateClass(seance.taux_presence)]">
                {{ seance.taux_presence }}%
              </span>
            </td>
            <td class="text-center">
              <div class="actions-buttons">
                <button
                  @click="$emit('view-attendances', seance)"
                  class="btn-view"
                  title="Voir les présences"
                >
                  Voir
                </button>
                <button
                  @click="$emit('delete-seance', seance)"
                  class="btn-delete"
                  title="Supprimer la séance"
                >
                  Supprimer
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <SeancesPagination
      :pagination="pagination"
      @change-page="$emit('change-page', $event)"
    />
  </div>
</template>

<script setup>
/**
 * Tableau des séances + pagination de l'historique des présences (H7) —
 * sous-composant présentationnel extrait de SeanceAttendanceHistory.vue.
 * Surligne la séance sélectionnée ; reçoit les formateurs LOCAUX (parité #H7) ;
 * la classe de taux délègue au util pur getAttendanceRateClass (#28). Émet
 * view-attendances / delete-seance / change-page.
 */
import { getAttendanceRateClass as getRateClass } from '@/utils/attendance'
import SeancesPagination from '@/components/attendance/SeancesPagination.vue'

defineProps({
  seances: { type: Array, default: () => [] },
  selectedSeance: { type: Object, default: null },
  pagination: { type: Object, required: true },
  formatDate: { type: Function, required: true },
  formatTime: { type: Function, required: true },
  formatDuration: { type: Function, required: true }
})

defineEmits(['view-attendances', 'delete-seance', 'change-page'])
</script>

<style scoped>
/* Table Card */
.table-card {
  background: var(--bg-primary);
  border-radius: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.table-wrapper {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table thead {
  background: var(--bg-secondary);
  border-bottom: 2px solid var(--border-color);
}

.data-table th {
  padding: 0.875rem 1rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.data-table tbody tr {
  border-bottom: 1px solid var(--border-color);
  transition: background-color 0.15s ease;
}

.data-table tbody tr:hover {
  background: var(--bg-hover, rgba(0, 0, 0, 0.02));
}

.data-table tbody tr.row-selected {
  background: var(--bg-hover);
}

.data-table td {
  padding: 0.875rem 1rem;
  font-size: 0.875rem;
  color: var(--text-primary);
}

.text-center {
  text-align: center !important;
}

.text-muted {
  color: var(--text-tertiary);
}

/* Seance Cell */
.seance-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.seance-title {
  font-weight: 500;
  color: var(--text-primary);
}

.seance-ref {
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-family: 'Courier New', monospace;
}

/* Date Cell */
.date-cell {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.time-text {
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-family: 'Courier New', monospace;
}

/* Num Cell */
.num-cell {
  font-weight: 600;
  color: var(--text-primary);
}

/* Rate Text */
.rate-text {
  font-weight: 600;
  font-size: 0.875rem;
}

.rate-text.rate-high {
  color: #10B981;
}

.rate-text.rate-medium {
  color: #F59E0B;
}

.rate-text.rate-low {
  color: #EF4444;
}

/* Action Buttons */
.actions-buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  align-items: center;
}

.btn-view {
  padding: 0.5rem 1rem;
  background: var(--primary-color, #3b82f6);
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-view:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

.btn-delete {
  padding: 0.5rem 1rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-delete:hover {
  background: #dc2626;
  transform: translateY(-1px);
}
</style>
