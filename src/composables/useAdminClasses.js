import { ref, computed, onMounted } from 'vue'
import { estPannePassagere } from '@/utils/pannePassagere'
import { useRouter } from 'vue-router'
import { klassciService } from '@/services/klassci'
import { readCache, writeCache } from '@/services/cache'
import { measureClassCapacity, measureClassMatiereCountIn, measureClassStudentCount } from '@/utils/classStats'
import { extractList } from '@/utils/apiList'
import { toId } from '@/utils/toId'
import { normalizeError } from '@/services/errorHandler'

// v4 : les entrées v3 portaient une capacité inventée (30) et des zéros non mesurés.
const ADMIN_CLASSES_CACHE_KEY = 'admin_classes_v4'
const ADMIN_CLASSES_TIMEOUT_MS = 20000
const ADMIN_CLASSES_METADATA_TIMEOUT_MS = 25000

const asArray = (value, keys = []) => extractList(value, keys)

const asObjectArray = (value, keys = []) =>
  asArray(value, keys).filter(item => item && typeof item === 'object')

const normalizeMatieres = (response) => {
  if (response?.success && response?.data) {
    return asObjectArray(response.data, ['matieres'])
  }
  return asObjectArray(response, ['matieres'])
}

// Une valeur absente reste `null` (affichée « — ») : jamais un 0 ni une capacité inventés.
const enrichClassSummary = (classe, matieresList) => ({
  ...classe,
  places_occupees: measureClassStudentCount(classe),
  places_totales: measureClassCapacity(classe),
  nb_matieres: measureClassMatiereCountIn(classe, matieresList)
})

// Un total n'est vrai que si CHAQUE classe est mesurée : un total partiel passerait pour le total.
const sumMeasured = (values) =>
  values.every(v => v !== null && v !== undefined) ? values.reduce((sum, v) => sum + v, 0) : null

const uniqueObjectsById = (items) => {
  const byId = new Map()
  for (const item of items) {
    const id = toId(item)
    if (id && !byId.has(id)) {
      byId.set(id, item)
    }
  }
  return Array.from(byId.values())
}

const deriveFilieres = (classes) =>
  uniqueObjectsById(asObjectArray(classes).map(classe => classe.filiere).filter(Boolean))

const deriveNiveaux = (classes) =>
  uniqueObjectsById(asObjectArray(classes).map(classe => classe.niveau || classe.niveau_etude).filter(Boolean))

const optional = async (promise, fallback, label) => {
  try {
    return await promise
  } catch (error) {
    console.warn(`[WARN] ${label}:`, error?.message || error)
    return fallback
  }
}

/**
 * Couche données d'AdminClasses (#G1 ≤300) : charge les classes KLASSCI, les
 * enrichit (étudiants/matières), gère filtres (filière/niveau/statut), stats et
 * navigation, avec cache + rafraîchissement en arrière-plan. La vue ne fait que câbler.
 */
export function useAdminClasses() {
  const router = useRouter()

  const classes = ref([])
  const filieres = ref([])
  const niveaux = ref([])
  const matieres = ref([])
  // Les matières ont-elles été OBTENUES ? Sans elles, leur total n'est pas mesuré (« — »), pas 0.
  const matieresMesurees = ref(false)
  const loading = ref(false)
  const error = ref(null)
  // « Réessayer » seulement sur une panne passagère (503 KLASSCI) ; un refus (401, 403…) non.
  const canRetry = ref(true)

  const filters = ref({
    filiere_id: '',
    niveau_id: '',
    statut: ''
  })

  // Computed: Filtered classes
  const filteredClasses = computed(() => {
    let result = asObjectArray(classes.value)

    if (filters.value.filiere_id) {
      result = result.filter(c => toId(c.filiere) === toId(filters.value.filiere_id))
    }

    if (filters.value.niveau_id) {
      result = result.filter(c => toId(c.niveau) === toId(filters.value.niveau_id))
    }

    if (filters.value.statut) {
      const isActive = filters.value.statut === 'active'
      result = result.filter(c => c.is_active === isActive)
    }

    return result
  })

  // Computed: Statistics
  const stats = computed(() => {
    const list = asObjectArray(classes.value)
    return {
      total: list.length,
      totalEtudiants: sumMeasured(list.map(c => c.places_occupees)),
      totalMatieres: matieresMesurees.value ? asObjectArray(matieres.value).length : null,
      actives: list.filter(c => c.is_active).length
    }
  })

  // Load classes
  async function loadClasses() {
    // Check cache
    const cached = readCache(ADMIN_CLASSES_CACHE_KEY)
    if (cached) {
      classes.value = asObjectArray(cached, ['classes'])
      filieres.value = asObjectArray(cached, ['filieres'])
      niveaux.value = asObjectArray(cached, ['niveaux_etude', 'niveaux'])
      matieres.value = asObjectArray(cached, ['matieres'])
      matieresMesurees.value = cached?.matieres_mesurees === true
      loading.value = false
      refreshInBackground()
      return
    }

    loading.value = true
    error.value = null
    canRetry.value = true

    try {
      console.log('[ADMIN] Chargement de toutes les classes...')

      const classesData = await klassciService.getClasses({ timeout: ADMIN_CLASSES_TIMEOUT_MS })
      const rawClasses = asObjectArray(classesData, ['classes'])

      if (filieres.value.length === 0) filieres.value = deriveFilieres(rawClasses)
      if (niveaux.value.length === 0) niveaux.value = deriveNiveaux(rawClasses)

      console.log('[ADMIN] Classes:', rawClasses.length)

      classes.value = rawClasses.map(classe => enrichClassSummary(classe, matieres.value))

      // Save to cache
      writeCache(ADMIN_CLASSES_CACHE_KEY, {
        classes: classes.value,
        filieres: filieres.value,
        niveaux: niveaux.value,
        matieres: matieres.value,
        matieres_mesurees: matieresMesurees.value
      })

      queueMetadataRefresh(rawClasses)
    } catch (err) {
      console.error('[ERREUR] Chargement classes admin:', err)
      error.value = err.userMessage ?? normalizeError(err).userMessage
      canRetry.value = estPannePassagere(err)
    } finally {
      loading.value = false
    }
  }

  // Refresh in background
  async function refreshInBackground() {
    try {
      console.log('[BACKGROUND] Rafraîchissement classes admin...')
      const classesData = await klassciService.getClasses({ timeout: ADMIN_CLASSES_TIMEOUT_MS })
      const rawClasses = asObjectArray(classesData, ['classes'])

      if (filieres.value.length === 0) filieres.value = deriveFilieres(rawClasses)
      if (niveaux.value.length === 0) niveaux.value = deriveNiveaux(rawClasses)

      classes.value = rawClasses.map(classe => enrichClassSummary(classe, matieres.value))

      writeCache(ADMIN_CLASSES_CACHE_KEY, {
        classes: classes.value,
        filieres: filieres.value,
        niveaux: niveaux.value,
        matieres: matieres.value,
        matieres_mesurees: matieresMesurees.value
      })

      queueMetadataRefresh(rawClasses)
    } catch (error) {
      console.warn('[BACKGROUND] Erreur rafraîchissement:', error)
    }
  }

  function queueMetadataRefresh(rawClasses = classes.value) {
    refreshMetadata(rawClasses).catch((error) => {
      console.warn('[BACKGROUND] Erreur enrichissement métadonnées classes:', error)
    })
  }

  async function refreshMetadata(rawClasses = classes.value) {
    const matieresData = await optional(
      klassciService.getMatieres({ timeout: ADMIN_CLASSES_METADATA_TIMEOUT_MS }),
      null,
      'Matières KLASSCI indisponibles'
    )

    const nextMatieres = normalizeMatieres(matieresData)

    if (nextMatieres.length > 0) matieres.value = nextMatieres
    // `optional` rend null sur échec : une réponse, même vide, est une mesure.
    if (matieresData != null) matieresMesurees.value = true
    filieres.value = deriveFilieres(rawClasses)
    niveaux.value = deriveNiveaux(rawClasses)

    classes.value = classes.value.map((classe) => ({
      ...classe,
      nb_matieres: measureClassMatiereCountIn(classe, matieres.value)
    }))

    writeCache(ADMIN_CLASSES_CACHE_KEY, {
      classes: classes.value,
      filieres: filieres.value,
      niveaux: niveaux.value,
      matieres: matieres.value,
      matieres_mesurees: matieresMesurees.value
    })
  }

  // Apply filters
  function applyFilters() {
    console.log('[FILTERS] Filtres appliqués:', filters.value)
  }

  // Reset filters
  function resetFilters() {
    filters.value.filiere_id = ''
    filters.value.niveau_id = ''
    filters.value.statut = ''
    console.log('[FILTERS] Filtres réinitialisés')
  }

  // View class details
  function viewClasseDetails(classe) {
    router.push({
      name: 'classe-details',
      params: { id: classe.id }
    })
  }

  onMounted(() => {
    loadClasses()
  })

  return {
    classes, filieres, niveaux, matieres, loading, error, canRetry, filters,
    filteredClasses, stats,
    loadClasses, refreshInBackground, refreshMetadata, applyFilters, resetFilters, viewClasseDetails,
  }
}
