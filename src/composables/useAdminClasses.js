import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { klassciService } from '@/services/klassci'
import { readCache, writeCache } from '@/services/cache'
import { getClassCapacity, getClassMatiereCount, getClassStudentCount } from '@/utils/classStats'
import { extractList } from '@/utils/apiList'
import { toId } from '@/utils/toId'

const ADMIN_CLASSES_CACHE_KEY = 'admin_classes_v3'
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

const enrichClassSummary = (classe, matieresList) => {
  const studentCount = getClassStudentCount(classe)

  return {
    ...classe,
    places_occupees: studentCount,
    places_totales: getClassCapacity(classe, studentCount),
    nb_matieres: getClassMatiereCount(classe, matieresList)
  }
}

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
  const loading = ref(false)
  const error = ref(null)

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
      totalEtudiants: list.reduce((sum, c) => sum + (c.places_occupees || 0), 0),
      totalMatieres: asObjectArray(matieres.value).length,
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
      loading.value = false
      refreshInBackground()
      return
    }

    loading.value = true
    error.value = null

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
        matieres: matieres.value
      })

      queueMetadataRefresh(rawClasses)
    } catch (err) {
      console.error('[ERREUR] Chargement classes admin:', err)
      error.value = 'Impossible de charger les classes. Veuillez réessayer.'
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
        matieres: matieres.value
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
    filieres.value = deriveFilieres(rawClasses)
    niveaux.value = deriveNiveaux(rawClasses)

    classes.value = classes.value.map((classe) => ({
      ...classe,
      nb_matieres: getClassMatiereCount(classe, matieres.value)
    }))

    writeCache(ADMIN_CLASSES_CACHE_KEY, {
      classes: classes.value,
      filieres: filieres.value,
      niveaux: niveaux.value,
      matieres: matieres.value
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
    classes, filieres, niveaux, matieres, loading, error, filters,
    filteredClasses, stats,
    loadClasses, refreshInBackground, refreshMetadata, applyFilters, resetFilters, viewClasseDetails,
  }
}
