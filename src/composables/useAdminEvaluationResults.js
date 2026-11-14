import { ref, computed, onMounted } from 'vue'
import { formatDate as fmtDate } from '@/utils/formatters'
import { useRouter } from 'vue-router'
import api, { auth } from '@/services/api'
import { hasRole, ROLES } from '@/constants/roles'
import { endpoints } from '@/services/endpoints'
import { klassciService } from '@/services/klassci'
import { extractList } from '@/utils/apiList'
import { toId } from '@/utils/toId'
import { idClasse, idEnseignant, idMatiere } from '@/utils/identiteEvaluation'
import { displayMessage } from '@/services/displayMessage'

/**
 * Couche données d'AdminEvaluationResults (#H3 ≤300) : charge les évaluations
 * KLASSCI, en dérive la liste des enseignants + classes + matières, gère les
 * filtres (enseignant/classe/matière/statut), les stats dérivées et la
 * navigation. La vue ne fait plus que câbler ; logique déplacée verbatim.
 */
export function useAdminEvaluationResults() {
  const router = useRouter()

  // User role check
  const currentUser = computed(() => auth.getUser())
  const isCoordinateur = computed(() => hasRole(currentUser.value, ROLES.COORDINATEUR))

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
      // D72-c (L5) : l'identité suit la règle des deux familles (champs à plat).
      filtered = filtered.filter(e => idEnseignant(e) === toId(filters.value.enseignant_id))
    }

    if (filters.value.classe_id) {
      filtered = filtered.filter(e => idClasse(e) === toId(filters.value.classe_id))
    }

    if (filters.value.matiere_id) {
      filtered = filtered.filter(e => idMatiere(e) === toId(filters.value.matiere_id))
    }

    if (filters.value.statut) {
      // Utiliser effective_status au lieu de status pour respecter les dates passées
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
      const evalsResponse = await api.get(endpoints.evaluations.list)

      evaluations.value = extractList(evalsResponse)


      // Extraire la liste unique des enseignants
      const enseignantsMap = new Map()
      evaluations.value.forEach(evaluation => {
        // D72-c (L5) : option clée par la règle d'identité ; `klassci_id` n'est posé que s'il existe.
        const id = idEnseignant(evaluation)
        if (id && evaluation.enseignant_nom) {
          enseignantsMap.set(id, {
            id,
            klassci_id: evaluation.klassci_enseignant_id ?? null,
            name: evaluation.enseignant_nom,
            libelle: evaluation.enseignant_nom,
            email: evaluation.enseignant?.email || ''
          })
        }
      })
      enseignants.value = Array.from(enseignantsMap.values()).sort((a, b) => a.name.localeCompare(b.name))

      // Classes et matières via le service KLASSCI (déjà normalisé à la frontière
      // #343) : plus de dé-wrap d'enveloppe nommée ad hoc côté composable (#296).
      const [classesList, matieresList] = await Promise.all([
        klassciService.getClasses(),
        klassciService.getMatieres()
      ])

      classes.value = classesList
      matieres.value = matieresList

    } catch (err) {
      console.error('Erreur chargement données:', err)
      error.value = displayMessage(err, 'Erreur lors du chargement des données')
    } finally {
      loading.value = false
    }
  }


  const updateFilter = (filterName, value) => {
    filters.value[filterName] = value
  }


  const resetFilters = () => {
    // ⚠️ NE PAS réassigner filters.value car ça casse la réactivité!
    // Au lieu de ça, modifier les propriétés individuellement:
    filters.value.enseignant_id = ''
    filters.value.classe_id = ''
    filters.value.matiere_id = ''
    filters.value.statut = ''
  }

  const viewResults = (id) => {
    // Rediriger vers la page de détails avec classe/évaluation
    router.push(`/admin/evaluations/${id}/details`)
  }

  const viewDetails = (id) => {
    // Utiliser la route appropriée selon le rôle
    if (isCoordinateur.value) {
      router.push(`/coordinateur/evaluations/${id}/preview`)
    } else {
      router.push(`/teacher/evaluations/${id}/preview`)
    }
  }

  const getStatusClass = (status) => {
    const classes = {
      'brouillon': 'status-draft',
      'planifiee': 'status-planned',
      'en_cours': 'status-active',
      'terminee': 'status-completed'
    }
    return classes[status] || 'status-draft'
  }

  const getStatusLabel = (status) => {
    const labels = {
      'brouillon': 'Brouillon',
      'planifiee': 'Planifiée',
      'en_cours': 'En cours',
      'terminee': 'Terminée'
    }
    return labels[status] || status
  }

  const isEvaluationTerminee = (evaluation) => {
    // Utilise le statut effectif calculé par le backend (date + durée)
    // Si pas de effective_status, fallback sur status
    const effectiveStatus = evaluation.effective_status || evaluation.status
    return effectiveStatus === 'terminee'
  }

  // #283 : délègue au formatter canonique (repli local conservé).
  const formatDate = (date) => fmtDate(date, { fallback: '-' })

  onMounted(() => {
    loadData()
  })

  return {
    isCoordinateur,
    loading, error, evaluations, enseignants, classes, matieres,
    filters, filteredEvaluations, stats,
    loadData, updateFilter, resetFilters, viewResults, viewDetails,
    getStatusClass, getStatusLabel, isEvaluationTerminee, formatDate,
  }
}
