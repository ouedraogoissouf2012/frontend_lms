<template>
  <div class="calendar-container">
    <!-- Navigation (mois / vue / actualiser) -->
    <CalendarNavigation
      :current-month-label="currentMonthLabel"
      :current-view="currentView"
      :refreshing="refreshing"
      @prev="grid?.prev()"
      @next="grid?.next()"
      @today="grid?.today()"
      @refresh="refreshData"
      @change-view="onChangeView"
    />

    <!-- Filtres (#28bis) -->
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

    <!-- Grille FullCalendar (#107) -->
    <CalendarGrid
      ref="grid"
      :events="filteredEvents"
      :loading="loading"
      :initial-view="currentView"
      @event-click="selectedEvent = $event"
      @dates-set="currentDate = $event"
      @view-changed="currentView = $event"
    />

    <!-- Légende (#107) -->
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
 * Calendrier unifié — orchestrateur (#107 — fin de décomposition, < 300 lignes).
 *
 * Ce composant ne fait plus que de la composition et de l'état partagé :
 *  - navigation (CalendarNavigation), filtres (CalendarFilters), grille (CalendarGrid),
 *    légende (CalendarLegend) et détails (EventDetailModal) sont des sous-composants ;
 *  - le chargement/rafraîchissement des données est délégué au composable
 *    useCalendarEvents (#28bis) ; les fonctions pures (couleurs/urgence/bornes) vivent
 *    dans @/utils/calendar (testées dans tests/unit/calendar.test.js).
 *
 * Le CSS « chrome » partagé (carte de base + conteneur + mode sombre de base) reste ici
 * et atteint les sous-composants via :deep() / sélecteurs globaux, sans duplication.
 */
import { ref, computed, onMounted, watch } from 'vue'
import EventDetailModal from './EventDetailModal.vue'
import CalendarFilters from './CalendarFilters.vue'
import CalendarNavigation from './CalendarNavigation.vue'
import CalendarGrid from './CalendarGrid.vue'
import CalendarLegend from './CalendarLegend.vue'
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

const grid = ref(null)
const currentView = ref('dayGridMonth')
const currentDate = ref(new Date()) // Pour forcer la réactivité du label
const selectedEvent = ref(null)

// Filtres
const eventTypeFilter = ref('all')
const dateRangePreset = ref('30days')
const selectedMatiere = ref('')
const selectedClasse = ref('')
const selectedEnseignant = ref('')

// Données + chargement délégués au composable (#28bis)
const { events, matieres, classes, enseignants, loading, refreshing, loadEvents, refreshData } = useCalendarEvents({
  getUserRole: () => props.userRole,
  getUserId: () => props.userId,
  eventTypeFilter,
  dateRangePreset
})

// Label du mois courant
const currentMonthLabel = computed(() =>
  currentDate.value.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
)

// Filtres conditionnels selon le rôle
const showMatiereFilter = computed(() => ['teacher', 'admin', 'coordinator'].includes(props.userRole))
const showClasseFilter = computed(() => ['admin', 'coordinator'].includes(props.userRole))
const showEnseignantFilter = computed(() => ['admin', 'coordinator'].includes(props.userRole))

// Événements filtrés (côté client, en plus du filtrage serveur du composable)
const filteredEvents = computed(() => {
  let filtered = events.value

  if (eventTypeFilter.value !== 'all') {
    filtered = filtered.filter(event => event.extendedProps.eventType === eventTypeFilter.value.replace(/s$/, ''))
  }
  if (selectedMatiere.value) {
    filtered = filtered.filter(event => event.extendedProps.matiereId === parseInt(selectedMatiere.value))
  }
  if (selectedClasse.value) {
    filtered = filtered.filter(event => event.extendedProps.classeId === parseInt(selectedClasse.value))
  }
  if (selectedEnseignant.value) {
    filtered = filtered.filter(event => event.extendedProps.enseignantId === parseInt(selectedEnseignant.value))
  }

  return filtered
})

function onChangeView(view) {
  currentView.value = view
  grid.value?.changeView(view)
}

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

// Recharger quand le type d'événement change
watch([eventTypeFilter], () => {
  loadEvents()
})

// Exposer le rafraîchissement au parent (bypass cache KLASSCI des 2 sources)
async function refreshEvents() {
  await refreshData()
}

defineExpose({ refreshEvents })
</script>

<style lang="scss" scoped>
// Sous-ensemble local des variables LMS (couleurs « système » via var(--…) globales).
$white: #ffffff;
$shadow-light: 0 1px 3px rgba(0, 0, 0, 0.1);
$border-radius-lg: 8px;

.calendar-container {
  padding: 2rem;
  max-width: 1600px;
  margin: 0 auto;
}

// ========== CARTE DE BASE (CHROME PARTAGÉ) ==========
// Centralisée ici et atteinte dans chaque sous-composant via :deep(), sans duplication.
:deep(.card) {
  background: var(--card-bg, $white);
  border: 1px solid var(--card-border, transparent);
  border-radius: $border-radius-lg;
  box-shadow: var(--card-shadow, $shadow-light);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  transition: background 0.2s ease, border-color 0.2s ease;
}

@media (max-width: 768px) {
  .calendar-container {
    padding: 1rem;
  }
}
</style>

<!-- Mode sombre de base (chrome partagé) : non-scoped pour cibler html[data-theme="dark"] -->
<style lang="scss">
html[data-theme="dark"] {
  .calendar-container {
    background: transparent;
  }

  // Cartes en mode sombre (base partagée par tous les sous-composants)
  .card {
    background: var(--card-bg) !important;
    border: 1px solid var(--card-border) !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }
}
</style>
