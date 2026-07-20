import { ref, computed, watch } from 'vue'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import frLocale from '@fullcalendar/core/locales/fr'

/**
 * Couche « vue » du calendrier unifié (H8 — décomposition UniversalCalendar.vue
 * sous 300 lignes). Encapsule l'état de la vue FullCalendar (type de vue + mois
 * courant), la configuration `calendarOptions`, les actions de navigation
 * (mois précédent/suivant, aujourd'hui, changement de vue, clic sur une date) et
 * la synchronisation impérative des événements filtrés avec l'API FullCalendar.
 *
 * Le chargement des données vit dans `useCalendarEvents` (#28bis) ; ce composable
 * ne fait que piloter l'affichage. L'orchestrateur reste un simple câblage.
 *
 * @param {Object} ctx
 * @param {import('vue').Ref} ctx.calendarRef  ref vers <CalendarView> (expose getApi())
 * @param {import('vue').ComputedRef<Array>} ctx.filteredEvents  événements à afficher
 * @param {(event: Object) => void} ctx.onEventClick  callback de clic sur un événement
 */
export function useCalendarView({ calendarRef, filteredEvents, onEventClick }) {
  const currentView = ref('dayGridMonth')
  const currentDate = ref(new Date()) // Pour forcer la réactivité du label

  // Computed - Label mois courant
  const currentMonthLabel = computed(() => {
    return currentDate.value.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  })

  function handleEventClick(info) {
    onEventClick(info.event)
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

  return {
    currentView,
    currentDate,
    currentMonthLabel,
    calendarOptions,
    changeView,
    previousMonth,
    nextMonth,
    goToToday
  }
}
