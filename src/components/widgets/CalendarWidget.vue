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
    <CalendarWidgetLegend />

    <!-- Event Detail Modal -->
    <CalendarEventModal
      v-if="selectedEvent"
      :event="selectedEvent"
      @close="closeEventModal"
      @go="goToEvent"
    />
  </div>
</template>

<script setup>
/**
 * Widget calendrier (H8 — orchestrateur ≤300). État + config FullCalendar +
 * handlers délégués au composable useCalendarWidget ; légende et modale de détail
 * rendues par CalendarWidgetLegend / CalendarEventModal.
 */
import FullCalendar from '@fullcalendar/vue3'
import { CalendarIcon } from '@heroicons/vue/24/outline'
import CalendarWidgetLegend from '@/components/widgets/CalendarWidgetLegend.vue'
import CalendarEventModal from '@/components/widgets/CalendarEventModal.vue'
import { useCalendarWidget } from '@/composables/useCalendarWidget'

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

const {
  calendarRef,
  currentView,
  selectedEvent,
  calendarOptions,
  changeView,
  closeEventModal,
  goToEvent
} = useCalendarWidget(props, emit)
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
  background: var(--blue-500) !important;
  border-color: var(--color-info-strong) !important;
}

:deep(.event-evaluation) {
  background: var(--amber-500) !important;
  border-color: var(--amber-600) !important;
}

:deep(.event-visio) {
  background: var(--emerald-500) !important;
  border-color: var(--emerald-600) !important;
}

:deep(.fc-event) {
  cursor: pointer !important;
  transition: transform 0.2s, box-shadow 0.2s !important;
}

:deep(.fc-event:hover) {
  transform: translateY(-2px) !important;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2) !important;
}

/* Responsive */
@media (max-width: 768px) {
  .calendar-container {
    padding: 0.5rem;
  }

  .header-actions {
    display: none;
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
