import { ref, reactive, computed } from 'vue'
import klassciService from '@/services/klassci'
import evaluationService from '@/services/evaluation'
import { readCache, writeCache } from '@/services/cache'
import {
  mergeWithOnlineVersions,
  isExpiredWithoutOnline,
  filterEvaluations,
  computeEvaluationStats
} from '@/utils/evaluations'

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
      const data = await klassciService.getMatieres()
      matieres.value = Array.isArray(data) ? data : []
      writeCache('teacher_matieres', matieres.value)
    } catch (err) {
      console.error('[ERREUR] Chargement matières:', err)
    }
  }

  async function loadEvaluationsKlassci() {
    try {
      const result = await klassciService.getEvaluations(filters)
      if (result.success) {
        evaluationsKlassci.value = result.data
      }
    } catch (err) {
      console.error('[ERREUR] Chargement évaluations KLASSCI, fallback dashboard:', err)
      // Fallback : dashboard enseignant
      try {
        const dashboard = await klassciService.getTeacherDashboard()
        if (dashboard && dashboard.evaluations) {
          evaluationsKlassci.value = dashboard.evaluations
        }
      } catch (dashboardError) {
        console.error('[ERREUR] Fallback dashboard:', dashboardError)
      }
    }
  }

  async function loadEvaluationsLMS() {
    try {
      const result = await evaluationService.getEvaluations()
      if (result.success) {
        evaluationsLMS.value = result.data.map((e) => ({
          ...e,
          questions_count: e.questions?.length || 0,
          submissions_count: e.submissions?.length || 0
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
    try {
      await Promise.all([loadClasses(), loadMatieres()])
      await Promise.all([loadEvaluationsKlassci(), loadEvaluationsLMS()])
    } catch (err) {
      console.error('[ERREUR] Chargement données:', err)
      error.value = 'Impossible de charger les évaluations. Veuillez réessayer.'
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
