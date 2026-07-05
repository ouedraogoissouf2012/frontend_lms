<template>
  <Modal
    :model-value="true"
    size="lg"
    @close="$emit('close')"
  >
    <template #header>
      <div class="header-content">
        <h3 class="modal-title">
          {{ eventTitle }}
        </h3>
        <span :class="['status-badge', statusClass]">
          {{ statusLabel }}
        </span>
      </div>
    </template>

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

    <template #footer>
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
    </template>
  </Modal>
</template>

<script setup>
/**
 * Modale de détail d'un événement (H8 — orchestrateur ≤300). Computeds, capacités
 * selon le rôle et formatage délégués au composable useEventDetail ; les sections
 * (séance / évaluation / actions) sont rendues par des sous-composants présentationnels.
 */
import Modal from '@/components/ui/Modal.vue'
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
  color: var(--color-success-strong);
}

.status-scheduled {
  background-color: var(--blue-100);
  color: var(--color-info-strong);
}

.status-ended {
  background-color: var(--gray-100);
  color: var(--gray-500);
}

</style>
