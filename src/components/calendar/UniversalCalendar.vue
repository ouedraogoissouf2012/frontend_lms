<template>
  <div class="calendar-container">
    <!-- ========== NAVIGATION (H8 : extraite en sous-composant) ========== -->
    <CalendarNavigation
      :current-month-label="currentMonthLabel"
      :current-view="currentView"
      :refreshing="refreshing"
      @previous="previousMonth"
      @next="nextMonth"
      @today="goToToday"
      @refresh="refreshData"
      @change-view="changeView"
    />

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

    <!-- #238 : erreur de chargement distincte d'un agenda vide -->
    <div v-if="error" class="calendar-error" role="alert">
      {{ error }}
    </div>

    <!-- ========== CALENDAR CARD (H8 : extraite en sous-composant) ========== -->
    <div class="desktop-calendar-surface">
      <CalendarView
        ref="calendarViewRef"
        :options="calendarOptions"
        :loading="loading"
      />
    </div>

    <CalendarCompactAgenda
      :events="compactEvents"
      @select="selectedEvent = $event"
    />

    <!-- ========== LEGEND CARD (H8 : extraite en sous-composant) ========== -->
    <CalendarLegend />

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
/**
 * Calendrier unifié (séances + évaluations) — orchestrateur (H8 ≤300).
 * La donnée et le chargement vivent dans useCalendarEvents (#28bis) ; l'état de la
 * vue FullCalendar (options, navigation, sync) dans useCalendarView (H8). L'UI est
 * composée de CalendarNavigation, CalendarFilters, CalendarView, CalendarLegend et
 * EventDetailModal. La vue ne garde que le câblage filtres ↔ rôle.
 *
 * Dette pré-existante conservée à l'identique : `router` (useRouter) reste déclaré
 * sans usage (dead var d'origine) ; la règle media `.filters-content` du CSS scoped
 * ne cible plus rien depuis l'extraction de CalendarFilters (#28bis) — conservée.
 */
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import CalendarNavigation from './CalendarNavigation.vue'
import CalendarFilters from './CalendarFilters.vue'
import CalendarView from './CalendarView.vue'
import CalendarCompactAgenda from './CalendarCompactAgenda.vue'
import CalendarLegend from './CalendarLegend.vue'
import EventDetailModal from './EventDetailModal.vue'
// #28bis : données + chargement extraits dans le composable (couleurs/urgence/bornes
// pures dans @/utils/calendar, testées dans tests/unit/calendar.test.js)
import { useCalendarEvents } from '@/composables/useCalendarEvents'
// H8 : état de la vue (options FullCalendar, navigation, sync impérative)
import { useCalendarView } from '@/composables/useCalendarView'

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
const calendarViewRef = ref(null)
const selectedEvent = ref(null)

// Filtres
const eventTypeFilter = ref('all')
const dateRangePreset = ref('30days')
const selectedMatiere = ref('')
const selectedClasse = ref('')
const selectedEnseignant = ref('')

// Données + chargement délégués au composable (#28bis : script < 300)
const { events, matieres, classes, enseignants, loading, refreshing, error, loadEvents, refreshData } = useCalendarEvents({
  getUserRole: () => props.userRole,
  getUserId: () => props.userId,
  eventTypeFilter,
  dateRangePreset
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

// État de la vue FullCalendar (options, navigation, sync) délégué au composable (H8)
const { currentView, currentDate, currentMonthLabel, calendarOptions, changeView, previousMonth, nextMonth, goToToday } = useCalendarView({
  calendarRef: calendarViewRef,
  filteredEvents,
  onEventClick: (event) => { selectedEvent.value = event }
})

const compactEvents = computed(() => {
  const start = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth(), 1)
  const end = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)

  return filteredEvents.value.filter((event) => {
    const timestamp = new Date(event.start).getTime()
    return !Number.isNaN(timestamp) && timestamp >= start.getTime() && timestamp < end.getTime()
  })
})

// Charger les données
function applyDateRangePreset() {
  loadEvents()
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

// Exposer les methodes pour le parent (force le bypass cache KLASSCI des 2 sources)
async function refreshEvents() {
  await refreshData()
}

defineExpose({
  refreshEvents
})
</script>

<style lang="scss" scoped>
.calendar-container {
  padding: 2rem;
  max-width: 1600px;
  margin: 0 auto;
}

// #238 : bannière d'erreur (état distinct d'un agenda vide)
.calendar-error {
  margin-bottom: 1rem;
  padding: 0.75rem 1rem;
  background: var(--error-bg);
  color: var(--red-600);
  border-radius: 0.5rem;
  font-weight: 600;
}

// ========== RESPONSIVE ==========
@media (max-width: 768px) {
  .calendar-container {
    padding: 1rem;
  }

  // Dette pré-existante : depuis l'extraction de CalendarFilters (#28bis), ce bloc
  // scoped ne cible plus le DOM de l'enfant (`.filters-content` vit dans CalendarFilters).
  // Conservé verbatim, sans correction.
  .filters-content {
    grid-template-columns: 1fr !important;

    .filter-count {
      justify-self: stretch;
      justify-content: center;
    }
  }
}

@media (max-width: 520px) {
  .calendar-container {
    padding: 0.75rem;
  }

  .desktop-calendar-surface {
    display: none;
  }
}
</style>

<!-- Styles mode sombre non-scoped (coque + filtres) — relocalisés dans un partial -->
<style lang="scss">
@use '../../assets/styles/calendar-shell-dark';
</style>
