import { ref, computed, onMounted } from 'vue'
import { klassciService } from '@/services/klassci'
import { readCache, writeCache, invalidateEntity } from '@/services/cache'
// #28 : logique métier pure extraite (testée dans tests/unit/matieres.test.js)
import {
  filterMatieres,
  groupMatieresByNiveau,
  computeMatieresStats
} from '@/utils/matieres'

/**
 * Couche données d'AdminMatieres (#G1 ≤300) : charge matières + structure
 * (filières/niveaux) depuis KLASSCI avec cache + rafraîchissement en arrière-plan,
 * dérive le filtrage, le regroupement par niveau et les statistiques (logique pure
 * importée de @/utils/matieres), et pilote l'ouverture/fermeture des modales
 * niveau/matière. La vue ne fait plus que câbler.
 */
export function useAdminMatieres() {
  // State
  const matieres = ref([])
  const filieres = ref([])
  const niveaux = ref([])
  const loading = ref(false)
  const error = ref(null)

  const filters = ref({
    search: '',
    filiere_id: '',
    niveau_id: ''
  })

  const showNiveauModal = ref(false)
  const selectedNiveau = ref(null)

  const showMatiereModal = ref(false)
  const selectedMatiere = ref(null)

  // Computeds délégués à la logique pure extraite (#28)
  const filteredMatieres = computed(() => filterMatieres(matieres.value, filters.value))

  const filteredNiveauxWithMatieres = computed(() =>
    groupMatieresByNiveau(filteredMatieres.value, niveaux.value)
  )

  const stats = computed(() => computeMatieresStats(matieres.value))

  // View niveau details (open modal)
  function viewNiveauDetails(niveauGroup) {
    selectedNiveau.value = niveauGroup
    showNiveauModal.value = true
  }

  // Close niveau modal
  function closeNiveauModal() {
    showNiveauModal.value = false
    selectedNiveau.value = null
  }

  // View matiere full details (optional)
  function viewMatiereDetails(matiere) {
    selectedMatiere.value = matiere
    showMatiereModal.value = true
  }

  // Close matiere modal
  function closeMatiereModal() {
    showMatiereModal.value = false
    selectedMatiere.value = null
  }

  // Load matieres
  async function loadMatieres() {
    // Try cache first
    const cached = readCache('admin_matieres')
    if (cached) {
      console.log('[CACHE] Matières admin chargées depuis le cache')
      matieres.value = cached.matieres
      filieres.value = cached.filieres
      niveaux.value = cached.niveaux
      loading.value = false
      refreshInBackground()
      return
    }

    loading.value = true
    error.value = null

    try {
      console.log('[ADMIN] Chargement de toutes les matières...')

      // Utiliser le nouvel endpoint admin qui enrichit les combinaisons
      const response = await klassciService.getAdminMatieres()

      if (!response.success) {
        throw new Error(response.message || 'Erreur lors du chargement des matières')
      }

      matieres.value = response.data.matieres || []

      // Récupérer aussi la structure pour les filtres
      const structureData = await klassciService.getStructure()
      filieres.value = structureData?.filieres || []
      niveaux.value = structureData?.niveaux_etude || structureData?.niveaux || []

      console.log('[ADMIN] Matières:', matieres.value.length)
      console.log('[ADMIN] Filières:', filieres.value.length)
      console.log('[ADMIN] Niveaux:', niveaux.value.length)

      // Save to cache
      writeCache('admin_matieres', {
        matieres: matieres.value,
        filieres: filieres.value,
        niveaux: niveaux.value
      })

      console.log('[OK] Matières admin chargées avec combinaisons complètes')
    } catch (err) {
      console.error('[ERREUR] Chargement matières admin:', err)
      error.value = 'Impossible de charger les matières. Veuillez réessayer.'
    } finally {
      loading.value = false
    }
  }

  // Refresh in background
  async function refreshInBackground() {
    try {
      console.log('[BACKGROUND] Rafraîchissement matières admin...')

      const [response, structureData] = await Promise.all([
        klassciService.getAdminMatieres(),
        klassciService.getStructure()
      ])

      if (response.success) {
        matieres.value = response.data.matieres || []
        filieres.value = structureData?.filieres || []
        niveaux.value = structureData?.niveaux_etude || structureData?.niveaux || []

        writeCache('admin_matieres', {
          matieres: matieres.value,
          filieres: filieres.value,
          niveaux: niveaux.value
        })

        console.log('[BACKGROUND] Rafraîchissement terminé')
      }
    } catch (error) {
      console.warn('[BACKGROUND] Erreur rafraîchissement:', error)
    }
  }

  // Refresh data manually
  function refreshData() {
    // #237 : invalide TOUTES les clés « matières » (admin_matieres,
    // admin_klassci_matieres, teacher_matieres) pour que les autres vues
    // (coordinateur, dashboard, enseignant) ne servent plus une version périmée.
    invalidateEntity('matieres')
    loadMatieres()
  }

  // Apply filters
  function applyFilters() {
    // Filters are applied via computed property
  }

  // Reset filters
  function resetFilters() {
    filters.value.search = ''
    filters.value.filiere_id = ''
    filters.value.niveau_id = ''
  }

  // Lifecycle
  onMounted(() => {
    loadMatieres()
  })

  return {
    matieres, filieres, niveaux, loading, error, filters,
    showNiveauModal, selectedNiveau, showMatiereModal, selectedMatiere,
    filteredMatieres, filteredNiveauxWithMatieres, stats,
    viewNiveauDetails, closeNiveauModal, viewMatiereDetails, closeMatiereModal,
    loadMatieres, refreshData, applyFilters, resetFilters,
  }
}
