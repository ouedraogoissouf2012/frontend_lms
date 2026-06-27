<template>
  <transition name="modal-fade">
    <div v-if="selectedSeance" class="modal-overlay" @click="$emit('close')">
      <div class="modal-container" @click.stop>
        <!-- Modal Header -->
        <AttendanceModalHeader
          :selected-seance="selectedSeance"
          :attendances="attendances"
          @close="$emit('close')"
        />

        <!-- Modal Body -->
        <div class="modal-body">
          <!-- Loading State -->
          <div v-if="loadingAttendances" class="modal-loading">
            <div class="loading-spinner"></div>
            <p>Chargement des présences...</p>
          </div>

          <!-- Attendances Table -->
          <AttendanceModalTable
            v-else-if="attendances && attendances.attendances.length > 0"
            :attendances="attendances"
          />

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
        <AttendanceModalFooter
          :exporting="exporting"
          @export-pdf="$emit('export-pdf')"
          @export-excel="$emit('export-excel')"
          @close="$emit('close')"
        />
      </div>
    </div>
  </transition>
</template>

<script setup>
/**
 * Modale de détail des présences d'une séance (#28, tranche 3 ; éclatée H7).
 * Wrapper mince : conserve overlay/transition/chrome + l'enchaînement d'états
 * (loading/liste/vide/erreur) ; délègue l'en-tête, le tableau et le pied à
 * AttendanceModalHeader/Table/Footer. API parent inchangée (props + events).
 */
import AttendanceModalHeader from '@/components/attendance/AttendanceModalHeader.vue'
import AttendanceModalTable from '@/components/attendance/AttendanceModalTable.vue'
import AttendanceModalFooter from '@/components/attendance/AttendanceModalFooter.vue'

defineProps({
  selectedSeance: { type: Object, default: null },
  attendances: { type: Object, default: null },
  loadingAttendances: { type: Boolean, default: false },
  attendancesError: { type: String, default: null },
  exporting: { type: Boolean, default: false }
})

defineEmits(['close', 'export-pdf', 'export-excel', 'retry'])
</script>

<style scoped>
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
  border-top-color: var(--blue-500);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
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
