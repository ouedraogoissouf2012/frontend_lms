<template>
  <div class="calendar-card card">
    <ContentLoader v-if="loading" text="Chargement du calendrier..." />

    <div v-else class="calendar-wrapper">
      <FullCalendar ref="calendarRef" :options="calendarOptions" />
    </div>
  </div>
</template>

<script setup>
/**
 * Grille du calendrier unifié (#107 — décomposition UniversalCalendar).
 *
 * Ce sous-composant encapsule entièrement FullCalendar : plugins, locale, options de
 * rendu (mois/semaine/jour), et la synchronisation impérative des événements via l'API.
 * Le parent reste maître de l'état (vue courante, date affichée, événement sélectionné)
 * et pilote la grille par des méthodes exposées (prev/next/today/changeView) ; la grille
 * remonte ses changements internes via les évènements `event-click`, `dates-set` et
 * `view-changed` (ex. un clic sur une date en vue mois bascule en vue jour).
 */
import { ref, computed, watch } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import frLocale from '@fullcalendar/core/locales/fr'
import ContentLoader from '@/components/common/ContentLoader.vue'

const props = defineProps({
  events: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  initialView: { type: String, default: 'dayGridMonth' }
})

const emit = defineEmits(['event-click', 'dates-set', 'view-changed'])

const calendarRef = ref(null)

function getApi() {
  return calendarRef.value?.getApi() ?? null
}

const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: props.initialView,
  initialDate: new Date(), // Forcer le calendrier à afficher le mois actuel
  locale: frLocale,
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: ''
  },
  buttonText: {
    today: "Aujourd'hui",
    month: 'Mois',
    week: 'Semaine',
    day: 'Jour'
  },
  events: props.events,
  eventClick: (info) => emit('event-click', info.event),
  dateClick: handleDateClick,
  datesSet: (dateInfo) => {
    // Utiliser le milieu de la plage visible pour déterminer le mois affiché
    // (dateInfo.start peut être un jour du mois précédent en vue mensuelle)
    const mid = new Date((dateInfo.start.getTime() + dateInfo.end.getTime()) / 2)
    emit('dates-set', mid)
  },
  nowIndicator: true,
  slotMinTime: '07:00:00',
  slotMaxTime: '20:00:00',
  allDaySlot: false,
  height: 'auto',
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
  eventClassNames: (arg) => {
    const classNames = ['event-item']
    if (arg.event.extendedProps.eventType) {
      classNames.push(`event-${arg.event.extendedProps.eventType}`)
    }
    if (arg.event.extendedProps.isUrgent) {
      classNames.push('event-urgent')
    }
    return classNames
  }
}))

function handleDateClick(info) {
  // Clic sur une date en vue mois → basculer en vue jour
  const api = getApi()
  if (api && api.view.type === 'dayGridMonth') {
    api.changeView('timeGridDay', info.dateStr)
    emit('view-changed', 'timeGridDay')
  }
}

// Synchronisation impérative : FullCalendar ne réagit pas toujours au remplacement
// du tableau d'événements, on force donc le rafraîchissement via l'API.
watch(
  () => props.events,
  (newEvents) => {
    const api = getApi()
    if (api) {
      api.removeAllEvents()
      newEvents.forEach((event) => api.addEvent(event))
    }
  },
  { deep: true, immediate: true }
)

// API impérative pour le parent (la navigation pilote FullCalendar sans y accéder).
function prev() {
  getApi()?.prev()
}
function next() {
  getApi()?.next()
}
function today() {
  getApi()?.today()
}
function changeView(view) {
  getApi()?.changeView(view)
}

defineExpose({ prev, next, today, changeView, getApi })
</script>

<style lang="scss" scoped>
// Sous-ensemble local des variables LMS (couleurs « système » via var(--…) globales).
$lms-blue: #2563eb;
$lms-blue-light: #3b82f6;
$white: #ffffff;
$text-primary: #1E293B;
$text-secondary: #64748B;
$text-tertiary: #6B7280;
$gray-border: #E5E7EB;
$transition-fast: all 0.2s ease;
$shadow-hover: 0 4px 12px rgba(0, 0, 0, 0.1);

.calendar-card {
  padding: 0;
  overflow: hidden;
}

.calendar-wrapper {
  padding: 1rem;
}

.loading-container {
  padding: 4rem;
  text-align: center;
  color: var(--text-tertiary, $text-tertiary);

  .material-icons {
    font-size: 3rem;
    color: $lms-blue;
    margin-bottom: 1rem;

    &.spin {
      animation: spin 1s linear infinite;
    }
  }

  p {
    font-size: 1rem;
    color: var(--text-secondary, $text-secondary);
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

// ========== FULLCALENDAR (CHROME PROPRE À LA GRILLE) ==========
:deep(.fc) {
  font-family: inherit;

  .fc-toolbar-title {
    display: none;
  }

  .fc-header-toolbar {
    margin-bottom: 1rem;
  }

  .fc-button-primary {
    background: $lms-blue;
    border-color: $lms-blue;
    transition: $transition-fast;

    &:hover:not(:disabled) {
      background: $lms-blue-light;
      border-color: $lms-blue-light;
    }

    &:focus {
      box-shadow: 0 0 0 3px rgba($lms-blue, 0.2);
    }
  }

  // En-tête des jours (lun, mar, mer, etc.) - Couleur sidebar
  .fc-col-header-cell {
    background: linear-gradient(180deg, #0052cc 0%, #0747a6 100%);
    border-color: #0747a6;

    .fc-col-header-cell-cushion {
      color: $white;
      font-weight: 600;
      padding: 0.75rem 0.5rem;
    }
  }

  // Cases des jours
  .fc-daygrid-day,
  .fc-timegrid-slot {
    background: var(--bg-secondary, $white);
    border-color: var(--border-primary, $gray-border);
  }

  // Numéros des jours
  .fc-daygrid-day-number,
  .fc-timegrid-slot-label {
    color: var(--text-primary, $text-primary);
    padding: 0.5rem;
  }

  // Jour actuel (aujourd'hui)
  .fc-daygrid-day.fc-day-today {
    background: linear-gradient(135deg, rgba($lms-blue, 0.15) 0%, rgba($lms-blue, 0.08) 100%);
    border: 2px solid $lms-blue;

    .fc-daygrid-day-number {
      color: $lms-blue;
      font-weight: 700;
    }
  }

  // Ligne de l'heure actuelle (time grid)
  .fc-timegrid-now-indicator-line {
    border-color: $lms-blue;
    border-width: 2px;
  }

  .fc-timegrid-now-indicator-arrow {
    border-color: $lms-blue;
  }

  .fc-timegrid-slot {
    height: 3rem;
  }

  // Couleurs des événements
  .event-seance {
    background: #2563eb; /* LMS blue (séances) */;
    border-color: #2563eb; /* LMS blue */
  }

  .event-evaluation {
    background: #06b6d4; /* Cyan (évaluations) */;
    border-color: #06b6d4; /* Cyan */
  }

  .event-urgent {
    background: #ef4444 !important;
    border-color: #ef4444 !important;
    animation: pulse 2s infinite;
  }

  // Événements en mode clair
  .fc-event {
    cursor: pointer;
    transition: $transition-fast;

    &:hover {
      opacity: 0.9;
      transform: translateY(-1px);
      box-shadow: $shadow-hover;
    }
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}
</style>

<!-- Mode sombre : non-scoped pour cibler html[data-theme="dark"] (#107) -->
<style lang="scss">
$lms-blue: #2563eb;
$lms-blue-light: #3b82f6;
$white: #ffffff;

html[data-theme="dark"] {
  // Conteneur de chargement de la grille en mode sombre
  .loading-container {
    color: rgba($white, 0.7);

    .material-icons {
      color: $lms-blue-light;
    }

    p {
      color: rgba($white, 0.7);
    }
  }

  // FullCalendar en mode sombre
  .fc {
    color: $white;

    .fc-button-primary {
      background: linear-gradient(135deg, $lms-blue-light 0%, $lms-blue 100%);
      border-color: $lms-blue-light;
      color: $white;

      &:hover:not(:disabled) {
        background: $lms-blue;
        border-color: $lms-blue;
      }

      &:focus {
        box-shadow: 0 0 0 3px rgba($lms-blue-light, 0.3);
      }
    }

    .fc-col-header-cell {
      background: linear-gradient(180deg, #0a1929 0%, #001e3c 100%) !important;
      border-color: #001e3c !important;

      .fc-col-header-cell-cushion {
        color: $white !important;
        font-weight: 600;
      }
    }

    .fc-daygrid-day,
    .fc-timegrid-slot {
      background: var(--bg-secondary) !important;
      border-color: var(--border-primary) !important;
    }

    .fc-daygrid-day-number,
    .fc-timegrid-slot-label {
      color: var(--text-primary) !important;
    }

    .fc-daygrid-day.fc-day-today {
      background: linear-gradient(135deg, rgba($lms-blue-light, 0.3) 0%, rgba($lms-blue-light, 0.15) 100%) !important;
      border: 2px solid $lms-blue-light !important;

      .fc-daygrid-day-number {
        color: $lms-blue-light !important;
        font-weight: 700;
      }
    }

    .fc-daygrid-day.fc-day-other {
      background: var(--bg-tertiary) !important;
      opacity: 0.6;

      .fc-daygrid-day-number {
        color: var(--text-tertiary) !important;
      }
    }

    .fc-timegrid-now-indicator-line {
      border-color: $lms-blue-light;
    }

    .fc-timegrid-now-indicator-arrow {
      border-color: $lms-blue-light;
    }

    // Événements en mode sombre
    .fc-event {
      border-width: 2px;
      font-weight: 500;
    }

    .event-seance {
      background: rgba($lms-blue, 0.9);
      border-color: $lms-blue;
      color: $white;

      &:hover {
        background: $lms-blue;
        box-shadow: 0 2px 8px rgba($lms-blue, 0.5);
      }
    }

    .event-evaluation {
      background: rgba(#06b6d4, 0.9);
      border-color: #06b6d4;
      color: $white;
      font-weight: 600;

      &:hover {
        background: #06b6d4;
        box-shadow: 0 2px 8px rgba(#06b6d4, 0.5);
      }
    }

    .event-urgent {
      background: #ef4444 !important;
      border-color: #ef4444 !important;
      color: $white !important;
      animation: pulse-urgent-dark 2s infinite;

      &:hover {
        box-shadow: 0 2px 8px rgba(#ef4444, 0.5);
      }
    }

    // Grille horaire en mode sombre
    .fc-scrollgrid {
      border-color: var(--border-primary) !important;
    }

    .fc-scrollgrid-section > * {
      border-color: var(--border-primary) !important;
    }

    // Conteneurs FullCalendar en mode sombre
    .fc-view-harness,
    .fc-scrollgrid-sync-table,
    .fc-timegrid-body,
    .fc-timegrid-slots,
    .fc-daygrid-body {
      background: var(--bg-secondary) !important;
    }

    // Cellules de la grille temporelle
    .fc-timegrid-slot-lane {
      background: var(--bg-secondary) !important;
      border-color: var(--border-primary) !important;
    }

    // Zone vide du calendrier
    .fc-daygrid-day-frame,
    .fc-daygrid-day-bg {
      background: transparent !important;
    }

    // Table et corps du calendrier
    table, tbody, tr, td, th {
      border-color: var(--border-primary) !important;
    }
  }

  @keyframes pulse-urgent-dark {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.85;
      transform: scale(1.02);
    }
  }
}
</style>
