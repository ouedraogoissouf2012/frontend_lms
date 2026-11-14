import { ref, computed, onMounted, getCurrentInstance } from 'vue'
import lmsService from '@/services/lms'
import { auth } from '@/services/api'
import { hasRole, ROLES } from '@/constants/roles'
import { messageForReason } from '@/services/errorHandler'
import { estPannePassagere } from '@/utils/pannePassagere'
import { displayMessage } from '@/services/displayMessage'

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
  // Un nouvel essai seulement sur une panne passagère (5xx, 429, réseau) : un refus définitif ne se
  // lève pas en réessayant (lot « retour honnête », 10/11).
  const canRetry = ref(true)
  const activeTab = ref('matieres')
  const classe = ref(null)
  const matieres = ref([])
  const etudiants = ref([])
  const evaluations = ref([])
  const emploiTemps = ref([])
  const seances = ref([])
  const statistiques = ref(null)

  const classeId = computed(() => parseInt(inst.proxy.$route.params.id))

  /**
   * La porte a interroger — le NOM de la route dit dans quel espace on parle.
   *
   * Le repli est l'espace KLASSCI, comportement historique : une route sans nom
   * (les tests montent ce composable avec un `$route` reduit a ses `params`) ou
   * toute autre route continue d'emprunter la porte d'origine. Seule la route
   * explicitement locale bascule.
   */
  const chargerDetails = () => inst.proxy.$route.name === 'classe-details-local'
    ? lmsService.getClasseDetailsLocal(classeId.value)
    : lmsService.getClasseDetails(classeId.value)

  /**
   * L'identifiant a presenter a `/seances/upcoming?classe_id=` et a
   * `/classes/{id}/etudiants` : celui de l'espace de la SOURCE de l'ecole.
   *
   * - Ecole creee depuis KLASSCI : upcoming filtre sur `klassci_classe_id`
   *   (ManagerSeancesLocalFetcher) et les etudiants viennent du systeme
   *   central ; l'espace KLASSCI est attendu, meme quand la page a ete ouverte
   *   par son identifiant LOCAL.
   * - Ecole creee depuis le LMS : upcoming filtre sur `classe_id` local
   *   (LocalSeancesListReader, backend #1026) ; il n'y a qu'un espace.
   *
   * On ne le devine pas, on le LIT : `classe.id` de la charge utile des details
   * est l'identifiant de cette source (ClasseDetailsQueryService chez KLASSCI,
   * LocalClasseDetailsReader en ecole LMS), quelle que soit la porte ouverte.
   *
   * Repli sur l'identifiant d'URL pour la route historique, ou les deux espaces
   * coincident deja par construction.
   */
  const idPourKlassci = () => {
    const depuisLaReponse = classe.value?.id

    return Number.isFinite(Number(depuisLaReponse)) ? Number(depuisLaReponse) : classeId.value
  }

  /**
   * Le roster n'est rendu qu'au personnel (backend, ADR-GHSA-gg7j-01) : pour un
   * élève, `etudiants` arrive VIDE. On ne lui montre donc ni l'onglet ni le
   * compteur — un « 0 étudiant » serait une mesure fausse — et on ne rappelle
   * pas `/lms/classes/{id}/etudiants`, désormais réservé au personnel (403).
   *
   * Même prédicat que le serveur (`isStaff()`), fail-closed : un rôle inconnu
   * est traité comme un élève.
   */
  const rosterVisible = computed(() =>
    hasRole(auth.getUser(), [ROLES.ENSEIGNANT, ROLES.COORDINATEUR, ROLES.ADMIN, ROLES.SUPRADMIN])
  )

  const tabs = computed(() => [
    { id: 'matieres', label: 'Matières', count: matieres.value?.length || 0 },
    ...(rosterVisible.value
      ? [{ id: 'etudiants', label: 'Étudiants', count: etudiants.value?.length || 0 }]
      : []),
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
    canRetry.value = true

    try {
      console.log('[ClasseDetails] Chargement détails classe:', classeId.value)

      // Appel via service LMS enrichi
      const data = await chargerDetails()

      console.log('[ClasseDetails] Données reçues:', data)

      if (data && data.success) {
        classe.value = data.data.classe
        // Les deux sources du serveur (KLASSCI et école LMS) émettent `evaluations_programmees`,
        // et seulement elle : aucune fiche de classe n'émet de clé `evaluations` (D72-b).
        evaluations.value = data.data.evaluations_programmees || []
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
        // Pour un élève, un roster vide est la RÈGLE, pas une absence de donnée :
        // le repli ne le concerne pas (il répondrait 403).
        if (etudiants.value.length === 0 && rosterVisible.value) await loadEtudiants()

        // Charger les séances à venir
        await loadSeances()
      } else {
        // Réponse hors intercepteur : son motif traduit, jamais son `message` (D0).
        error.value = messageForReason(data?.reason) ?? 'Impossible de charger les détails de la classe'
        // Une réponse 2xx sans succès n'est pas une panne passagère.
        canRetry.value = false
      }
    } catch (err) {
      console.error('[ClasseDetails] Erreur chargement classe:', err)
      error.value = displayMessage(err, 'Erreur lors du chargement des données')
      canRetry.value = estPannePassagere(err)
    } finally {
      loading.value = false
    }
  }

  async function loadEtudiants() {
    try {
      const response = await lmsService.getClasseEtudiants(idPourKlassci())
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
      const response = await lmsService.getUpcomingSeances({ classe_id: idPourKlassci(), days: 30 })
      // `/lms/seances/upcoming` rend `{ success, data: [séances], meta }`
      // (LMSSeancesListController::upcomingSeances) : la liste EST `data`.
      // `data.seances` n'existe pas — l'onglet restait toujours vide.
      if (response && response.success) {
        seances.value = asArray(response.data)
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
    loading, error, canRetry, activeTab, classe, matieres, etudiants, evaluations, rosterVisible,
    emploiTemps, seances, statistiques, classeId, tabs, canManageVisio,
    loadClasseDetails, loadSeances, viewMatiere, viewEvaluation, goBack,
  }
}
