import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { klassciService } from '@/services/klassci'
import { readCache, writeCache } from '@/services/cache'

const asArray = (value, keys = []) => {
  if (Array.isArray(value)) return value
  if (!value || typeof value !== 'object') return []

  for (const key of keys) {
    if (Array.isArray(value[key])) return value[key]
  }
  if (Array.isArray(value.data)) return value.data
  for (const key of keys) {
    if (Array.isArray(value.data?.[key])) return value.data[key]
  }

  return []
}

const asObjectArray = (value, keys = []) =>
  asArray(value, keys).filter(item => item && typeof item === 'object')

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
      result = result.filter(c => c.filiere?.id === parseInt(filters.value.filiere_id))
    }

    if (filters.value.niveau_id) {
      result = result.filter(c => c.niveau?.id === parseInt(filters.value.niveau_id))
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
      totalMatieres: list.reduce((sum, c) => sum + (c.nb_matieres || 0), 0),
      actives: list.filter(c => c.is_active).length
    }
  })

  // Load classes
  async function loadClasses() {
    // Check cache
    const cached = readCache('admin_classes')
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

      // Load all data in parallel
      const [classesData, matieresData, structureData] = await Promise.all([
        klassciService.getClasses(),
        klassciService.getMatieres(),
        klassciService.getStructure()
      ])

      const rawClasses = asObjectArray(classesData, ['classes'])
      matieres.value = asObjectArray(matieresData, ['matieres'])
      filieres.value = asObjectArray(structureData, ['filieres'])
      niveaux.value = asObjectArray(structureData, ['niveaux_etude', 'niveaux'])

      console.log('[ADMIN] Classes:', rawClasses.length, 'Matières:', matieres.value.length)

      // Enrich each class with counters
      const enrichedClasses = await Promise.all(
        rawClasses.map(async (classe) => {
          try {
            const etudiants = await klassciService.getClasseEtudiants(classe.id)
            const nbEtudiants = asObjectArray(etudiants, ['etudiants']).length

            // Count all matieres for this class (same logic as TeacherClasses)
            const nbMatieres = matieres.value.length

            const placesTotales = classe.effectif_max ||
                                  classe.capacite ||
                                  classe.places_totales ||
                                  classe.effectif ||
                                  (nbEtudiants > 0 ? Math.max(nbEtudiants, 30) : 30)

            return {
              ...classe,
              places_occupees: nbEtudiants,
              places_totales: placesTotales,
              nb_matieres: nbMatieres
            }
          } catch (err) {
            console.warn(`[WARN] Impossible d'enrichir classe ${classe.id}:`, err.message)
            return {
              ...classe,
              places_occupees: 0,
              places_totales: 30,
              nb_matieres: matieres.value.length
            }
          }
        })
      )

      classes.value = enrichedClasses

      // Save to cache
      writeCache('admin_classes', {
        classes: classes.value,
        filieres: filieres.value,
        niveaux: niveaux.value,
        matieres: matieres.value
      })
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
      const [classesData, matieresData, structureData] = await Promise.all([
        klassciService.getClasses(),
        klassciService.getMatieres(),
        klassciService.getStructure()
      ])

      const rawClasses = asObjectArray(classesData, ['classes'])
      matieres.value = asObjectArray(matieresData, ['matieres'])
      filieres.value = asObjectArray(structureData, ['filieres'])
      niveaux.value = asObjectArray(structureData, ['niveaux_etude', 'niveaux'])

      const enrichedClasses = await Promise.all(
        rawClasses.map(async (classe) => {
          try {
            const etudiants = await klassciService.getClasseEtudiants(classe.id)
            const nbEtudiants = asObjectArray(etudiants, ['etudiants']).length
            const nbMatieres = matieres.value.length
            const placesTotales = classe.effectif_max || classe.capacite || (nbEtudiants > 0 ? Math.max(nbEtudiants, 30) : 30)

            return {
              ...classe,
              places_occupees: nbEtudiants,
              places_totales: placesTotales,
              nb_matieres: nbMatieres
            }
          } catch (err) {
            return {
              ...classe,
              places_occupees: 0,
              places_totales: 30,
              nb_matieres: matieres.value.length
            }
          }
        })
      )

      classes.value = enrichedClasses

      writeCache('admin_classes', {
        classes: classes.value,
        filieres: filieres.value,
        niveaux: niveaux.value,
        matieres: matieres.value
      })
    } catch (error) {
      console.warn('[BACKGROUND] Erreur rafraîchissement:', error)
    }
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
    loadClasses, refreshInBackground, applyFilters, resetFilters, viewClasseDetails,
  }
}
