import { ref, computed, onMounted, watch } from 'vue'
import klassciService from '@/services/klassci'
import { readCache, writeCache, invalidateEntity } from '@/services/cache'
import { logError } from '@/services/errorHandler'
import { mapWithConcurrency } from '@/utils/concurrency'

const PAGE_SIZE = 25

// Plafond de requêtes simultanées vers /proxy/classes/{id}/etudiants. Borné à
// dessein : le backend proxifie KLASSCI derrière un quota (`x-ratelimit-limit`),
// un fan-out non borné le ferait tomber en 429 sur un gros établissement.
const CLASSES_FETCH_CONCURRENCY = 4

/**
 * Couche données d'AdminUsers (#G1 ≤300) : agrège étudiants + enseignants KLASSCI
 * en une liste unifiée, gère filtres (rôle/classe/recherche), tri et pagination,
 * avec cache + rafraîchissement en arrière-plan. La vue ne fait plus que câbler.
 */
export function useAdminUsers() {
  // Données
  const etudiants = ref([])
  const enseignants = ref([])
  const classes = ref([])
  const loading = ref(true)
  const loadingProgress = ref('')
  const error = ref(null)
  // Échec PARTIEL : quelques classes n'ont pas répondu. Distinct de `error`, qui
  // remplace tout l'écran ; ici la liste obtenue reste affichée et utile, mais
  // l'utilisateur doit savoir qu'elle est incomplète.
  const partialWarning = ref(null)
  const selectedUser = ref(null)

  // Filtres / tri / pagination
  const searchQuery = ref('')
  const filterRole = ref('all')
  const filterClasse = ref('all')
  const currentPage = ref(1)
  const sortField = ref('name')
  const sortAsc = ref(true)

  watch([searchQuery, filterRole, filterClasse], () => { currentPage.value = 1 })

  // Liste unifiée étudiants + enseignants
  const allUsers = computed(() => {
    const users = []
    etudiants.value.forEach(e => {
      users.push({
        _uid: `etu-${e.id}`, klassci_id: e.id,
        name: e.name || e.nom || `${e.prenom || ''} ${e.nom || ''}`.trim(),
        email: e.email, role: 'etudiant',
        classe_id: e.classe_id, classe_nom: e.classe_nom,
        matricule: e.matricule, telephone: e.telephone,
      })
    })
    enseignants.value.forEach(e => {
      users.push({
        _uid: `ens-${e.id || e.teacher_id}`, klassci_id: e.id || e.teacher_id,
        name: e.nom || e.name || `${e.prenom || ''} ${e.nom || ''}`.trim(),
        email: e.email, role: 'enseignant',
        classe_id: null, classe_nom: null,
        matricule: e.matricule, telephone: e.telephone, specialization: e.specialization,
      })
    })
    return users
  })

  const totalUsers = computed(() => allUsers.value.length)

  const filteredUsers = computed(() => {
    let result = allUsers.value
    if (filterRole.value !== 'all') result = result.filter(u => u.role === filterRole.value)
    if (filterClasse.value !== 'all') result = result.filter(u => u.classe_id === filterClasse.value)
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim()
      result = result.filter(u =>
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)))
    }
    result.sort((a, b) => {
      const valA = (a[sortField.value] || '').toString().toLowerCase()
      const valB = (b[sortField.value] || '').toString().toLowerCase()
      const cmp = valA.localeCompare(valB)
      return sortAsc.value ? cmp : -cmp
    })
    return result
  })

  const totalPages = computed(() => Math.max(1, Math.ceil(filteredUsers.value.length / PAGE_SIZE)))
  const paginatedUsers = computed(() => {
    const start = (currentPage.value - 1) * PAGE_SIZE
    return filteredUsers.value.slice(start, start + PAGE_SIZE)
  })

  function sortBy(field) {
    if (sortField.value === field) sortAsc.value = !sortAsc.value
    else { sortField.value = field; sortAsc.value = true }
  }
  const selectUser = (user) => { selectedUser.value = user }
  const closeModal = () => { selectedUser.value = null }

  // Récupère classes + enseignants + étudiants (par classe) depuis KLASSCI
  async function fetchAll(onProgress) {
    const classesData = await klassciService.getClasses()
    classes.value = Array.isArray(classesData) ? classesData : []
    const enseignantsData = await klassciService.getEnseignants()
    enseignants.value = Array.isArray(enseignantsData) ? enseignantsData : []
    // Les étudiants ne sont exposés par KLASSCI que classe par classe : le N+1 est
    // imposé par l'API amont. On le borne en parallèle au lieu de le sérialiser
    // (17 classes = 17 RTT en file avant ce correctif). DETTE TRACÉE : la vraie
    // correction est un endpoint d'agrégation côté backend — le front ne peut pas
    // ramener ce coût sous O(nb_classes) à lui seul.
    const classeList = classes.value
    let done = 0
    const settled = await mapWithConcurrency(classeList, CLASSES_FETCH_CONCURRENCY, async (classe) => {
      const etudiantsData = await klassciService.getClasseEtudiants(classe.id)
      onProgress?.(`Chargement des étudiants… ${++done}/${classeList.length} classes`)
      return etudiantsData
    })

    const allEtudiants = []
    let failed = 0
    settled.forEach((outcome, i) => {
      const classe = classeList[i]
      if (outcome.status === 'rejected') {
        failed++
        // logError (prod-safe) et non console.warn : les console.* sont neutralisés
        // en production (main.js), l'échec ne laissait donc AUCUNE trace en prod.
        logError(outcome.reason, `[useAdminUsers] étudiants de la classe ${classe?.id}`)
        return
      }
      const arr = Array.isArray(outcome.value) ? outcome.value : []
      arr.forEach(etu => {
        etu.classe_id = classe.id
        etu.classe_nom = classe.name || classe.libelle || classe.nom || `Classe ${classe.id}`
        allEtudiants.push(etu)
      })
    })

    // Échec TOTAL : on refuse de présenter une liste vide comme la vérité. Sans
    // cette levée, une panne complète s'affichait « 0 étudiant » — un admin en
    // concluait que son établissement n'a aucun élève.
    if (classeList.length > 0 && failed === classeList.length) {
      throw new Error(
        `Impossible de charger les étudiants : aucune des ${classeList.length} classes n'a répondu. `
        + 'Réessayez dans quelques instants.'
      )
    }

    etudiants.value = allEtudiants
    partialWarning.value = failed > 0
      ? `${failed} classe(s) sur ${classeList.length} n'ont pas pu être chargées : la liste des étudiants est incomplète.`
      : null
    writeCache('admin_users', { etudiants: etudiants.value, enseignants: enseignants.value, classes: classes.value })
  }

  async function loadAllUsers(forceReload = false) {
    try {
      loading.value = true; error.value = null; partialWarning.value = null; loadingProgress.value = ''
      if (forceReload) {
        // #237 : le force-reload re-fetche classes + enseignants (+ étudiants) ;
        // on invalide leurs clés sœurs pour que les vues admin/coordinateur/
        // enseignant ne servent plus une version périmée.
        invalidateEntity('classes')
        invalidateEntity('enseignants')
      }
      if (!forceReload) {
        const cached = readCache('admin_users')
        if (cached && cached.etudiants?.length > 0) {
          etudiants.value = cached.etudiants
          enseignants.value = cached.enseignants || []
          classes.value = cached.classes || []
          loading.value = false
          // Rafraîchissement en arrière-plan : on garde la donnée en cache affichée
          // (pas d'écran d'erreur pour une revalidation), mais on TRACE l'échec au
          // lieu de l'avaler, et on signale que l'affichage peut être périmé.
          fetchAll().catch((err) => {
            logError(err, '[useAdminUsers] revalidation en arrière-plan')
            partialWarning.value = 'Actualisation impossible : les données affichées peuvent être périmées.'
          })
          return
        }
      }
      loadingProgress.value = 'Chargement des données...'
      await fetchAll((p) => { loadingProgress.value = p })
      loading.value = false; loadingProgress.value = ''
    } catch (err) {
      logError(err, '[useAdminUsers] chargement')
      // `userMessage` vient de l'intercepteur axios (message SÛR, sans détail
      // technique) ; `err.message` couvre les erreurs levées ici même.
      error.value = err.userMessage || err.message || 'Erreur lors du chargement des utilisateurs'
      loading.value = false; loadingProgress.value = ''
    }
  }

  onMounted(() => { loadAllUsers() })

  return {
    etudiants, enseignants, classes, loading, loadingProgress, error, partialWarning, selectedUser,
    searchQuery, filterRole, filterClasse, currentPage, sortField, sortAsc,
    totalUsers, filteredUsers, totalPages, paginatedUsers,
    sortBy, selectUser, closeModal, loadAllUsers,
  }
}
