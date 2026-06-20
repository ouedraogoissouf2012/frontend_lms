<template>
  <div class="calendar-container">
    <!-- ========== NAVIGATION CARD ========== -->
    <div class="navigation-card card">
      <div class="navigation-controls">
        <button class="nav-button" @click="previousMonth()" title="Mois précédent">
          <i class="material-icons">chevron_left</i>
        </button>

        <div class="current-month">
          <i class="material-icons">calendar_today</i>
          <span>{{ currentMonthLabel }}</span>
        </div>

        <button class="nav-button" @click="nextMonth()" title="Mois suivant">
          <i class="material-icons">chevron_right</i>
        </button>

        <button class="today-button" @click="goToToday()" title="Revenir à aujourd'hui">
          <i class="material-icons">today</i>
          Aujourd'hui
        </button>

        <button class="refresh-button" @click="refreshData()" :disabled="refreshing" title="Actualiser les donnees depuis KLASSCI">
          <i class="material-icons" :class="{ 'spin': refreshing }">sync</i>
          {{ refreshing ? 'Chargement...' : 'Actualiser' }}
        </button>

        <div class="view-selector">
          <button
            :class="{ active: currentView === 'dayGridMonth' }"
            @click="changeView('dayGridMonth')"
            title="Vue mensuelle"
          >
            <i class="material-icons">view_module</i>
            Mois
          </button>
          <button
            :class="{ active: currentView === 'timeGridWeek' }"
            @click="changeView('timeGridWeek')"
            title="Vue hebdomadaire"
          >
            <i class="material-icons">view_week</i>
            Semaine
          </button>
          <button
            :class="{ active: currentView === 'timeGridDay' }"
            @click="changeView('timeGridDay')"
            title="Vue journalière"
          >
            <i class="material-icons">view_day</i>
            Jour
          </button>
        </div>
      </div>
    </div>

    <!-- ========== FILTERS CARD (#28bis : extraite en sous-composant) ========== -->
    <CalendarFilters
      v-model:event-type-filter="eventTypeFilter"
      v-model:date-range-preset="dateRangePreset"
      v-model:selected-matiere="selectedMatiere"
      v-model:selected-classe="selectedClasse"
      v-model:selected-enseignant="selectedEnseignant"
      :matieres="matieres"
      :classes="classes"
      :enseignants="enseignants"
      :show-matiere-filter="showMatiereFilter"
      :show-classe-filter="showClasseFilter"
      :show-enseignant-filter="showEnseignantFilter"
      :event-count="filteredEvents.length"
      @reset="resetFilters"
      @apply-preset="applyDateRangePreset"
    />

    <!-- ========== CALENDAR CARD ========== -->
    <div class="calendar-card card">
      <ContentLoader v-if="loading" text="Chargement du calendrier..." />

      <div v-else class="calendar-wrapper">
        <FullCalendar
          ref="calendarRef"
          :options="calendarOptions"
        />
      </div>
    </div>

    <!-- ========== LEGEND CARD ========== -->
    <div class="legend-card card">
      <h3>
        <i class="material-icons">info</i>
        Légende
      </h3>
      <div class="legend-items">
        <div class="legend-item">
          <div class="color-dot" style="background: #2563eb; /* LMS blue (séances) */"></div>
          <span>Séances</span>
        </div>
        <div class="legend-item">
          <div class="color-dot" style="background: #10b981"></div>
          <span>Visio active</span>
        </div>
        <div class="legend-item">
          <div class="color-dot" style="background: #ea580c; /* LMS orange (évaluations) */"></div>
          <span>Évaluations</span>
        </div>
        <div class="legend-item">
          <div class="color-dot" style="background: #ef4444"></div>
          <span>Urgent (&lt; 24h)</span>
        </div>
      </div>
    </div>

    <!-- Modal de détails -->
    <EventDetailModal
      v-if="selectedEvent"
      :event="selectedEvent"
      :user-role="userRole"
      @close="selectedEvent = null"
      @action="handleEventAction"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import frLocale from '@fullcalendar/core/locales/fr'
import EventDetailModal from './EventDetailModal.vue'
import CalendarFilters from './CalendarFilters.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
// #28bis : données + chargement extraits dans le composable (couleurs/urgence/bornes
// pures dans @/utils/calendar, testées dans tests/unit/calendar.test.js)
import { useCalendarEvents } from '@/composables/useCalendarEvents'

const props = defineProps({
  userRole: {
    type: String,
    required: true,
    validator: (value) => ['student', 'teacher', 'coordinator', 'admin'].includes(value)
  },
  userId: {
    type: Number,
    default: null
  }
})

const emit = defineEmits(['event-action'])

const router = useRouter()
const calendarRef = ref(null)
const currentView = ref('dayGridMonth')
const currentDate = ref(new Date())  // Pour forcer la réactivité du label
const selectedEvent = ref(null)

// Filtres
const eventTypeFilter = ref('all')
const dateRangePreset = ref('30days')
const selectedMatiere = ref('')
const selectedClasse = ref('')
const selectedEnseignant = ref('')

// Données + chargement délégués au composable (#28bis : script < 300)
const { events, matieres, classes, enseignants, loading, refreshing, loadEvents, refreshData } = useCalendarEvents({
  getUserRole: () => props.userRole,
  getUserId: () => props.userId,
  eventTypeFilter,
  dateRangePreset
})

// Computed - Label mois courant
const currentMonthLabel = computed(() => {
  return currentDate.value.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
})

// Filtres conditionnels selon le rôle
const showMatiereFilter = computed(() => {
  return ['teacher', 'admin', 'coordinator'].includes(props.userRole)
})

const showClasseFilter = computed(() => {
  return ['admin', 'coordinator'].includes(props.userRole)
})

const showEnseignantFilter = computed(() => {
  return ['admin', 'coordinator'].includes(props.userRole)
})

// Événements filtrés
const filteredEvents = computed(() => {
  let filtered = events.value

  // Filtre par type d'événement
  if (eventTypeFilter.value !== 'all') {
    filtered = filtered.filter(event => event.extendedProps.eventType === eventTypeFilter.value.replace(/s$/, ''))
  }

  // Filtre par matière
  if (selectedMatiere.value) {
    filtered = filtered.filter(event => event.extendedProps.matiereId === parseInt(selectedMatiere.value))
  }

  // Filtre par classe
  if (selectedClasse.value) {
    filtered = filtered.filter(event => event.extendedProps.classeId === parseInt(selectedClasse.value))
  }

  // Filtre par enseignant
  if (selectedEnseignant.value) {
    filtered = filtered.filter(event => event.extendedProps.enseignantId === parseInt(selectedEnseignant.value))
  }

  return filtered
})

// Configuration FullCalendar
const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: currentView.value,
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
  events: filteredEvents.value,
  eventClick: handleEventClick,
  dateClick: handleDateClick,
  datesSet: (dateInfo) => {
    // Utiliser le milieu de la plage visible pour déterminer le mois affiché
    // (dateInfo.start peut être un jour du mois précédent en vue mensuelle)
    const mid = new Date((dateInfo.start.getTime() + dateInfo.end.getTime()) / 2)
    currentDate.value = mid
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
    const classes = ['event-item']
    if (arg.event.extendedProps.eventType) {
      classes.push(`event-${arg.event.extendedProps.eventType}`)
    }
    if (arg.event.extendedProps.isUrgent) {
      classes.push('event-urgent')
    }
    return classes
  }
}))

// Charger les données
function applyDateRangePreset() {
  loadEvents()
}

function changeView(view) {
  currentView.value = view
  const calendarApi = calendarRef.value?.getApi()
  if (calendarApi) {
    calendarApi.changeView(view)
  }
}

function previousMonth() {
  const calendarApi = calendarRef.value?.getApi()
  if (calendarApi) {
    calendarApi.prev()
  }
}

function nextMonth() {
  const calendarApi = calendarRef.value?.getApi()
  if (calendarApi) {
    calendarApi.next()
  }
}

function goToToday() {
  const calendarApi = calendarRef.value?.getApi()
  if (calendarApi) {
    calendarApi.today()
  }
}

function handleEventClick(info) {
  selectedEvent.value = info.event
}

function handleDateClick(info) {
  // Naviguer vers la vue jour si clic sur une date en vue mois
  if (currentView.value === 'dayGridMonth') {
    const calendarApi = calendarRef.value?.getApi()
    if (calendarApi) {
      calendarApi.changeView('timeGridDay', info.dateStr)
      currentView.value = 'timeGridDay'
    }
  }
}

function handleEventAction(action) {
  emit('event-action', action)
  selectedEvent.value = null
}

function resetFilters() {
  eventTypeFilter.value = 'all'
  dateRangePreset.value = '30days'
  selectedMatiere.value = ''
  selectedClasse.value = ''
  selectedEnseignant.value = ''
  loadEvents()
}

// Charger au montage
onMounted(() => {
  loadEvents()
})

// Recharger quand les filtres changent
watch([eventTypeFilter], () => {
  loadEvents()
})

// IMPORTANT: Forcer FullCalendar a mettre a jour quand les evenements changent
watch(filteredEvents, (newEvents) => {
  const calendarApi = calendarRef.value?.getApi()
  if (calendarApi) {
    // Supprimer tous les evenements existants
    calendarApi.removeAllEvents()
    // Ajouter les nouveaux evenements
    newEvents.forEach(event => {
      calendarApi.addEvent(event)
    })
  }
}, { deep: true, immediate: true })

// Exposer les methodes pour le parent (force le bypass cache KLASSCI des 2 sources)
async function refreshEvents() {
  await refreshData()
}

defineExpose({
  refreshEvents
})
</script>

<style lang="scss" scoped>
// Couleurs LMS
$lms-blue: #2563eb;
$lms-blue-light: #3b82f6;
$lms-blue-dark: #1e3a8a;
$lms-orange: #ea580c;
$lms-green: #10b981;
$lms-red: #ef4444;

// Couleurs système
$white: #ffffff;
$text-primary: #1E293B;
$text-secondary: #64748B;
$text-tertiary: #6B7280;
$gray-lightest: #F9FAFB;
$gray-light: #F8FAFC;
$gray-medium: #E2E8F0;
$gray-border: #E5E7EB;
$gray-dark: #374151;

// Ombres
$shadow-light: 0 1px 3px rgba(0, 0, 0, 0.1);
$shadow-medium: 0 2px 8px rgba(0, 0, 0, 0.1);
$shadow-hover: 0 4px 12px rgba(0, 0, 0, 0.1);

// Transitions
$transition-fast: all 0.2s ease;

// Bordures
$border-radius-sm: 4px;
$border-radius-md: 6px;
$border-radius-lg: 8px;
$border-radius-xl: 12px;
$border-radius-full: 9999px;

.calendar-container {
  padding: 2rem;
  max-width: 1600px;
  margin: 0 auto;
}

// ========== CARD BASE ==========
.card {
  background: var(--card-bg, $white);
  border: 1px solid var(--card-border, transparent);
  border-radius: $border-radius-lg;
  box-shadow: var(--card-shadow, $shadow-light);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  transition: background 0.2s ease, border-color 0.2s ease;
}

// ========== NAVIGATION ==========
.navigation-card {
  padding: 1rem 1.5rem;

  .navigation-controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;

    .nav-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border: 1px solid var(--border-primary, $gray-border);
      border-radius: $border-radius-md;
      background: transparent;
      color: var(--text-primary, $text-primary);
      cursor: pointer;
      transition: $transition-fast;

      .material-icons {
        font-size: 1.5rem;
        color: var(--text-primary, $text-primary);
      }

      &:hover {
        background: var(--bg-hover, $gray-light);
        border-color: $lms-blue;
        color: $lms-blue;

        .material-icons {
          color: $lms-blue;
        }
      }
    }

    .current-month {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      font-size: 1.5rem;
      font-weight: 600;
      color: $lms-blue;
      text-transform: capitalize;

      .material-icons {
        color: $lms-blue;
      }
    }

    .today-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      border: 1px solid $lms-blue;
      color: $lms-blue;
      padding: 0.5rem 1rem;
      border-radius: $border-radius-md;
      background: transparent;
      transition: $transition-fast;
      font-weight: 500;
      cursor: pointer;

      &:hover {
        background: $lms-blue;
        color: $white;

        .material-icons {
          color: $white;
        }
      }
    }

    .refresh-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      border: 1px solid #10b981;
      color: #10b981;
      padding: 0.5rem 1rem;
      border-radius: $border-radius-md;
      background: transparent;
      transition: $transition-fast;
      font-weight: 500;
      cursor: pointer;

      &:hover:not(:disabled) {
        background: #10b981;
        color: $white;

        .material-icons {
          color: $white;
        }
      }

      &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }

      .material-icons.spin {
        animation: spin 1s linear infinite;
      }
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .view-selector {
      display: flex;
      gap: 0.5rem;
      border: 1px solid var(--border-primary, $gray-border);
      border-radius: $border-radius-lg;
      padding: 0.25rem;
      background: var(--bg-tertiary, $gray-lightest);

      button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border-radius: $border-radius-md;
        border: none;
        transition: $transition-fast;
        color: var(--text-tertiary, $text-tertiary);
        font-weight: 500;
        font-size: 0.875rem;
        cursor: pointer;
        background: transparent;

        &:hover {
          background: var(--bg-hover, $gray-medium);
          color: var(--text-primary, $gray-dark);
        }

        &.active {
          background: $lms-blue-dark;
          color: $white;
          font-weight: 600;
          box-shadow: 0 2px 4px rgba($lms-blue-dark, 0.2);

          .material-icons {
            color: $white;
          }
        }
      }
    }
  }
}

// ========== CALENDAR CARD ==========
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

// ========== LEGEND ==========
.legend-card {
  h3 {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin: 0 0 1rem 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: $lms-blue;

    .material-icons {
      color: $lms-blue;
      font-size: 1.5rem;
    }
  }

  .legend-items {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: var(--bg-tertiary, $gray-lightest);
    border-radius: $border-radius-lg;
    border: 1px solid var(--border-primary, $gray-border);

    .color-dot {
      width: 16px;
      height: 16px;
      border-radius: 50%;
    }

    span {
      font-size: 0.875rem;
      color: var(--text-primary, $gray-dark);
      font-weight: 500;
    }
  }
}

// ========== FULLCALENDAR CUSTOM STYLES ==========
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

// ========== RESPONSIVE ==========
@media (max-width: 768px) {
  .calendar-container {
    padding: 1rem;
  }

  .navigation-controls {
    flex-wrap: wrap;

    .current-month {
      order: -1;
      flex-basis: 100%;
      margin-bottom: 1rem;
    }

    .today-button,
    .view-selector {
      flex-basis: 100%;
    }
  }

  .filters-content {
    grid-template-columns: 1fr !important;

    .filter-count {
      justify-self: stretch;
      justify-content: center;
    }
  }
}
</style>

<!-- Styles mode sombre non-scoped pour fonctionner avec data-theme -->
<style lang="scss">
// Couleurs LMS pour le mode sombre
$lms-blue: #2563eb;
$lms-blue-light: #3b82f6;
$lms-blue-dark: #1e3a8a;
$lms-orange: #ea580c;
$lms-green: #10b981;
$lms-red: #ef4444;
$white: #ffffff;

// ========== DARK MODE ==========
html[data-theme="dark"] {
  .calendar-container {
    background: transparent;
  }

  // Cards en mode sombre
  .card {
    background: var(--card-bg) !important;
    border: 1px solid var(--card-border) !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  // Navigation en mode sombre
  .navigation-card {
    .nav-button {
      border-color: rgba($lms-blue-light, 0.5);
      color: $white;
      background: transparent;

      .material-icons {
        color: $white !important;
      }

      &:hover {
        background: rgba($lms-blue-light, 0.3);
        border-color: $lms-blue-light;
        color: $lms-blue-light;

        .material-icons {
          color: $lms-blue-light !important;
        }
      }
    }

    .current-month {
      color: $white;

      .material-icons {
        color: $lms-blue-light;
      }
    }

    .today-button {
      border-color: $lms-blue-light;
      color: $white;
      background: rgba($lms-blue-light, 0.2);

      &:hover {
        background: $lms-blue-light;
        color: $white;

        .material-icons {
          color: $white;
        }
      }
    }

    .view-selector {
      background: var(--bg-tertiary);
      border-color: var(--border-primary);

      button {
        color: rgba($white, 0.7);

        &:hover {
          background: rgba($lms-blue-light, 0.3);
          color: $white;
        }

        &.active {
          background: linear-gradient(135deg, $lms-blue-light 0%, $lms-blue 100%);
          color: $white;

          .material-icons {
            color: $white;
          }
        }
      }
    }
  }

  // Filtres en mode sombre
  .filters-card {
    .filters-title {
      .material-icons {
        color: $lms-blue-light;
      }

      h3 {
        color: $white;
      }
    }

    .reset-button {
      color: rgba($white, 0.7);

      &:hover {
        background: rgba($lms-blue-light, 0.3);
        color: $lms-blue-light;
      }
    }

    .filter-field {
      label {
        color: rgba($white, 0.8);

        .icon-label {
          color: $lms-blue-light;
        }
      }

      select {
        background: var(--input-bg);
        border-color: var(--input-border);
        color: var(--input-text);

        &:hover {
          border-color: $lms-blue-light;
        }

        &:focus {
          border-color: $lms-blue-light;
          box-shadow: 0 0 0 3px rgba($lms-blue-light, 0.2);
        }

        option {
          background: var(--bg-primary);
          color: var(--text-primary);
        }
      }
    }

    .filter-count {
      background: linear-gradient(135deg, $lms-blue-light 0%, $lms-blue 100%);
      color: $white;

      .material-icons {
        color: $white;
      }
    }
  }

  // Calendrier en mode sombre
  .calendar-card {
    background: var(--card-bg) !important;
  }

  .loading-container {
    color: rgba($white, 0.7);

    .material-icons {
      color: $lms-blue-light;
    }

    p {
      color: rgba($white, 0.7);
    }
  }

  // Légende en mode sombre
  .legend-card {
    h3 {
      color: $white;

      .material-icons {
        color: $lms-blue-light;
      }
    }

    .legend-item {
      background: var(--bg-tertiary);
      border-color: var(--border-primary);

      span {
        color: var(--text-primary);
      }
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
