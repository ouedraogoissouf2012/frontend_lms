import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import { readCache, writeCache } from '@/services/cache'
import { nonEmptyArray, toId, unwrapArray } from '@/utils/evaluationDisplay'
import { idClasse, idEnseignant, idMatiere } from '@/utils/identiteEvaluation'
import { enrichEvaluation, teacherOption, deriveEnseignants as deriveEnseignantsOptions } from '@/utils/coordinatorEvaluations'
import { endpoints } from '@/services/endpoints'
import { displayMessage } from '@/services/displayMessage'

const EVALUATIONS_CACHE_KEY = 'coordinator_evaluations'
const REFERENCES_CACHE_KEY = 'coordinator_evaluation_references'
const EVALUATIONS_TIMEOUT_MS = 15000
const FILTER_OPTIONS_TIMEOUT_MS = 8000

export function useCoordinatorEvaluations() {
  const router = useRouter()

  // State
  const loading = ref(true)
  const error = ref(null)
  const evaluations = ref([])
  const enseignants = ref([])
  const classes = ref([])
  const matieres = ref([])

  // Filters
  const filters = ref({
    enseignant_id: '',
    classe_id: '',
    matiere_id: '',
    statut: ''
  })

  function readCachedArray(key, envelopeKeys = []) {
    const cached = readCache(key)
    const list = unwrapArray(cached, envelopeKeys)
    return list.length > 0 ? list : null
  }

  // Logique pure extraite (D72-c) : le composable passe ses référentiels courants.
  const enrich = (evaluation) => enrichEvaluation(evaluation, {
    enseignants: enseignants.value, classes: classes.value, matieres: matieres.value
  })

  function deriveEnseignants() {
    enseignants.value = deriveEnseignantsOptions(enseignants.value, evaluations.value)
  }

  function applyEvaluations(list) {
    evaluations.value = (Array.isArray(list) ? list : []).map(enrich)
    deriveEnseignants()
  }

  function persistReferences() {
    writeCache(REFERENCES_CACHE_KEY, {
      enseignants: enseignants.value,
      classes: classes.value,
      matieres: matieres.value
    })
  }

  function refreshEvaluationReferences() {
    evaluations.value = evaluations.value.map(enrich)
    deriveEnseignants()
    writeCache(EVALUATIONS_CACHE_KEY, evaluations.value)
    persistReferences()
  }

  async function fetchEvaluations() {
    const evalsResponse = await api.get(endpoints.evaluations.list, { timeout: EVALUATIONS_TIMEOUT_MS })
    const list = unwrapArray(evalsResponse, ['evaluations'])
    applyEvaluations(list)
    writeCache(EVALUATIONS_CACHE_KEY, evaluations.value)
  }

  async function loadFilterOptions() {
    const referencesCached = readCache(REFERENCES_CACHE_KEY) || {}
    const enseignantsCached = readCachedArray('admin_enseignants', ['enseignants']) || nonEmptyArray(referencesCached.enseignants, ['enseignants'])
    const classesCached = readCachedArray('admin_klassci_classes', ['classes']) || nonEmptyArray(referencesCached.classes, ['classes'])
    const matieresCached = readCachedArray('admin_klassci_matieres', ['matieres']) || nonEmptyArray(referencesCached.matieres, ['matieres'])

    if (enseignantsCached) enseignants.value = enseignantsCached.map(teacherOption).filter(Boolean)
    if (classesCached) classes.value = classesCached
    if (matieresCached) matieres.value = matieresCached
    refreshEvaluationReferences()

    const [enseignantsResult, classesResult, matieresResult] = await Promise.allSettled([
      enseignantsCached
        ? Promise.resolve(enseignantsCached)
        : api.get(endpoints.klassci.enseignants, { timeout: FILTER_OPTIONS_TIMEOUT_MS }).then(response => unwrapArray(response, ['enseignants'])),
      classesCached
        ? Promise.resolve(classesCached)
        : api.get(endpoints.klassci.classes, { timeout: FILTER_OPTIONS_TIMEOUT_MS }).then(response => unwrapArray(response, ['classes'])),
      matieresCached
        ? Promise.resolve(matieresCached)
        : api.get(endpoints.klassci.matieres, { timeout: FILTER_OPTIONS_TIMEOUT_MS }).then(response => unwrapArray(response, ['matieres']))
    ])

    if (enseignantsResult.status === 'fulfilled') {
      enseignants.value = (Array.isArray(enseignantsResult.value) ? enseignantsResult.value : []).map(teacherOption).filter(Boolean)
    } else {
      console.warn('[CoordinatorEvaluations] Enseignants indisponibles pour les filtres:', enseignantsResult.reason)
    }

    if (classesResult.status === 'fulfilled') {
      classes.value = Array.isArray(classesResult.value) ? classesResult.value : []
      if (!classesCached) writeCache('admin_klassci_classes', classes.value)
    } else {
      console.warn('[CoordinatorEvaluations] Classes indisponibles pour les filtres:', classesResult.reason)
    }

    if (matieresResult.status === 'fulfilled') {
      matieres.value = Array.isArray(matieresResult.value) ? matieresResult.value : []
      if (!matieresCached) writeCache('admin_klassci_matieres', matieres.value)
    } else {
      console.warn('[CoordinatorEvaluations] Matières indisponibles pour les filtres:', matieresResult.reason)
    }

    refreshEvaluationReferences()
  }

  // Computed
  const filteredEvaluations = computed(() => {
    let filtered = evaluations.value

    if (filters.value.enseignant_id) {
      // D72-c (L4) : même règle d'identité que les cartes et les options (champs à plat).
      filtered = filtered.filter(e => idEnseignant(e) === toId(filters.value.enseignant_id))
    }

    if (filters.value.classe_id) {
      filtered = filtered.filter(e => idClasse(e) === toId(filters.value.classe_id))
    }

    if (filters.value.matiere_id) {
      filtered = filtered.filter(e => idMatiere(e) === toId(filters.value.matiere_id))
    }

    if (filters.value.statut) {
      filtered = filtered.filter(e => {
        const effectiveStatus = e.effective_status || e.status
        return effectiveStatus === filters.value.statut
      })
    }

    return filtered
  })

  const stats = computed(() => {
    const all = filteredEvaluations.value
    return {
      total: all.length,
      enCours: all.filter(e => {
        const effectiveStatus = e.effective_status || e.status
        return effectiveStatus === 'planifiee' || effectiveStatus === 'en_cours'
      }).length,
      terminees: all.filter(e => {
        const effectiveStatus = e.effective_status || e.status
        return effectiveStatus === 'terminee'
      }).length,
      avecVersionEnLigne: all.filter(e => e.is_online).length
    }
  })

  // Methods
  const loadData = async () => {
    loading.value = true
    error.value = null

    const cachedEvaluations = readCache(EVALUATIONS_CACHE_KEY)
    if (Array.isArray(cachedEvaluations)) {
      applyEvaluations(cachedEvaluations)
      loading.value = false
      loadFilterOptions()

      fetchEvaluations().catch(err => {
        console.warn('[CoordinatorEvaluations] Rafraîchissement évaluations indisponible:', err)
      })
      return
    }

    try {
      await fetchEvaluations()

      // Les filtres classes/matières ne doivent jamais bloquer l'affichage des
      // évaluations. Ils se remplissent dès que le cache ou le proxy répond.
      loadFilterOptions()
    } catch (err) {
      console.error('Erreur chargement données:', err)
      error.value = displayMessage(err, 'Erreur lors du chargement des évaluations')
    } finally {
      loading.value = false
    }
  }

  const applyFilters = () => {
    // Les filtres sont automatiquement appliqués via computed
  }

  const resetFilters = () => {
    filters.value = {
      enseignant_id: '',
      classe_id: '',
      matiere_id: '',
      statut: ''
    }
  }

  const viewResults = (id) => {
    router.push(`/admin/evaluations/${id}/details`)
  }

  const viewDetails = (id) => {
    router.push(`/coordinateur/evaluations/${id}/preview`)
  }

  onMounted(() => {
    loadData()
  })

  return {
    loading, error, evaluations, enseignants, classes, matieres, filters,
    filteredEvaluations, stats,
    loadData, applyFilters, resetFilters, viewResults, viewDetails,
  }
}
