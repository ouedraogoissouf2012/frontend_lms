import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import { readCache, writeCache } from '@/services/cache'
import { byId, displayName, firstValue, nonEmptyArray, toId, unwrapArray } from '@/utils/evaluationDisplay'
import { endpoints } from '@/services/endpoints'

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

  function normalizeEvaluation(evaluation) {
    const enseignantId = toId(firstValue(
      evaluation.klassci_enseignant_id,
      evaluation.enseignant_id,
      evaluation.teacher_id,
      evaluation.enseignant,
      evaluation.teacher
    ))
    const classeId = toId(firstValue(evaluation.klassci_classe_id, evaluation.classe_id, evaluation.class_id, evaluation.classe))
    const matiereId = toId(firstValue(evaluation.klassci_matiere_id, evaluation.matiere_id, evaluation.subject_id, evaluation.matiere))
    const matiereNom = firstValue(evaluation.matiere_nom, evaluation.matiere_name, evaluation.subject_name, displayName(evaluation.matiere))
    const classeNom = firstValue(evaluation.classe_nom, evaluation.classe_name, evaluation.class_name, displayName(evaluation.classe))

    return {
      ...evaluation,
      klassci_enseignant_id: firstValue(evaluation.klassci_enseignant_id, enseignantId),
      klassci_classe_id: firstValue(evaluation.klassci_classe_id, classeId),
      klassci_matiere_id: firstValue(evaluation.klassci_matiere_id, matiereId),
      enseignant_nom: firstValue(evaluation.enseignant_nom, displayName(evaluation.enseignant), displayName(evaluation.teacher), enseignantId ? `Enseignant #${enseignantId}` : ''),
      matiere: evaluation.matiere || (matiereNom ? { id: matiereId, nom: matiereNom } : null),
      classe: evaluation.classe || (classeNom ? { id: classeId, nom: classeNom } : null)
    }
  }

  function enrichEvaluation(evaluation) {
    const normalized = normalizeEvaluation(evaluation)
    const enseignantsById = byId(enseignants.value)
    const classesById = byId(classes.value)
    const matieresById = byId(matieres.value)
    const enseignant = enseignantsById.get(toId(normalized.klassci_enseignant_id))
    const classe = classesById.get(toId(normalized.klassci_classe_id))
    const matiere = matieresById.get(toId(normalized.klassci_matiere_id))

    return {
      ...normalized,
      enseignant: enseignant || normalized.enseignant || null,
      classe: classe || normalized.classe || null,
      matiere: matiere || normalized.matiere || null,
      enseignant_nom: firstValue(displayName(enseignant), normalized.enseignant_nom),
      classe_nom: firstValue(displayName(classe), normalized.classe_nom, displayName(normalized.classe)),
      matiere_nom: firstValue(displayName(matiere), normalized.matiere_nom, displayName(normalized.matiere))
    }
  }

  function teacherOption(enseignant) {
    const id = toId(enseignant)
    const name = displayName(enseignant)
    if (!id || !name) return null
    const source = typeof enseignant === 'object' && enseignant !== null ? enseignant : {}
    return {
      ...source,
      klassci_id: source.klassci_id ?? source.id ?? source.teacher_id ?? id,
      name,
      email: source.email || ''
    }
  }

  function deriveEnseignants() {
    const enseignantsMap = new Map()
    enseignants.value.forEach((enseignant) => {
      const option = teacherOption(enseignant)
      if (option) enseignantsMap.set(toId(option.klassci_id), option)
    })
    evaluations.value.forEach(evaluation => {
      if (evaluation.klassci_enseignant_id && (evaluation.enseignant_nom || evaluation.enseignant)) {
        enseignantsMap.set(toId(evaluation.klassci_enseignant_id), {
          ...(evaluation.enseignant || {}),
          klassci_id: evaluation.klassci_enseignant_id,
          name: firstValue(evaluation.enseignant_nom, displayName(evaluation.enseignant)),
          email: evaluation.enseignant?.email || ''
        })
      }
    })
    enseignants.value = Array.from(enseignantsMap.values()).sort((a, b) => a.name.localeCompare(b.name))
  }

  function applyEvaluations(list) {
    evaluations.value = (Array.isArray(list) ? list : []).map(enrichEvaluation)
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
    evaluations.value = evaluations.value.map(enrichEvaluation)
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
      filtered = filtered.filter(e => e.klassci_enseignant_id == filters.value.enseignant_id)
    }

    if (filters.value.classe_id) {
      filtered = filtered.filter(e => e.klassci_classe_id == filters.value.classe_id)
    }

    if (filters.value.matiere_id) {
      filtered = filtered.filter(e => e.klassci_matiere_id == filters.value.matiere_id)
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
      error.value = err.userMessage || err.response?.data?.message || 'Erreur lors du chargement des évaluations'
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
