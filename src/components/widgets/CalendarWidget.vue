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
  border-bottom: 1px solid var(--border-primary);
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
  border: 1px solid var(--border-primary);
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

/* #628 — FullCalendar 7 : ses classes sont hachées. Ses couleurs viennent de nos jetons (_calendar-fc-tokens.scss).
   Le thème classic écrit la couleur d'événement EN LIGNE : nos classes d'événement (option `eventClass`) la
   recouvrent par `!important`, comme en v6 où la classe du widget l'emportait sur la couleur des données. */
:deep(.event-seance) {
  --fc-event-color: var(--blue-500) !important;
}

:deep(.event-evaluation) {
  --fc-event-color: var(--amber-500) !important;
}

:deep(.event-visio) {
  --fc-event-color: var(--emerald-500) !important;
}

/* En-tête des jours, titre de la barre, cellule du jour : NOS classes, posées par les options `…Class` de v7. */
:deep(.lms-entete-widget) {
  background: var(--bg-secondary);
}

/* Texte d'en-tête, numéro du jour CENTRÉ, boutons neutres : les valeurs de v6 (le thème met 14 px, cale le numéro
   à droite et peint les boutons en bleu). */
:deep(.lms-entete-widget-texte) {
  color: var(--text-secondary);
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.75rem;
  padding: 0.75rem 0.5rem;
}

:deep(.lms-haut-centre) {
  justify-content: center;
}

:deep(.lms-numero) {
  color: var(--text-primary);
  font-weight: 600;
  font-size: 1rem;
  padding: 0.25rem;
}

:deep(.lms-numero-hors-mois) {
  opacity: 0.3;
}

:deep(.lms-bouton-widget) {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  color: var(--text-primary);
  padding: 0.5rem 1rem;
  font-weight: 600;
}

:deep(.lms-bouton-widget:hover) {
  background: var(--bg-tertiary);
}

:deep(.lms-titre-widget) {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
}

:deep(.lms-jour-aujourdhui) {
  background: rgba(var(--blue-500-rgb), 0.1);
}

:deep(.event-item) {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

:deep(.event-item:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

/* Responsive */
@media (max-width: 768px) {
  .calendar-container {
    padding: 0.5rem;
  }

  .header-actions {
    display: none;
  }
}
</style>

<!-- #628 : les couleurs de FullCalendar 7 par nos jetons (global, non-scoped). -->
<style lang="scss">
@use '../../assets/styles/calendar-fc-tokens';
</style>
