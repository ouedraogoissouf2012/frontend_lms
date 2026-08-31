import { ref, computed, onMounted, getCurrentInstance } from 'vue'
import lmsService from '@/services/lms'
import lessonService from '@/services/lesson'
import { auth } from '@/services/api'
import { useConfirm } from '@/composables/useConfirm'
import { createEmptyLesson, buildLessonPayload, resolveEvaluationRoute } from '@/utils/matiereDetails'
import { hasRole, ROLES } from '@/constants/roles'

/**
 * Couche données/logique de MatiereDetails (#H9 ≤300). Charge le détail matière
 * enrichi, gère les onglets, la modale de création de leçon et les notifications.
 *
 * Parité : la vue reste pilotée par $route/$router (les tests G10 existants, hors
 * lot, les injectent via global.mocks). On les lit donc paresseusement via
 * getCurrentInstance().proxy, jamais pendant setup().
 */
export function useMatiereDetails() {
  const inst = getCurrentInstance()

  const loading = ref(false)
  const error = ref(null)
  const activeTab = ref('lessons')
  const viewMode = ref('grid') // 'grid' ou 'list'
  const matiere = ref(null)
  const lessons = ref([])
  const seances = ref([])
  const evaluations = ref([])
  const classes = ref([])
  const statistiques = ref(null)
  const showCreateLessonModal = ref(false)
  const creatingLesson = ref(false)
  const newLesson = ref(createEmptyLesson())
  const notifications = ref([])

  const matiereId = computed(() => parseInt(inst.proxy.$route.params.id))

  const tabs = computed(() => [
    { id: 'lessons', label: 'Leçons', count: lessons.value?.length || 0 },
    { id: 'seances', label: 'Séances', count: seances.value?.length || 0 },
    { id: 'evaluations', label: 'Évaluations', count: evaluations.value?.length || 0 },
    { id: 'classes', label: 'Classes', count: classes.value?.length || 0 }
  ])

  // Conservé à l'identique (dette pré-existante : non référencé dans le template).
  const canManageVisio = computed(() => {
    const user = lmsService.auth?.getUser?.() || {}
    return hasRole(user, [ROLES.COORDINATEUR, ROLES.ADMIN])
  })

  const isTeacher = computed(() => {
    const user = auth.getUser()
    return hasRole(user, [ROLES.ENSEIGNANT, ROLES.COORDINATEUR])
  })

  async function loadMatiereDetails() {
    loading.value = true
    error.value = null

    try {
      console.log('[MatiereDetails] Chargement détails matière:', matiereId.value)

      // Appel via service LMS enrichi
      const data = await lmsService.getMatiereDetails(matiereId.value)

      console.log('[MatiereDetails] Données reçues (raw):', data)
      console.log('[MatiereDetails] data.success:', data.success)
      console.log('[MatiereDetails] data.data:', data.data)
      console.log('[MatiereDetails] Type de data:', typeof data)

      if (data && data.success) {
        matiere.value = data.data.matiere
        lessons.value = data.data.lessons || []
        seances.value = data.data.seances_programmees || []
        evaluations.value = data.data.evaluations_programmees || []
        classes.value = data.data.classes_concernees || []
        statistiques.value = data.data.statistiques

        console.log('[MatiereDetails] Matière assignée:', matiere.value)
        console.log('[MatiereDetails] Nom de la matière:', matiere.value?.nom)
        console.log('[MatiereDetails] Lessons:', lessons.value.length)
        console.log('[MatiereDetails] Séances:', seances.value.length)
        console.log('[MatiereDetails] Évaluations:', evaluations.value.length)
        console.log('[MatiereDetails] Classes:', classes.value.length)
        console.log('[MatiereDetails] Statistiques:', statistiques.value)
      } else {
        console.error('[MatiereDetails] Response success = false ou undefined')
        console.error('[MatiereDetails] Full response:', JSON.stringify(data, null, 2))
        error.value = data?.message || 'Impossible de charger les détails de la matière'
      }
    } catch (err) {
      console.error('[MatiereDetails] Erreur chargement matière:', err)
      console.error('[MatiereDetails] Error message:', err.message)
      console.error('[MatiereDetails] Error response:', err.response)
      console.error('[MatiereDetails] Error response data:', err.response?.data)
      error.value = err.response?.data?.message || 'Erreur lors du chargement des données'
    } finally {
      loading.value = false
    }
  }

  function viewLesson(lessonId) {
    inst.proxy.$router.push({ name: 'LessonView', params: { id: lessonId } })
  }

  function createLesson() {
    // Ouvrir le modal au lieu de rediriger
    showCreateLessonModal.value = true
    // Réinitialiser le formulaire
    newLesson.value = createEmptyLesson()
  }

  function closeCreateLessonModal() {
    showCreateLessonModal.value = false
    newLesson.value = createEmptyLesson()
  }

  async function submitCreateLesson() {
    // Validation
    if (!newLesson.value.title || newLesson.value.title.trim() === '') {
      showNotification('fa-exclamation-triangle️ Le titre de la leçon est obligatoire', 'warning')
      return
    }

    creatingLesson.value = true

    try {
      const user = auth.getUser()

      // Préparer les données avec contexte automatique (mapping pur extrait)
      const lessonData = buildLessonPayload(newLesson.value, {
        classes: classes.value,
        user,
        matiereId: matiereId.value
      })

      console.log('[MatiereDetails] Création leçon contextuelle:', lessonData)

      const response = await lessonService.createLesson(lessonData)

      if (response.success) {
        closeCreateLessonModal()

        // Rediriger vers interface gestion chapitres
        inst.proxy.$router.push({
          name: 'LessonChapters',
          params: { id: response.data.id }
        })
      }
    } catch (err) {
      console.error('[MatiereDetails] Erreur création leçon:', err)
      showNotification('Erreur lors de la création: ' + (err.response?.data?.message || err.message), 'error')
    } finally {
      creatingLesson.value = false
    }
  }

  function editLesson(lessonId) {
    // Rediriger vers la gestion des chapitres au lieu de l'ancien éditeur
    inst.proxy.$router.push({ name: 'LessonChapters', params: { id: lessonId }, query: { edit: 'true' } })
  }

  async function confirmDeleteLesson(lessonId) {
    if (!(await useConfirm().confirm({ message: 'Êtes-vous sûr de vouloir supprimer cette leçon ?', variant: 'danger', confirmLabel: 'Supprimer' }))) {
      return
    }

    try {
      const response = await lessonService.deleteLesson(lessonId)
      if (response.success) {
        showNotification('fa-check Leçon supprimée avec succès', 'success')
        loadMatiereDetails()
      }
    } catch (err) {
      console.error('[MatiereDetails] Erreur deleteLesson:', err)
      showNotification('Erreur lors de la suppression: ' + (err.response?.data?.message || err.message), 'error')
    }
  }

  async function publishLesson(lessonId) {
    try {
      const response = await lessonService.publishLesson(lessonId)
      if (response.success) {
        showNotification('fa-check Leçon publiée avec succès ! Elle est maintenant visible par les étudiants.', 'success')
        loadMatiereDetails()
      }
    } catch (err) {
      console.error('[MatiereDetails] Erreur publishLesson:', err)
      showNotification('Erreur lors de la publication: ' + (err.response?.data?.message || err.message), 'error')
    }
  }

  async function unpublishLesson(lessonId) {
    try {
      const response = await lessonService.unpublishLesson(lessonId)
      if (response.success) {
        showNotification('fa-check Leçon dépubliée avec succès ! Elle est maintenant en mode brouillon.', 'success')
        loadMatiereDetails()
      }
    } catch (err) {
      console.error('[MatiereDetails] Erreur unpublishLesson:', err)
      showNotification('Erreur lors de la dépublication: ' + (err.response?.data?.message || err.message), 'error')
    }
  }

  // Système de notification toast
  function showNotification(message, type = 'success') {
    const id = Date.now()
    notifications.value.push({ id, message, type })

    // Auto-suppression après 4 secondes
    setTimeout(() => {
      notifications.value = notifications.value.filter(n => n.id !== id)
    }, 4000)
  }

  function viewSeance(seanceId) {
    inst.proxy.$router.push({ name: 'seance-details', params: { id: seanceId } })
  }

  async function hideSeance(seance) {
    try {
      const seanceId = seance.id || seance.klassci_seance_id
      const response = await lmsService.hideSeance(seanceId)

      if (response.success) {
        showNotification('fa-check Séance masquée avec succès', 'success')
        // Recharger les données pour voir la séance disparaître
        await loadMatiereDetails()
      }
    } catch (err) {
      console.error('[MatiereDetails] Erreur masquage séance:', err)
      showNotification('Erreur lors du masquage: ' + (err.response?.data?.message || err.message), 'error')
    }
  }

  function viewEvaluation(evaluation) {
    // Décision de routage déléguée à une fonction pure (testée unitairement).
    const role = auth.getUser()?.role
    const action = resolveEvaluationRoute(evaluation, { role, matiereId: matiereId.value })

    if (action.route) {
      inst.proxy.$router.push(action.route)
    } else {
      showNotification(action.notify.message, action.notify.level)
    }
  }

  function viewClasse(classeId) {
    inst.proxy.$router.push({ name: 'classe-details', params: { id: classeId } })
  }

  onMounted(() => {
    loadMatiereDetails()
  })

  return {
    loading, error, activeTab, viewMode, matiere, lessons, seances, evaluations,
    classes, statistiques, showCreateLessonModal, creatingLesson, newLesson,
    notifications, matiereId, tabs, canManageVisio, isTeacher,
    loadMatiereDetails, viewLesson, createLesson, closeCreateLessonModal,
    submitCreateLesson, editLesson, confirmDeleteLesson, publishLesson,
    unpublishLesson, showNotification, viewSeance, hideSeance, viewEvaluation, viewClasse,
  }
}
