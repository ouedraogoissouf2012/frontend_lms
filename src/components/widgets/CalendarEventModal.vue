<template>
  <div class="event-modal-overlay" @click="$emit('close')">
    <div class="event-modal" @click.stop>
      <div class="modal-header">
        <h3 class="modal-title">{{ event.title }}</h3>
        <button class="close-btn" @click="$emit('close')">
          <XMarkIcon class="w-5 h-5" />
        </button>
      </div>
      <div class="modal-body">
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
      </div>
      <div v-if="event.extendedProps.url" class="modal-footer">
        <button class="action-btn primary" @click="$emit('go')">
          Voir les détails
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Modale de détail d'un événement du widget calendrier (H8 — décomposition
 * CalendarWidget.vue). Sous-composant présentationnel : reçoit l'`event` en prop,
 * émet `close` et `go` (navigation pilotée par le parent). Le formatage d'heure
 * (pur) reste local. CSS déplacé verbatim.
 */
import {
  ClockIcon,
  BuildingLibraryIcon,
  BookOpenIcon,
  UserIcon,
  InformationCircleIcon,
  XMarkIcon
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
/* Event Modal */
.event-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}

.event-modal {
  background: var(--bg-primary);
  border-radius: 1rem;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background: transparent;
  border: none;
  border-radius: 0.5rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.modal-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

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

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid var(--border-color);
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
  background: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}
</style>
