import { ref, computed, onMounted } from 'vue'
import { lmsService } from '@/services/lms'
import { readCache, writeCache, clearCache } from '@/services/cache'
import { useTrackedVisioJoin } from '@/composables/useTrackedVisioJoin'
import { confirmVisioAction } from '@/services/visioFeedback'

function parseLocalDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null

  const [year, month, day] = String(dateStr).split('T')[0].split('-').map(Number)
  const [hour = 0, minute = 0, second = 0] = String(timeStr).split(':').map(Number)
  if ([year, month, day, hour, minute, second].some(Number.isNaN)) return null

  return new Date(year, month - 1, day, hour, minute, second)
}

function getSeanceTimeWindow(programmation) {
  const startDate = parseLocalDateTime(programmation?.date, programmation?.heure_debut)
  const endDate = parseLocalDateTime(programmation?.date, programmation?.heure_fin)
  if (!startDate || !endDate) return null

  if (endDate < startDate) {
    endDate.setDate(endDate.getDate() + 1)
  }

  return { startDate, endDate }
}

/**
 * Couche données de TeacherVisioList (#G1 ≤300) : charge les séances enseignant
 * (cache + rafraîchissement en arrière-plan), dérive les séances visio en cours /
 * à venir et les statistiques, et expose les handlers d'activation / démarrage /
 * fin de visioconférence. La vue ne fait plus que câbler données et actions.
 */
export function useTeacherVisioList() {
  const seances = ref([])
  const loading = ref(true)
  const error = ref(null)
  const actionLoading = ref(null)
  const { joinTrackedVisio } = useTrackedVisioJoin('Enseignant')

  // Visio en cours
  const visioEnCours = computed(() => {
    return seances.value.filter(s => {
      // Utiliser les champs plats au lieu de l'objet imbriqué
      if (!s.visio_enabled || !s.visio_active) return false

      const now = new Date()
      const window = getSeanceTimeWindow(s.programmation)
      if (!window) return false

      return now >= window.startDate && now <= window.endDate
    })
  })

  // Visio à venir
  const visioAVenir = computed(() => {
    return seances.value.filter(s => {
      // Utiliser les champs plats : afficher si visio_enabled est true
      // Exclure si terminée (visio_status === 'terminee')
      if (!s.visio_enabled || s.visio_status === 'terminee') return false
      if (visioEnCours.value.includes(s)) return false

      const now = new Date()
      const startDate = parseLocalDateTime(
        s.programmation?.date,
        s.programmation?.heure_debut
      )
      if (!startDate) return false

      return startDate > now
    })
  })

  // Statistics
  const stats = computed(() => {
    const allVisio = seances.value.filter(s => s.visio_enabled)
    return {
      total: allVisio.length,
      enCours: visioEnCours.value.length,
      aVenir: visioAVenir.value.length,
      terminees: allVisio.filter(s => s.visio_status === 'terminee').length
    }
  })

  // Load visio conferences with cache
  async function loadVisioConferences() {
    // Check cache first
    const cachedData = readCache('teacher_visio')
    if (cachedData !== null) {
      console.log('[CACHE] Utilisation du cache visio')
      seances.value = cachedData
      loading.value = false
      refreshInBackground()
      return
    }

    loading.value = true
    error.value = null

    try {
      console.log('[API] Chargement des visioconférences...')
      const response = await lmsService.getMyTeachingSeances()

      seances.value = response.data || []

      // Save to cache
      writeCache('teacher_visio', seances.value)

      console.log(`[SUCCESS] ${seances.value.length} séance(s) chargée(s)`)
      console.log(`[INFO] ${stats.value.total} avec visio activée`)
    } catch (err) {
      console.error('[ERREUR] Erreur chargement visioconférences:', err)
      error.value = 'Impossible de charger les visioconférences. Veuillez réessayer.'
    } finally {
      loading.value = false
    }
  }

  // Refresh in background
  async function refreshInBackground() {
    try {
      console.log('[BACKGROUND] Rafraîchissement visio...')
      const response = await lmsService.getMyTeachingSeances()
      seances.value = response.data || []

      writeCache('teacher_visio', seances.value)

      console.log('[BACKGROUND] Visio rafraîchies')
    } catch (err) {
      console.warn('[BACKGROUND] Erreur rafraîchissement:', err)
    }
  }

  // Visio actions
  async function handleActivateVisio(seance) {
    if (actionLoading.value) return

    actionLoading.value = seance.id

    try {
      console.log('[VISIO] Activation visio:', seance.id)
      await lmsService.activateVisio(seance.id)

      clearCache('teacher_visio')
      await loadVisioConferences()
    } catch (err) {
      console.error('[ERREUR] Activation visio:', err)
      error.value = 'Erreur lors de l\'activation de la visio'
    } finally {
      actionLoading.value = null
    }
  }

  async function handleStartVisio(seance) {
    if (actionLoading.value) return

    actionLoading.value = seance.id

    try {
      console.log('[VISIO] Démarrage visio:', seance.id)
      await lmsService.startVisio(seance.id)

      clearCache('teacher_visio')
      await loadVisioConferences()
    } catch (err) {
      console.error('[ERREUR] Démarrage visio:', err)
      error.value = 'Erreur lors du démarrage de la visio'
    } finally {
      actionLoading.value = null
    }
  }

  async function handleEndVisio(seance) {
    if (actionLoading.value) return

    if (!await confirmVisioAction('Voulez-vous vraiment terminer cette visioconférence ?', {
      confirmLabel: 'Terminer',
      variant: 'danger',
    })) {
      return
    }

    actionLoading.value = seance.id

    try {
      console.log('[VISIO] Fin visio:', seance.id)
      await lmsService.endVisio(seance.id)

      clearCache('teacher_visio')
      await loadVisioConferences()
    } catch (err) {
      console.error('[ERREUR] Fin visio:', err)
      error.value = 'Erreur lors de la terminaison de la visio'
    } finally {
      actionLoading.value = null
    }
  }

  async function handleJoinVisio(seance) {
    if (actionLoading.value) return

    actionLoading.value = seance.id

    try {
      console.log('[VISIO] Rejoindre visio:', seance.id)
      await joinTrackedVisio(seance)
    } catch (err) {
      console.error('[ERREUR] Join visio:', err)
      error.value = err.message || 'Erreur lors de la connexion à la visio'
    } finally {
      actionLoading.value = null
    }
  }

  // Format date
  function formatDate(dateStr) {
    if (!dateStr) return 'N/A'
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  // Format time
  function formatTime(timeStr) {
    if (!timeStr) return 'N/A'
    return timeStr.substring(0, 5) // HH:MM
  }

  onMounted(() => {
    loadVisioConferences()
  })

  return {
    seances, loading, error, actionLoading,
    visioEnCours, visioAVenir, stats,
    loadVisioConferences, refreshInBackground,
    handleActivateVisio, handleStartVisio, handleEndVisio, handleJoinVisio,
    formatDate, formatTime,
  }
}
