<template>
  <Modal
    :model-value="true"
    :title="event.title"
    size="md"
    @close="$emit('close')"
  >
    <div class="event-detail">
      <ClockIcon class="detail-icon" />
      <div>
        <p class="detail-label">Horaire</p>
        <p class="detail-value">
          {{ formatEventTime(event.start) }}
          <template v-if="event.end">
            - {{ formatEventTime(event.end) }}
          </template>
        </p>
      </div>
    </div>

    <div v-if="event.extendedProps.classe" class="event-detail">
      <BuildingLibraryIcon class="detail-icon" />
      <div>
        <p class="detail-label">Classe</p>
        <p class="detail-value">{{ event.extendedProps.classe }}</p>
      </div>
    </div>

    <div v-if="event.extendedProps.matiere" class="event-detail">
      <BookOpenIcon class="detail-icon" />
      <div>
        <p class="detail-label">Matière</p>
        <p class="detail-value">{{ event.extendedProps.matiere }}</p>
      </div>
    </div>

    <div v-if="event.extendedProps.enseignant" class="event-detail">
      <UserIcon class="detail-icon" />
      <div>
        <p class="detail-label">Enseignant</p>
        <p class="detail-value">{{ event.extendedProps.enseignant }}</p>
      </div>
    </div>

    <div v-if="event.extendedProps.description" class="event-detail">
      <InformationCircleIcon class="detail-icon" />
      <div>
        <p class="detail-label">Description</p>
        <p class="detail-value">{{ event.extendedProps.description }}</p>
      </div>
    </div>

    <template v-if="event.extendedProps.url" #footer>
      <BaseButton class="action-btn primary" @click="$emit('go')">
        Voir les détails
      </BaseButton>
    </template>
  </Modal>
</template>

<script setup>
/**
 * Modale de détail d'un événement du widget calendrier (H8 — décomposition
 * CalendarWidget.vue). Sous-composant présentationnel : reçoit l'`event` en prop,
 * émet `close` et `go` (navigation pilotée par le parent). Le formatage d'heure
 * (pur) reste local. CSS déplacé verbatim.
 */
import Modal from '@/components/ui/Modal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import {
  ClockIcon,
  BuildingLibraryIcon,
  BookOpenIcon,
  UserIcon,
  InformationCircleIcon
} from '@heroicons/vue/24/outline'

defineProps({
  event: {
    type: Object,
    required: true
  }
})

defineEmits(['close', 'go'])

function formatEventTime(date) {
  if (!date) return ''
  const d = new Date(date)
  const hours = d.getHours().toString().padStart(2, '0')
  const minutes = d.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}
</script>

<style scoped>
.event-detail {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.detail-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--color-primary);
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.detail-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.025em;
  margin: 0 0 0.25rem 0;
}

.detail-value {
  font-size: 0.875rem;
  color: var(--text-primary);
  margin: 0;
}

.action-btn {
  width: 100%;
  padding: 0.75rem 1.5rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: var(--color-info-strong);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}
</style>
