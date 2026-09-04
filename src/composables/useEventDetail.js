import { computed } from 'vue'
import { formatDateWeekday } from '@/utils/formatters'

/**
 * Composable de la modale de détail d'événement (H8 — décomposition
 * EventDetailModal.vue pour ramener le FICHIER ENTIER sous 300 lignes).
 *
 * Centralise les computeds (données, type, titre, statut, capacités selon le rôle),
 * le formatage (date / plage horaire / statut visio) et l'émission d'action. Les
 * sections (séance / évaluation / actions) sont rendues par des sous-composants
 * présentationnels qui reçoivent ces valeurs en props.
 *
 * @param {{ event: Object, userRole: string }} props
 * @param {(event: string, payload?: any) => void} emit
 */
export function useEventDetail(props, emit) {
  const eventData = computed(() => props.event.extendedProps?.data || {})
  const isSeance = computed(() => props.event.extendedProps?.eventType === 'seance')

  const eventTitle = computed(() => {
    return eventData.value.titre || props.event.title || 'Événement'
  })

  const statusClass = computed(() => {
    if (isSeance.value) {
      const visioStatus = eventData.value.visio?.status || eventData.value.visio_status
      if (visioStatus === 'active') return 'status-active'
      if (visioStatus === 'programmee') return 'status-scheduled'
      return 'status-ended'
    } else {
      const status = eventData.value.status
      if (status === 'en_cours') return 'status-active'
      if (status === 'terminee') return 'status-ended'
      return 'status-scheduled'
    }
  })

  const statusLabel = computed(() => {
    if (isSeance.value) {
      const visioStatus = eventData.value.visio?.status || eventData.value.visio_status
      return formatVisioStatus(visioStatus)
    } else {
      const status = eventData.value.status
      if (status === 'en_cours') return 'En cours'
      if (status === 'terminee') return 'Terminée'
      return 'Programmée'
    }
  })

  // Capacités selon le rôle
  const canJoinVisio = computed(() => {
    // Debug log pour comprendre pourquoi le bouton n'apparaît pas
    console.log('[EventDetailModal] canJoinVisio check:', {
      isSeance: isSeance.value,
      userRole: props.userRole,
      visio: eventData.value.visio,
      visioStatus: eventData.value.visio?.status
    })

    if (!isSeance.value) {
      console.log('[EventDetailModal] Pas une séance')
      return false
    }
    if (props.userRole !== 'student') {
      console.log('[EventDetailModal] Pas un étudiant, role =', props.userRole)
      return false
    }

    // Vérifier que la visio existe et est active
    const visio = eventData.value.visio
    if (!visio) {
      console.log('[EventDetailModal] Pas de visio')
      return false
    }

    // L'étudiant peut rejoindre seulement si la visio est en cours (status = 'active')
    const canJoin = visio.status === 'active'
    console.log('[EventDetailModal] canJoin =', canJoin, 'visio.status =', visio.status)
    return canJoin
  })

  const canStartEvaluation = computed(() => {
    if (isSeance.value || props.userRole !== 'student') return false
    const status = eventData.value.status
    return status !== 'terminee' && !eventData.value.student_submission?.note_sur_20
  })

  const canActivateVisio = computed(() => {
    if (!isSeance.value || props.userRole !== 'teacher') return false
    return !(eventData.value.visio?.enabled || eventData.value.visio_enabled)
  })

  const canStartVisio = computed(() => {
    if (!isSeance.value || props.userRole !== 'teacher') return false
    const visioEnabled = eventData.value.visio?.enabled || eventData.value.visio_enabled
    const visioStatus = eventData.value.visio?.status || eventData.value.visio_status
    return visioEnabled && visioStatus !== 'active'
  })

  const canEndVisio = computed(() => {
    if (!isSeance.value || props.userRole !== 'teacher') return false
    const visioStatus = eventData.value.visio?.status || eventData.value.visio_status
    return visioStatus === 'active'
  })

  // #283 : délègue au formatter canonique (repli local conservé).
  function formatDate(dateString) {
    return formatDateWeekday(dateString, { fallback: 'N/A' })
  }

  function formatTimeRange(start, end) {
    if (!start) return 'N/A'
    const startTime = new Date(start).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    const endTime = end ? new Date(end).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''
    return endTime ? `${startTime} - ${endTime}` : startTime
  }

  function formatVisioStatus(status) {
    const statusMap = {
      'active': 'En direct',
      'programmee': 'Programmée',
      'terminee': 'Terminée'
    }
    return statusMap[status] || 'Non défini'
  }

  // Valeurs formatées prêtes pour les sous-composants présentationnels
  const formattedDate = computed(() => formatDate(props.event.start))
  const formattedTimeRange = computed(() => formatTimeRange(props.event.start, props.event.end))
  const visioStatusText = computed(() =>
    formatVisioStatus(eventData.value.visio?.status || eventData.value.visio_status)
  )

  function emitAction(type) {
    emit('action', {
      type,
      data: eventData.value
    })
  }

  return {
    eventData,
    isSeance,
    eventTitle,
    statusClass,
    statusLabel,
    canJoinVisio,
    canStartEvaluation,
    canActivateVisio,
    canStartVisio,
    canEndVisio,
    formattedDate,
    formattedTimeRange,
    visioStatusText,
    emitAction
  }
}
