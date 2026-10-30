import { ref, reactive, computed } from 'vue'
import klassciService from '@/services/klassci'
import evaluationService from '@/services/evaluation'
import { fetchTeacherMatieres } from '@/services/teacherReferentials'
import { readCache, writeCache } from '@/services/cache'
import { normalizeError } from '@/services/errorHandler'
import { ERROR_MESSAGES } from '@/constants/errorMessages'
import {
  mergeWithOnlineVersions,
  isExpiredWithoutOnline,
  filterEvaluations,
  computeEvaluationStats
} from '@/utils/evaluations'

// #420 : un compte sans aucun accès KLASSCI n'est pas une panne. Son constat (message du
// catalogue, source unique) va dans `mentionSource` ; l'état d'erreur reste aux pannes.
const sansAccesKlassci = (err) => normalizeError(err).category === 'klassciTokenMissing'
const MENTION_SANS_ACCES_KLASSCI = ERROR_MESSAGES.klassciTokenMissing

/**
 * Composable de données des évaluations enseignant (#28, tranche 2).
 *
 * Encapsule le chargement (KLASSCI + LMS, avec cache classes/matières),
 * l'état réactif, les filtres et les valeurs dérivées (fusion, filtrage,
 * stats — calculées via les fonctions pures de `@/utils/evaluations`).
 * Extrait du god-component `TeacherEvaluations.vue`.
 */
export function useTeacherEvaluations() {
  // État
  const evaluationsKlassci = ref([])
  const evaluationsLMS = ref([])
  const classes = ref([])
  const matieres = ref([])
  const loading = ref(true)
  const error = ref(null)
  const mentionSource = ref('')
  const hideExpired = ref(true) // masquer par défaut les expirées sans version en ligne

  const filters = reactive({
    classe_id: '',
    matiere_id: '',
    statut: ''
  })

  // Dérivés (logique pure)
  const evaluationsWithOnline = computed(() =>
    mergeWithOnlineVersions(evaluationsKlassci.value, evaluationsLMS.value)
  )
  const expiredWithoutOnlineCount = computed(() =>
    evaluationsWithOnline.value.filter(isExpiredWithoutOnline).length
  )
  const filteredEvaluations = computed(() =>
    filterEvaluations(evaluationsWithOnline.value, {
      hideExpired: hideExpired.value,
      classe_id: filters.classe_id,
      matiere_id: filters.matiere_id,
      statut: filters.statut
    })
  )
  const stats = computed(() => computeEvaluationStats(evaluationsWithOnline.value))

  // Chargements
  async function loadClasses() {
    const cached = readCache('teacher_classes')
    if (cached !== null) {
      classes.value = cached
      return
    }
    try {
      const data = await klassciService.getClasses()
      classes.value = Array.isArray(data) ? data : []
      writeCache('teacher_classes', classes.value)
    } catch (err) {
      console.error('[ERREUR] Chargement classes:', err)
    }
  }

  async function loadMatieres() {
    const cached = readCache('teacher_matieres')
    if (cached !== null) {
      matieres.value = cached
      return
    }
    try {
      // #315 : source + forme canoniques (partagées avec useTeacherLessons/Seances).
      matieres.value = await fetchTeacherMatieres()
      writeCache('teacher_matieres', matieres.value)
    } catch (err) {
      console.error('[ERREUR] Chargement matières:', err)
    }
  }

  /**
   * Évaluations KLASSCI, avec repli sur le dashboard enseignant.
   *
   * #420 : trois issues distinctes, que l'écran ne confond plus.
   *  - Ce compte n'a aucun accès KLASSCI (`reason` serveur, jamais le mode de
   *    l'établissement) → mention vraie, sans repli : le dashboard vient de la
   *    même source et serait refusé pour la même cause.
   *  - Panne, repli compris → l'échec d'origine REMONTE, et loadData le dit.
   *  - Sinon, la liste reçue, même vide.
   */
  async function loadEvaluationsKlassci() {
    try {
      const result = await klassciService.getEvaluations(filters)
      if (result.success) {
        evaluationsKlassci.value = result.data
      }
    } catch (err) {
      if (sansAccesKlassci(err)) {
        mentionSource.value = MENTION_SANS_ACCES_KLASSCI
        return
      }
      console.error('[ERREUR] Chargement évaluations KLASSCI, fallback dashboard:', err)
      // Fallback : dashboard enseignant
      let dashboard
      try {
        dashboard = await klassciService.getTeacherDashboard()
      } catch (dashboardError) {
        if (sansAccesKlassci(dashboardError)) {
          mentionSource.value = MENTION_SANS_ACCES_KLASSCI
          return
        }
        console.error('[ERREUR] Fallback dashboard:', dashboardError)
        throw err
      }
      // Un dashboard refusé (`success` faux → null) ne prouve pas l'absence
      // d'évaluations : c'est encore la panne d'origine.
      if (!dashboard || !Array.isArray(dashboard.evaluations)) throw err
      evaluationsKlassci.value = dashboard.evaluations
    }
  }

  async function loadEvaluationsLMS() {
    try {
      const result = await evaluationService.getEvaluations()
      if (result.success) {
        // Les compteurs viennent du SERVEUR, qui les calcule sur la base ;
        // la longueur d'une relation n'est qu'un repli pour les réponses qui
        // ne les portent pas encore.
        //
        // Écraser la valeur du serveur par `e.submissions?.length` empêchait de
        // retirer cette relation du payload — or elle contenait les copies de
        // TOUS les élèves : réponses, score et note. Sans ce repli inversé, la
        // retirer ferait tomber le compteur à 0 et supprimerait le bouton
        // « Voir les notes » (`EvaluationCardActions.vue:22`).
        //
        // `??` et non `||` : un 0 renvoyé par le serveur est une mesure, pas
        // une absence.
        evaluationsLMS.value = result.data.map((e) => ({
          ...e,
          questions_count: e.questions_count ?? (e.questions?.length || 0),
          submissions_count: e.submissions_count ?? (e.submissions?.length || 0)
        }))
      }
    } catch (err) {
      console.warn('[INFO] Aucune évaluation LMS (normal si aucune créée):', err.message)
      evaluationsLMS.value = []
    }
  }

  async function loadData() {
    loading.value = true
    error.value = null
    // Avant tout await : la mention d'un chargement précédent ne survit pas au suivant.
    mentionSource.value = ''
    try {
      await Promise.all([loadClasses(), loadMatieres()])
      await Promise.all([loadEvaluationsKlassci(), loadEvaluationsLMS()])
    } catch (err) {
      console.error('[ERREUR] Chargement données:', err)
      // Message du catalogue (fail-secure) : une panne KLASSCI dit « réessayez ».
      error.value = normalizeError(err).userMessage
    } finally {
      loading.value = false
    }
  }

  function applyFilters() {
    // Les filtres sont réactifs ; filteredEvaluations se recalcule seul.
  }

  function resetFilters() {
    filters.classe_id = ''
    filters.matiere_id = ''
    filters.statut = ''
  }

  return {
    // état
    evaluationsKlassci,
    evaluationsLMS,
    classes,
    matieres,
    loading,
    error,
    mentionSource,
    hideExpired,
    filters,
    // dérivés
    evaluationsWithOnline,
    expiredWithoutOnlineCount,
    filteredEvaluations,
    stats,
    // actions de données
    loadData,
    loadClasses,
    loadMatieres,
    loadEvaluationsKlassci,
    loadEvaluationsLMS,
    applyFilters,
    resetFilters
  }
}
