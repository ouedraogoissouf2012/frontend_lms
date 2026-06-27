<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-container" @click.stop>
      <!-- Header -->
      <div class="modal-header">
        <div class="header-content">
          <h3 class="modal-title">
            {{ eventTitle }}
          </h3>
          <span :class="['status-badge', statusClass]">
            {{ statusLabel }}
          </span>
        </div>
        <button @click="$emit('close')" class="close-btn">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Body -->
      <div class="modal-body">
        <!-- Détails séance -->
        <EventSeanceDetails
          v-if="isSeance"
          :event-data="eventData"
          :formatted-date="formattedDate"
          :formatted-time-range="formattedTimeRange"
          :visio-status-text="visioStatusText"
        />

        <!-- Détails évaluation -->
        <EventEvaluationDetails
          v-else
          :event-data="eventData"
          :formatted-date="formattedDate"
        />
      </div>

      <!-- Footer avec actions -->
      <EventDetailActions
        :user-role="userRole"
        :is-seance="isSeance"
        :event-data="eventData"
        :can-join-visio="canJoinVisio"
        :can-start-evaluation="canStartEvaluation"
        :can-activate-visio="canActivateVisio"
        :can-start-visio="canStartVisio"
        :can-end-visio="canEndVisio"
        @action="emitAction($event)"
      />
    </div>
  </div>
</template>

<script setup>
/**
 * Modale de détail d'un événement (H8 — orchestrateur ≤300). Computeds, capacités
 * selon le rôle et formatage délégués au composable useEventDetail ; les sections
 * (séance / évaluation / actions) sont rendues par des sous-composants présentationnels.
 */
import EventSeanceDetails from '@/components/calendar/EventSeanceDetails.vue'
import EventEvaluationDetails from '@/components/calendar/EventEvaluationDetails.vue'
import EventDetailActions from '@/components/calendar/EventDetailActions.vue'
import { useEventDetail } from '@/composables/useEventDetail'

const props = defineProps({
  event: {
    type: Object,
    required: true
  },
  userRole: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['close', 'action'])

const {
  eventData,
  isSeance,
  eventTitle,
  statusClass,
  statusLabel,
  canJoinVisio,
  canStartEvaluation,
  canActivateVisio,
  canStartVisio,
  canEndVisio,
  formattedDate,
  formattedTimeRange,
  visioStatusText,
  emitAction
} = useEventDetail(props, emit)
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-container {
  background: var(--bg-primary);
  border-radius: 1rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.header-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-active {
  background-color: var(--success-bg);
  color: #16a34a;
}

.status-scheduled {
  background-color: var(--blue-100);
  color: var(--color-info-strong);
}

.status-ended {
  background-color: #f3f4f6;
  color: #6b7280;
}

.close-btn {
  flex-shrink: 0;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.375rem;
  transition: all 0.2s;
}

.close-btn:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

/* Responsive */
@media (max-width: 640px) {
  .modal-container {
    max-width: 100%;
    max-height: 100vh;
    border-radius: 0;
  }
}
</style>
