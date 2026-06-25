import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'

/**
 * Couche données de CoordinatorEvaluations (H2 ≤300) : charge toutes les
 * évaluations (tous enseignants), dérive la liste d'enseignants, applique les
 * filtres (enseignant/classe/matière/statut) et calcule les stats. La vue câble.
 */
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

    try {
      // Charger les évaluations
      const evalsResponse = await api.get('/evaluations')
      // L'intercepteur retourne déjà response.data, donc evalsResponse = { success: true, data: [...] }
      evaluations.value = evalsResponse.data || []

      // Extraire la liste unique des enseignants
      const enseignantsMap = new Map()
      evaluations.value.forEach(evaluation => {
        if (evaluation.klassci_enseignant_id && evaluation.enseignant_nom) {
          enseignantsMap.set(evaluation.klassci_enseignant_id, {
            klassci_id: evaluation.klassci_enseignant_id,
            name: evaluation.enseignant_nom,
            email: evaluation.enseignant?.email || ''
          })
        }
      })
      enseignants.value = Array.from(enseignantsMap.values()).sort((a, b) => a.name.localeCompare(b.name))

      // Charger classes et matières
      const [classesResponse, matieresResponse] = await Promise.all([
        api.get('/proxy/classes'),
        api.get('/proxy/matieres')
      ])

      classes.value = classesResponse.data || []
      matieres.value = matieresResponse.data || []

    } catch (err) {
      console.error('Erreur chargement données:', err)
      error.value = err.response?.data?.message || 'Erreur lors du chargement des données'
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
