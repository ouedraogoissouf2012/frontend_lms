import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import klassciService from '@/services/klassci'
import { readCache, writeCache, invalidateEntity } from '@/services/cache'
import { logError } from '@/services/errorHandler'
import { fetchClassRosters } from '@/services/klassciRoster'
import { deriveInstitutionCounters } from '@/utils/classStats'
import { getFullName } from '@/utils/formatters'
import { ROLES } from '@/constants/roles'
import { lmsTeachersService } from '@/services/lmsTeachers'
import { getEnseignantClassesLabel, getEnseignantUniqueClasses } from '@/utils/enseignants'

const PAGE_SIZE = 25

/** Aucune ressource mesurée — état initial et repli d'échec. */
const noCounts = () => ({ classes: null, enseignants: null, etudiants: null, classesOk: null })

/**
 * Compteurs décrivant un jeu restauré depuis le cache.
 *
 * Ce qui est AFFICHÉ est, par définition, mesuré : annoncer « — » en montrant la
 * liste correspondante serait incohérent. Les entrées écrites avant l'introduction
 * de `counts` n'en portent pas — on les dérive donc du contenu restauré. Les
 * étudiants font exception : un tableau vide ne distingue pas « aucun » de
 * « jamais chargés », et `classesOk` reste `null` tant que la revalidation n'a
 * pas mesuré ce chargement (sinon on accuserait la liste d'être incomplète sans
 * rien en savoir).
 */
const countsFromCache = (cached) => cached.counts ?? {
  classes: cached.classes?.length ?? null,
  enseignants: cached.enseignants?.length ?? null,
  etudiants: cached.etudiants?.length ? cached.etudiants.length : null,
  classesOk: null,
}

/**
 * Couche données d'AdminUsers (#G1 ≤300) : agrège étudiants + enseignants KLASSCI
 * en une liste unifiée, gère filtres (rôle/classe/recherche), tri et pagination,
 * avec cache + rafraîchissement en arrière-plan. La vue ne fait plus que câbler.
 *
 * Sémantique d'échec : chaque ressource est MESURÉE séparément dans `counts`
 * (`null` = non mesuré, jamais un 0 fabriqué) ; les avertissements en sont DÉRIVÉS
 * (`notices`). Plus d'arbitrage « quel échec tue la page ? » : un échec total des
 * étudiants n'est qu'un échec partiel à zéro classe, les enseignants déjà obtenus
 * restent affichés. Remplace l'ancien `error`/`partialWarning` où une exception
 * faisait disparaître tout l'écran alors que les compteurs affichaient des valeurs.
 */
export function useAdminUsers() {
  // Données
  const etudiants = ref([])
  const enseignants = ref([])
  const classes = ref([])
  const loading = ref(true)
  const loadingProgress = ref('')
  const counts = ref(noCounts())
  // Le listing nominatif est refusé à ce compte par KLASSCI (403). Distinct d'un
  // échec de chargement : il ne sert à rien de proposer « Réessayer ».
  const rosterForbidden = ref(false)
  const selectedUser = ref(null)

  // Filtres / tri / pagination
  const searchQuery = ref('')
  const filterRole = ref('all')
  const filterClasse = ref('all')
  const currentPage = ref(1)
  const sortField = ref('name')
  const sortAsc = ref(true)

  watch([searchQuery, filterRole, filterClasse], () => { currentPage.value = 1 })

  /** Avertissements DÉRIVÉS de la mesure — aucun état d'erreur stocké. */
  const notices = computed(() => {
    const { classes: nbClasses, enseignants: nbEnseignants, classesOk } = counts.value
    const out = []

    if (nbClasses === null) {
      out.push(classes.value.length
        ? 'Classes : actualisation impossible, la liste peut être périmée.'
        : "Les classes n'ont pas pu être chargées : le filtre par classe est indisponible.")
    }
    if (nbEnseignants === null) {
      out.push(enseignants.value.length
        ? 'Enseignants : actualisation impossible, la liste peut être périmée.'
        : "Les enseignants n'ont pas pu être chargés.")
    }
    // Refus de droits : cause distincte d'un échec, et sans issue par un réessai.
    if (rosterForbidden.value) {
      out.push(
        "Vous n'avez pas les droits de consulter la liste nominative des étudiants. "
        + "L'effectif ci-dessus reste exact ; demandez cet accès à l'administrateur KLASSCI."
      )
      return out
    }

    // Échec TOTAL et PARTIEL sont la même phrase, à un chiffre près.
    // `classesOk === null` = chargement non encore mesuré : on ne dit rien.
    if (nbClasses !== null && nbClasses > 0 && classesOk !== null && classesOk < nbClasses) {
      out.push(
        `Étudiants : ${classesOk} classe(s) sur ${nbClasses} chargée(s) — la liste nominative `
        + "est incomplète. L'effectif affiché ci-dessus, lui, reste exact."
      )
    }
    return out
  })

  // Liste unifiée étudiants + enseignants
  const allUsers = computed(() => {
    const users = []
    etudiants.value.forEach(e => {
      users.push({
        _uid: `etu-${e.id}`, klassci_id: e.id,
        name: getFullName(e), email: e.email, role: ROLES.ETUDIANT,
        classe_id: e.classe_id, classe_nom: e.classe_nom,
        matricule: e.matricule, telephone: e.telephone,
      })
    })
    enseignants.value.forEach(e => {
      users.push({
        _uid: `ens-${e.id || e.teacher_id}`, klassci_id: e.id || e.teacher_id,
        // Rôle FORCÉ : /proxy/enseignants renvoie `"role":"etudiant"` pour un
        // professeur (donnée amont fausse, vérifiée contre l'API). La source de
        // vérité est ici l'endpoint interrogé, pas le champ.
        name: getFullName(e), email: e.email, role: ROLES.ENSEIGNANT,
        // Classes DÉRIVÉES des matières (helper canonique), jamais un `null` en dur.
        classe_id: null,
        classe_ids: getEnseignantUniqueClasses(e).map(c => c.id),
        classe_nom: getEnseignantClassesLabel(e),
        matricule: e.matricule, telephone: e.telephone, specialization: e.specialization,
      })
    })
    return users
  })

  const totalUsers = computed(() => allUsers.value.length)

  const filteredUsers = computed(() => {
    let result = allUsers.value
    if (filterRole.value !== 'all') result = result.filter(u => u.role === filterRole.value)
    // Étudiant = 1 classe, enseignant = N : test d'appartenance. Comparaison en
    // CHAÎNE (ids KLASSCI number vs string selon l'endpoint, cf. classStats::toId
    // — sinon un `===` strict laisserait tomber l'enseignant en silence).
    if (filterClasse.value !== 'all') {
      const target = String(filterClasse.value)
      result = result.filter(u =>
        String(u.classe_id) === target
        || (u.classe_ids ?? []).some((id) => String(id) === target))
    }
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim()
      result = result.filter(u =>
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.matricule && String(u.matricule).toLowerCase().includes(q)))
    }
    // COPIE avant tri : sans filtre actif, `result` EST le tableau mémoïsé
    // d'`allUsers` — le trier en place corrompait le cache d'un autre computed.
    return [...result].sort((a, b) => {
      const valA = (a[sortField.value] || '').toString().toLowerCase()
      const valB = (b[sortField.value] || '').toString().toLowerCase()
      const cmp = valA.localeCompare(valB)
      return sortAsc.value ? cmp : -cmp
    })
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

  /**
   * Résout une liste racine : le tableau chargé (fulfilled), ou `null` en échec
   * (tracé), pour que la ressource soit comptée NON MESURÉE. N'écrit PAS la ref :
   * l'application est différée en fin de fetchAll, sous garde de génération.
   */
  function resolveRoot(outcome, label) {
    if (outcome.status === 'fulfilled') {
      // Tableau nu OU enveloppe `{success, data}` : les deux formes coexistent.
      const v = outcome.value
      return Array.isArray(v) ? v : (Array.isArray(v?.data) ? v.data : [])
    }
    logError(outcome.reason, `[useAdminUsers] ${label}`)
    return null
  }

  // Jeton de génération : 2 chargements peuvent se chevaucher (revalidation +
  // Actualiser) ; seul le PLUS RÉCENT applique (un périmé écraserait le frais /
  // empoisonnerait le cache). `disposed` neutralise l'après-démontage.
  let loadGeneration = 0
  let disposed = false
  onUnmounted(() => { disposed = true })

  /** Récupère classes + enseignants (en parallèle) puis les étudiants. */
  async function fetchAll(onProgress) {
    const generation = ++loadGeneration

    const [classesOutcome, enseignantsOutcome] = await Promise.allSettled([
      klassciService.getClasses(),
      // `with_details` : seule cette variante porte les matières, donc les classes.
      lmsTeachersService.getEnseignants(true),
    ])
    const loadedClasses = resolveRoot(classesOutcome, 'classes')
    const loadedEnseignants = resolveRoot(enseignantsOutcome, 'enseignants')

    const classeList = loadedClasses ?? []
    const { collected, ok, forbidden } = await fetchClassRosters(classeList, onProgress)

    // Un chargement plus récent a démarré (ou on a démonté) pendant nos await :
    // ce résultat est périmé, on le jette — ni écrasement de frais, ni cache empoisonné.
    if (disposed || generation !== loadGeneration) return

    // Application ATOMIQUE (après la garde). Une ressource en échec (null) ne touche
    // pas sa liste : un endpoint en panne n'efface pas les données d'un autre.
    if (loadedClasses !== null) classes.value = loadedClasses
    if (loadedEnseignants !== null) enseignants.value = loadedEnseignants
    rosterForbidden.value = forbidden

    // Roster nominatif : on n'applique le résultat frais que s'il fait AUTORITÉ —
    // au moins une classe chargée (ok>0), ou établissement RÉELLEMENT vide (classes
    // chargées à 0). Sinon (échec des classes, ou échec TOTAL des rosters) AVEC un
    // roster déjà affiché, on le conserve : une panne ne vide pas une liste saine.
    const genuinelyEmpty = loadedClasses?.length === 0
    const preserveCached = ok === 0 && !genuinelyEmpty && etudiants.value.length > 0
    if (!preserveCached) etudiants.value = collected

    // `nb_etudiants` = EFFECTIF INSCRIT (somme des places_occupees), indépendant du
    // listing nominatif (qui peut être en panne). On ne REMESURE une ressource que si
    // son fetch a réussi ; sinon on conserve la mesure précédente — jamais un « — »
    // par-dessus une liste qu'on continue d'afficher. Dérivation PARTAGÉE avec le
    // dashboard et l'écran Statistiques (mêmes effectifs partout).
    const derived = deriveInstitutionCounters({ classes: loadedClasses, enseignants: loadedEnseignants })
    counts.value = {
      classes: loadedClasses ? derived.nb_classes_actives : counts.value.classes,
      enseignants: loadedEnseignants ? derived.nb_enseignants : counts.value.enseignants,
      etudiants: loadedClasses ? derived.nb_etudiants : counts.value.etudiants,
      // classesOk décrit le roster AFFICHÉ : mesuré (ok) si on vient de l'appliquer,
      // sinon la mesure précédente (on montre le cache, pas une liste « incomplète »).
      classesOk: preserveCached ? counts.value.classesOk : ok,
    }

    writeCache('admin_users', {
      etudiants: etudiants.value, enseignants: enseignants.value,
      classes: classes.value, counts: counts.value,
    })
  }

  async function loadAllUsers(forceReload = false) {
    loading.value = true
    loadingProgress.value = ''
    if (forceReload) {
      // #237 : le force-reload re-fetche classes + enseignants (+ étudiants) ;
      // on invalide leurs clés sœurs pour que les vues admin/coordinateur/
      // enseignant ne servent plus une version périmée.
      invalidateEntity('classes')
      invalidateEntity('enseignants')
    }

    // Le cache sert dès qu'il porte QUELQUE CHOSE : l'exiger non vide en étudiants
    // le rendait inatteignable précisément quand leur endpoint est en panne.
    const cached = forceReload ? null : readCache('admin_users')
    if (cached && (cached.etudiants?.length || cached.enseignants?.length || cached.classes?.length)) {
      etudiants.value = cached.etudiants || []
      enseignants.value = cached.enseignants || []
      classes.value = cached.classes || []
      counts.value = countsFromCache(cached)
      loading.value = false
      // Revalidation d'arrière-plan : on garde l'affichage en cache et on trace.
      fetchAll().catch((err) => logError(err, '[useAdminUsers] revalidation'))
      return
    }

    loadingProgress.value = 'Chargement des données...'
    try {
      await fetchAll((p) => { loadingProgress.value = p })
    } catch (err) {
      // fetchAll absorbe déjà chaque échec de ressource : n'atterrit ici qu'un
      // imprévu, qui ne doit pas laisser l'écran en chargement perpétuel.
      logError(err, '[useAdminUsers] chargement')
      counts.value = noCounts()
    } finally {
      loading.value = false
      loadingProgress.value = ''
    }
  }

  onMounted(() => { loadAllUsers() })

  return {
    etudiants, enseignants, classes, loading, loadingProgress, counts, notices, rosterForbidden, selectedUser,
    searchQuery, filterRole, filterClasse, currentPage, sortField, sortAsc,
    totalUsers, filteredUsers, totalPages, paginatedUsers,
    sortBy, selectUser, closeModal, loadAllUsers,
  }
}
