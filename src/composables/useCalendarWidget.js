import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import frLocale from '@fullcalendar/core/locales/fr'

/**
 * Composable du widget calendrier (H8 — décomposition CalendarWidget.vue pour
 * ramener le FICHIER ENTIER sous 300 lignes).
 *
 * Encapsule l'état (vue courante, événement sélectionné, ref FullCalendar), la
 * configuration FullCalendar et les handlers (changement de vue, clics, navigation).
 * Le rendu de la modale de détail et de la légende est délégué à des sous-composants
 * présentationnels (CalendarEventModal / CalendarWidgetLegend).
 *
 * @param {{ events: Array, height: string }} props
 * @param {(event: string, payload?: any) => void} emit
 */
export function useCalendarWidget(props, emit) {
  const router = useRouter()
  const calendarRef = ref(null)
  const currentView = ref('dayGridMonth')
  const selectedEvent = ref(null)

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

  function goToEvent() {
    if (selectedEvent.value?.extendedProps?.url) {
      router.push(selectedEvent.value.extendedProps.url)
      closeEventModal()
    }
  }

  onMounted(() => {
    console.log('CalendarWidget mounted avec', props.events.length, 'événements')
  })

  return {
    calendarRef,
    currentView,
    selectedEvent,
    calendarOptions,
    changeView,
    handleEventClick,
    handleDateClick,
    closeEventModal,
    goToEvent
  }
}
