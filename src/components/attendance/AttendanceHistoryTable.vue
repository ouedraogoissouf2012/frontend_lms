<template>
  <div class="table-card">
    <div class="table-header">
      <h2 class="table-title">Liste des Participations</h2>
      <button @click="$emit('export')" class="btn-export">
        ↓ Exporter CSV
      </button>
    </div>

    <div class="table-responsive">
      <AttendanceHistoryRows
        :attendances="attendances"
        :user="user"
        :format-date="formatDate"
        :format-time="formatTime"
        @view-details="$emit('view-details', $event)"
      />
    </div>

    <!-- Pagination -->
    <AttendanceHistoryPagination
      :pagination="pagination"
      @load-page="$emit('load-page', $event)"
    />
  </div>
</template>

<script setup>
/**
 * Carte « Liste des Participations » de l'historique des présences (H7) —
 * sous-composant présentationnel extrait d'AttendanceHistory.vue. Assemble
 * l'en-tête (titre + export CSV), les lignes (AttendanceHistoryRows) et la
 * pagination (AttendanceHistoryPagination). Émet export / view-details /
 * load-page vers le parent ; formateurs date/heure LOCAUX relayés (parité #H7).
 */
import AttendanceHistoryRows from '@/components/attendance/AttendanceHistoryRows.vue'
import AttendanceHistoryPagination from '@/components/attendance/AttendanceHistoryPagination.vue'

defineProps({
  attendances: { type: Array, default: () => [] },
  user: { type: Object, default: () => ({}) },
  pagination: { type: Object, required: true },
  formatDate: { type: Function, required: true },
  formatTime: { type: Function, required: true }
})

defineEmits(['export', 'view-details', 'load-page'])
</script>

<style scoped>
/* Table */
.table-card {
  background: var(--bg-primary);
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.table-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.btn-export {
  padding: 0.625rem 1rem;
  background: var(--emerald-500);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-export:hover {
  background: var(--emerald-600);
  transform: translateY(-1px);
}

.table-responsive {
  overflow-x: auto;
}

/* Responsive */
@media (max-width: 768px) {
  .table-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
}
</style>
