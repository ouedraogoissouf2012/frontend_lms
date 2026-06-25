import { ref, reactive, computed, onMounted } from 'vue'
import { useVisioParticipation } from '@/composables/useVisioParticipation'
import { lmsService } from '@/services/lms'
import { klassciService } from '@/services/klassci'
import { useAuthStore } from '@/stores/auth'
import { toast } from '@/services/toast'
import { normalizeError } from '@/services/errorHandler'
import { readCache, writeCache, clearCache } from '@/services/cache'
import { buildJitsiUrl } from '@/constants/visio'
// #28 : logique métier pure extraite (testée dans tests/unit/seances.test.js)
import { filterSeances, computeSeancesStats } from '@/utils/seances'

/**
 * Couche données/logique de la vue TeacherSeances (#H6 ≤300).
 *
 * Extraite VERBATIM du `<script setup>` d'origine : chargement séances/matières
 * (cache `teacher_seances` / `teacher_matieres` + rafraîchissement en arrière-
 * plan), filtres, statistiques (logique pure #28) et actions visio
 * (activer/démarrer/désactiver/rejoindre/terminer). Logs, clés de cache,
 * confirmations et appels services strictement identiques.
 */
export function useTeacherSeances() {
  const seances = ref([])
  const matieres = ref([])
  const loading = ref(true)
  const error = ref(null)
  const actionLoading = ref(null)

  // État de la modal Jitsi
  // visioParticipation sera créé dynamiquement pour chaque séance
  const visioParticipations = reactive({})

  // Get current user (#19 : via store, plus de localStorage('user'))
  const currentUser = useAuthStore().currentUser
  const isEnseignant = currentUser?.role === 'enseignant'

  // Filters
  const filters = reactive({
    matiere_id: '',
    visio_status: '',
    period: 'all'
  })

  // Computeds délégués à la logique pure extraite (#28)
  const filteredSeances = computed(() => filterSeances(seances.value, filters))

  const stats = computed(() => computeSeancesStats(seances.value))

  // Load seances with cache
  async function loadSeances() {
    // Check cache first
    const cachedData = readCache('teacher_seances')
    if (cachedData !== null) {
      console.log('[CACHE] Utilisation du cache séances')
      seances.value = cachedData
      loading.value = false
      // Refresh in background
      refreshInBackground()
      return
    }

    // Load from API
    loading.value = true
    error.value = null

    try {
      console.log('[API] Chargement séances enseignant...')
      const response = await lmsService.getMyTeachingSeances()

      console.log('[API] Réponse séances:', response)
      seances.value = response.data || []

      // Save to cache
      writeCache('teacher_seances', seances.value)

      console.log(`[SUCCESS] ${seances.value.length} séance(s) chargée(s)`)
    } catch (err) {
      console.error('[ERREUR] Chargement séances:', err)
      error.value = 'Impossible de charger les séances. Veuillez réessayer.'
    } finally {
      loading.value = false
    }
  }

  // Refresh in background
  async function refreshInBackground() {
    try {
      console.log('[BACKGROUND] Rafraîchissement des séances...')
      const response = await lmsService.getMyTeachingSeances()
      seances.value = response.data || []

      writeCache('teacher_seances', seances.value)

      console.log('[BACKGROUND] Séances rafraîchies')
    } catch (err) {
      console.warn('[BACKGROUND] Erreur rafraîchissement:', err)
    }
  }

  // Load matières with cache
  async function loadMatieres() {
    const cachedData = readCache('teacher_matieres')
    if (cachedData !== null) {
      console.log('[CACHE] Utilisation du cache matières')
      matieres.value = cachedData
      return
    }

    try {
      console.log('[API] Chargement matières...')
      const dashboardData = await klassciService.getTeacherDashboard()
      matieres.value = dashboardData.matieres || []

      writeCache('teacher_matieres', matieres.value)

      console.log('[SUCCESS] Matières chargées')
    } catch (err) {
      console.error('[ERREUR] Chargement matières:', err)
    }
  }

  // Apply filters
  function applyFilters() {
    console.log('[FILTERS] Filtres appliqués:', filters)
  }

  // Reset filters
  function resetFilters() {
    filters.matiere_id = ''
    filters.visio_status = ''
    filters.period = 'all'
    console.log('[FILTERS] Filtres réinitialisés')
  }

  // Visio actions
  async function handleActivateVisio(seance) {
    if (actionLoading.value) return

    actionLoading.value = seance.id

    try {
      console.log('[VISIO] Activation visio pour séance:', seance.id)
      const response = await lmsService.activateVisio(seance.id)

      console.log('[VISIO] Visio activée:', response)

      // Invalidate cache and reload
      clearCache('teacher_seances')
      await loadSeances()
    } catch (err) {
      console.error('[ERREUR] Activation visio:', err)
      error.value = 'Erreur lors de l\'activation de la visio'
    } finally {
      actionLoading.value = null
    }
  }

  async function handleDeactivateVisio(seance) {
    if (actionLoading.value) return

    if (!confirm('Voulez-vous vraiment désactiver la visioconférence ?')) {
      return
    }

    actionLoading.value = seance.id

    try {
      console.log('[VISIO] Désactivation visio pour séance:', seance.id)
      const response = await lmsService.deactivateVisio(seance.id)

      console.log('[VISIO] Visio désactivée:', response)

      // Invalidate cache and reload
      clearCache('teacher_seances')
      await loadSeances()
    } catch (err) {
      console.error('[ERREUR] Désactivation visio:', err)
      error.value = 'Erreur lors de la désactivation de la visio'
    } finally {
      actionLoading.value = null
    }
  }

  async function handleStartVisio(seance) {
    if (actionLoading.value) return

    actionLoading.value = seance.id

    try {
      console.log('[VISIO] Démarrage visio pour séance:', seance.id)
      const response = await lmsService.startVisio(seance.id)

      console.log('[VISIO] Visio démarrée:', response)

      // Invalidate cache and reload
      clearCache('teacher_seances')
      await loadSeances()
    } catch (err) {
      console.error('[ERREUR] Démarrage visio:', err)
      error.value = 'Erreur lors du démarrage de la visio'
    } finally {
      actionLoading.value = null
    }
  }

  async function handleJoinVisio(seance) {
    try {
      console.log('[VISIO] Rejoindre visio:', seance.id)

      // Créer le composable pour cette séance si pas déjà créé
      if (!visioParticipations[seance.id]) {
        visioParticipations[seance.id] = useVisioParticipation(seance.id)
      }

      // Ouvrir window.open avec tracking
      const roomId = seance.visio.room_id
      const jitsiLink = buildJitsiUrl(roomId)

      await visioParticipations[seance.id].joinVisio(jitsiLink)

      console.log('[VISIO] Visio rejointe avec window.open + tracking Web Worker')

      // Rafraîchir les séances pour mettre à jour le compteur de participants
      clearCache('teacher_seances')
      loadSeances()
    } catch (error) {
      console.error('[ERREUR] Join visio:', error)
      toast.error(error.userMessage ?? normalizeError(error).userMessage)
    }
  }

  async function handleEndVisio(seance) {
    if (actionLoading.value) return

    if (!confirm('Voulez-vous vraiment terminer cette visioconférence ?')) {
      return
    }

    actionLoading.value = seance.id

    try {
      console.log('[VISIO] Fin visio pour séance:', seance.id)
      const response = await lmsService.endVisio(seance.id)

      console.log('[VISIO] Visio terminée:', response)

      // Invalidate cache and reload
      clearCache('teacher_seances')
      await loadSeances()
    } catch (err) {
      console.error('[ERREUR] Fin visio:', err)
      error.value = 'Erreur lors de la terminaison de la visio'
    } finally {
      actionLoading.value = null
    }
  }

  // formatDate/formatTime : déplacés dans SeanceCard (#28).

  onMounted(() => {
    loadMatieres()
    loadSeances()
  })

  return {
    seances, matieres, loading, error, actionLoading, isEnseignant,
    filters, filteredSeances, stats,
    loadSeances, applyFilters, resetFilters,
    handleActivateVisio, handleDeactivateVisio, handleStartVisio,
    handleJoinVisio, handleEndVisio,
  }
}
