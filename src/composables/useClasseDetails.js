import { ref, computed, onMounted, getCurrentInstance } from 'vue'
import lmsService from '@/services/lms'
import { auth } from '@/services/api'
import { hasRole, ROLES } from '@/constants/roles'

const asArray = (value) => Array.isArray(value) ? value : []

/**
 * Couche données de ClasseDetails (#H9 ≤300) : charge la classe enrichie
 * (matières KLASSCI, étudiants, séances à venir) et expose les onglets.
 *
 * Note parité : la vue reste pilotée par `$route`/`$router` (les tests G10
 * existants — hors lot — les injectent via `global.mocks`). On les lit donc
 * paresseusement via `getCurrentInstance().proxy`, jamais pendant `setup()`.
 */
export function useClasseDetails() {
  const inst = getCurrentInstance()

  const loading = ref(false)
  const error = ref(null)
  const activeTab = ref('matieres')
  const classe = ref(null)
  const matieres = ref([])
  const etudiants = ref([])
  const evaluations = ref([])
  const emploiTemps = ref([])
  const seances = ref([])
  const statistiques = ref(null)

  const classeId = computed(() => parseInt(inst.proxy.$route.params.id))

  const tabs = computed(() => [
    { id: 'matieres', label: 'Matières', count: matieres.value?.length || 0 },
    { id: 'etudiants', label: 'Étudiants', count: etudiants.value?.length || 0 },
    { id: 'evaluations', label: 'Évaluations', count: evaluations.value?.length || 0 },
    { id: 'planning', label: 'Planning', count: emploiTemps.value?.length || 0 }
  ])

  // Conservé à l'identique (référencé nulle part dans le template — dette pré-existante).
  const canManageVisio = computed(() => {
    const user = auth.getUser()
    return hasRole(user, [ROLES.COORDINATEUR, ROLES.ADMIN])
  })

  async function loadClasseDetails() {
    loading.value = true
    error.value = null

    try {
      console.log('[ClasseDetails] Chargement détails classe:', classeId.value)

      // Appel via service LMS enrichi
      const data = await lmsService.getClasseDetails(classeId.value)

      console.log('[ClasseDetails] Données reçues:', data)

      if (data && data.success) {
        classe.value = data.data.classe
        // `evaluations` est la clé réellement renvoyée ; `evaluations_programmees`
        // reste accepté pour les payloads antérieurs.
        evaluations.value = data.data.evaluations || data.data.evaluations_programmees || []
        emploiTemps.value = data.data.emploi_temps_semaine || []
        matieres.value = asArray(data.data.matieres_disponibles || data.data.matieres || classe.value?.matieres)
        statistiques.value = data.data.statistiques

        console.log('[ClasseDetails] Classe:', classe.value)
        console.log('[ClasseDetails] Matières:', matieres.value.length)
        console.log('[ClasseDetails] Évaluations:', evaluations.value.length)

        // Le roster est DÉJÀ dans la réponse de détails : KLASSCI le livre avec la
        // classe. L'appel séparé vers /lms/classes/{id}/etudiants n'est qu'un repli,
        // car cet endpoint est soumis à une autorisation PAR CLASSE et répond 403 —
        // c'est lui qui faisait afficher « 0 étudiant » sur des classes peuplées.
        etudiants.value = asArray(data.data.etudiants)
        if (etudiants.value.length === 0) await loadEtudiants()

        // Charger les séances à venir
        await loadSeances()
      } else {
        error.value = data?.message || 'Impossible de charger les détails de la classe'
      }
    } catch (err) {
      console.error('[ClasseDetails] Erreur chargement classe:', err)
      error.value = err.response?.data?.message || 'Erreur lors du chargement des données'
    } finally {
      loading.value = false
    }
  }

  async function loadEtudiants() {
    try {
      const response = await lmsService.getClasseEtudiants(classeId.value)
      if (response && response.success) {
        etudiants.value = response.data.etudiants || []
        console.log('[ClasseDetails] Étudiants:', etudiants.value.length)
      }
    } catch (err) {
      console.error('[ClasseDetails] Erreur chargement étudiants:', err)
    }
  }

  async function loadSeances() {
    try {
      const response = await lmsService.getUpcomingSeances({ classe_id: classeId.value, days: 30 })
      if (response && response.success) {
        seances.value = response.data.seances || []
        console.log('[ClasseDetails] Séances à venir:', seances.value.length)
      }
    } catch (err) {
      console.error('[ClasseDetails] Erreur chargement séances:', err)
    }
  }

  function viewMatiere(matiereId) {
    inst.proxy.$router.push({ name: 'matiere-details', params: { id: matiereId } })
  }

  function viewEvaluation(evaluationId) {
    inst.proxy.$router.push({ name: 'AdminEvaluationDetails', params: { id: evaluationId } })
  }

  function goBack() {
    inst.proxy.$router.back()
  }

  onMounted(() => {
    loadClasseDetails()
  })

  return {
    loading, error, activeTab, classe, matieres, etudiants, evaluations,
    emploiTemps, seances, statistiques, classeId, tabs, canManageVisio,
    loadClasseDetails, loadSeances, viewMatiere, viewEvaluation, goBack,
  }
}
