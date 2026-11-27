import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
// #628 : FullCalendar 7, un seul paquet ; les plugins et la locale viennent de ses sous-chemins.
import dayGridPlugin from '@fullcalendar/vue3/daygrid'
import timeGridPlugin from '@fullcalendar/vue3/timegrid'
import interactionPlugin from '@fullcalendar/vue3/interaction'
import classicThemePlugin from '@fullcalendar/vue3/themes/classic'
import frLocale from '@fullcalendar/vue3/locales/fr'
// v7 n'injecte plus son CSS : le squelette et le thème classic, chargés avec ce composable (à la demande).
// La PALETTE du thème n'est pas importée : ses couleurs viennent de nos jetons (_calendar-fc-tokens.scss).
import '@fullcalendar/vue3/skeleton.css'
import '@fullcalendar/vue3/themes/classic/theme.css'
import { LIGNE_MAINTENANT, classeDeCellule, classeDuNumero } from '@/utils/fullcalendarClasses'

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
    plugins: [classicThemePlugin, dayGridPlugin, timeGridPlugin, interactionPlugin],
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
    // #628 : `slotLabelFormat` (v6) s'appelle `slotHeaderFormat` en v7 ; l'ancien nom serait ignoré en silence.
    slotHeaderFormat: {
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
    // #628 : `eventClassNames` (v6) s'appelle `eventClass` en v7 ; nos classes d'événement restent les mêmes.
    eventClass: (arg) => {
      const classes = ['event-item']
      if (arg.event.extendedProps.type) {
        classes.push(`event-${arg.event.extendedProps.type}`)
      }
      // v7 n'accepte qu'une CHAÎNE : un tableau serait refusé (aucune classe, donc aucune couleur d'événement).
      return classes.join(' ')
    },
    // #628 : crochets stables de v7, à la place des sélecteurs `.fc-*` de v6 (fullcalendarClasses.js).
    // #628 : une séance d'un jour avec heure reste une BARRE, comme en v6 (v7 la dessinerait en point en vue mois).
    eventDisplay: 'block',
    dayHeaderClass: 'lms-entete-widget',
    dayHeaderInnerClass: 'lms-entete-widget-texte',
    dayCellClass: classeDeCellule,
    dayCellTopClass: 'lms-haut-centre',
    dayCellTopInnerClass: classeDuNumero,
    nowIndicatorLineClass: LIGNE_MAINTENANT,
    toolbarTitleClass: 'lms-titre-widget',
    buttonClass: 'lms-bouton-widget'
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
