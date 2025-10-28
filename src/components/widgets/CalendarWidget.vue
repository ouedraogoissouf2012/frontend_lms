<template>
  <div class="calendar-widget">
    <!-- Header -->
    <div class="widget-header">
      <div class="header-left">
        <CalendarIcon class="widget-icon" />
        <h2 class="widget-title">Calendrier des événements</h2>
      </div>
      <div class="header-actions">
        <button
          class="view-btn"
          :class="{ active: currentView === 'dayGridMonth' }"
          @click="changeView('dayGridMonth')"
        >
          Mois
        </button>
        <button
          class="view-btn"
          :class="{ active: currentView === 'timeGridWeek' }"
          @click="changeView('timeGridWeek')"
        >
          Semaine
        </button>
        <button
          class="view-btn"
          :class="{ active: currentView === 'timeGridDay' }"
          @click="changeView('timeGridDay')"
        >
          Jour
        </button>
      </div>
    </div>

    <!-- Calendar -->
    <div class="calendar-container">
      <FullCalendar
        ref="calendarRef"
        :options="calendarOptions"
      />
    </div>

    <!-- Legend -->
    <div class="calendar-legend">
      <div class="legend-item">
        <span class="legend-dot seance"></span>
        <span class="legend-label">Séances</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot evaluation"></span>
        <span class="legend-label">Évaluations</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot visio"></span>
        <span class="legend-label">Visioconférences</span>
      </div>
    </div>

    <!-- Event Detail Modal -->
    <div v-if="selectedEvent" class="event-modal-overlay" @click="closeEventModal">
      <div class="event-modal" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">{{ selectedEvent.title }}</h3>
          <button class="close-btn" @click="closeEventModal">
            <XMarkIcon class="w-5 h-5" />
          </button>
        </div>
        <div class="modal-body">
          <div class="event-detail">
            <ClockIcon class="detail-icon" />
            <div>
              <p class="detail-label">Horaire</p>
              <p class="detail-value">
                {{ formatEventTime(selectedEvent.start) }}
                <template v-if="selectedEvent.end">
                  - {{ formatEventTime(selectedEvent.end) }}
                </template>
              </p>
            </div>
          </div>

          <div v-if="selectedEvent.extendedProps.classe" class="event-detail">
            <BuildingLibraryIcon class="detail-icon" />
            <div>
              <p class="detail-label">Classe</p>
              <p class="detail-value">{{ selectedEvent.extendedProps.classe }}</p>
            </div>
          </div>

          <div v-if="selectedEvent.extendedProps.matiere" class="event-detail">
            <BookOpenIcon class="detail-icon" />
            <div>
              <p class="detail-label">Matière</p>
              <p class="detail-value">{{ selectedEvent.extendedProps.matiere }}</p>
            </div>
          </div>

          <div v-if="selectedEvent.extendedProps.enseignant" class="event-detail">
            <UserIcon class="detail-icon" />
            <div>
              <p class="detail-label">Enseignant</p>
              <p class="detail-value">{{ selectedEvent.extendedProps.enseignant }}</p>
            </div>
          </div>

          <div v-if="selectedEvent.extendedProps.description" class="event-detail">
            <InformationCircleIcon class="detail-icon" />
            <div>
              <p class="detail-label">Description</p>
              <p class="detail-value">{{ selectedEvent.extendedProps.description }}</p>
            </div>
          </div>
        </div>
        <div v-if="selectedEvent.extendedProps.url" class="modal-footer">
          <button class="action-btn primary" @click="goToEvent">
            Voir les détails
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import frLocale from '@fullcalendar/core/locales/fr'
import {
  CalendarIcon,
  ClockIcon,
  BuildingLibraryIcon,
  BookOpenIcon,
  UserIcon,
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const calendarRef = ref(null)
const currentView = ref('dayGridMonth')
const selectedEvent = ref(null)

const props = defineProps({
  events: {
    type: Array,
    default: () => []
  },
  height: {
    type: String,
    default: '600px'
  }
})

const emit = defineEmits(['event-click', 'date-click'])

const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: currentView.value,
  locale: frLocale,
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: ''
  },
  buttonText: {
    today: 'Aujourd\'hui',
    month: 'Mois',
    week: 'Semaine',
    day: 'Jour'
  },
  height: props.height,
  events: props.events,
  eventClick: handleEventClick,
  dateClick: handleDateClick,
  eventColor: '#3b82f6',
  eventTimeFormat: {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  },
  slotLabelFormat: {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  },
  nowIndicator: true,
  editable: false,
  selectable: true,
  selectMirror: true,
  dayMaxEvents: true,
  weekends: true,
  eventClassNames: (arg) => {
    const classes = ['event-item']
    if (arg.event.extendedProps.type) {
      classes.push(`event-${arg.event.extendedProps.type}`)
    }
    return classes
  }
}))

function changeView(view) {
  currentView.value = view
  const calendarApi = calendarRef.value?.getApi()
  if (calendarApi) {
    calendarApi.changeView(view)
  }
}

function handleEventClick(info) {
  selectedEvent.value = info.event
  emit('event-click', info.event)
}

function handleDateClick(info) {
  emit('date-click', info)
}

function closeEventModal() {
  selectedEvent.value = null
}

function formatEventTime(date) {
  if (!date) return ''
  const d = new Date(date)
  const hours = d.getHours().toString().padStart(2, '0')
  const minutes = d.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

function goToEvent() {
  if (selectedEvent.value?.extendedProps?.url) {
    router.push(selectedEvent.value.extendedProps.url)
    closeEventModal()
  }
}

onMounted(() => {
  console.log('CalendarWidget mounted avec', props.events.length, 'événements')
})
</script>

<style scoped>
.calendar-widget {
  background: var(--bg-primary);
  border-radius: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.widget-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem;
  border-bottom: 1px solid var(--border-color);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.widget-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--color-primary);
}

.widget-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.view-btn {
  padding: 0.5rem 1rem;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.view-btn:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.view-btn.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

/* Calendar Container */
.calendar-container {
  padding: 1rem;
}

/* Override FullCalendar styles */
:deep(.fc) {
  font-family: inherit;
}

:deep(.fc-toolbar-title) {
  font-size: 1.25rem !important;
  font-weight: 700 !important;
  color: var(--text-primary) !important;
}

:deep(.fc-button) {
  background: var(--bg-secondary) !important;
  border: 1px solid var(--border-color) !important;
  color: var(--text-primary) !important;
  padding: 0.5rem 1rem !important;
  font-weight: 600 !important;
  text-transform: capitalize !important;
}

:deep(.fc-button:hover) {
  background: var(--bg-tertiary) !important;
}

:deep(.fc-button-primary:not(:disabled).fc-button-active) {
  background: var(--color-primary) !important;
  border-color: var(--color-primary) !important;
  color: white !important;
}

:deep(.fc-col-header-cell) {
  background: var(--bg-secondary) !important;
  color: var(--text-secondary) !important;
  font-weight: 600 !important;
  text-transform: uppercase !important;
  font-size: 0.75rem !important;
  padding: 0.75rem 0.5rem !important;
}

:deep(.fc-daygrid-day-number) {
  color: var(--text-primary) !important;
  font-weight: 600 !important;
  padding: 0.5rem !important;
}

:deep(.fc-day-today) {
  background: rgba(59, 130, 246, 0.1) !important;
}

:deep(.fc-daygrid-day-top) {
  justify-content: center !important;
}

/* Event Styles */
:deep(.event-seance) {
  background: #3b82f6 !important;
  border-color: #2563eb !important;
}

:deep(.event-evaluation) {
  background: #f59e0b !important;
  border-color: #d97706 !important;
}

:deep(.event-visio) {
  background: #10b981 !important;
  border-color: #059669 !important;
}

:deep(.fc-event) {
  cursor: pointer !important;
  transition: transform 0.2s, box-shadow 0.2s !important;
}

:deep(.fc-event:hover) {
  transform: translateY(-2px) !important;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2) !important;
}

/* Legend */
.calendar-legend {
  display: flex;
  gap: 1.5rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--border-color);
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.legend-dot {
  width: 1rem;
  height: 1rem;
  border-radius: 0.25rem;
}

.legend-dot.seance {
  background: #3b82f6;
}

.legend-dot.evaluation {
  background: #f59e0b;
}

.legend-dot.visio {
  background: #10b981;
}

.legend-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 500;
}

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

/* Responsive */
@media (max-width: 768px) {
  .calendar-container {
    padding: 0.5rem;
  }

  .header-actions {
    display: none;
  }

  .calendar-legend {
    flex-direction: column;
    gap: 0.75rem;
  }

  :deep(.fc-toolbar) {
    flex-direction: column !important;
    gap: 0.5rem !important;
  }

  :deep(.fc-toolbar-chunk) {
    display: flex !important;
    justify-content: center !important;
  }
}
</style>
