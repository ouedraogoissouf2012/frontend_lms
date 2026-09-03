import { ref, computed } from 'vue'
import { klassciService } from '@/services/klassci'
import { invalidateEntity } from '@/services/cache'
import { useCachedResource } from '@/composables/useCachedResource'
// #28 : logique métier pure extraite (testée dans tests/unit/matieres.test.js)
import {
  filterMatieres,
  groupMatieresByNiveau,
  computeMatieresStats
} from '@/utils/matieres'

/**
 * Récupère les matières (endpoint admin enrichi = combinaisons complètes) et la
 * structure (filières/niveaux), en parallèle. Rejette si l'endpoint matières
 * répond `success:false` — c'est alors `useCachedResource` qui conserve
 * l'affichage en cache et renseigne `error`.
 * @returns {Promise<{matieres: Array, filieres: Array, niveaux: Array}>}
 */
async function fetchMatieres() {
  const [response, structure] = await Promise.all([
    klassciService.getAdminMatieres(),
    klassciService.getStructure(),
  ])
  if (!response?.success) {
    throw new Error(response?.message || 'Erreur lors du chargement des matières')
  }
  return {
    matieres: response.data?.matieres || [],
    filieres: structure?.filieres || [],
    niveaux: structure?.niveaux_etude || structure?.niveaux || [],
  }
}

/**
 * Couche données d'AdminMatieres (#G1 ≤300). Le schéma cache + revalidation
 * d'arrière-plan est désormais centralisé par `useCachedResource` (#224) : plus
 * de duplication du « lire-le-cache-puis-rafraîchir ». Dérive le filtrage, le
 * regroupement par niveau et les statistiques (logique pure @/utils/matieres),
 * et pilote les modales niveau/matière.
 */
export function useAdminMatieres() {
  const showNiveauModal = ref(false)
  const selectedNiveau = ref(null)
  const showMatiereModal = ref(false)
  const selectedMatiere = ref(null)

  const filters = ref({
    search: '',
    filiere_id: '',
    niveau_id: ''
  })

  const { data, loading, error, refresh } = useCachedResource('admin_matieres', fetchMatieres)

  const matieres = computed(() => data.value?.matieres ?? [])
  const filieres = computed(() => data.value?.filieres ?? [])
  const niveaux = computed(() => data.value?.niveaux ?? [])

  // Dérivés délégués à la logique pure extraite (#28)
  const filteredMatieres = computed(() => filterMatieres(matieres.value, filters.value))
  const filteredNiveauxWithMatieres = computed(() =>
    groupMatieresByNiveau(filteredMatieres.value, niveaux.value)
  )
  const stats = computed(() => computeMatieresStats(matieres.value))

  function viewNiveauDetails(niveauGroup) {
    selectedNiveau.value = niveauGroup
    showNiveauModal.value = true
  }

  function closeNiveauModal() {
    showNiveauModal.value = false
    selectedNiveau.value = null
  }

  function viewMatiereDetails(matiere) {
    selectedMatiere.value = matiere
    showMatiereModal.value = true
  }

  function closeMatiereModal() {
    showMatiereModal.value = false
    selectedMatiere.value = null
  }

  function loadMatieres(forceReload = false) {
    if (forceReload) invalidateEntity('matieres')
    return refresh()
  }

  /**
   * Rafraîchissement manuel. #237 : invalide TOUTES les clés « matières »
   * (admin_matieres, admin_klassci_matieres, teacher_matieres) pour que les
   * autres vues (coordinateur, dashboard, enseignant) ne servent plus une
   * version périmée, puis revalide.
   */
  function refreshData() {
    invalidateEntity('matieres')
    return refresh()
  }

  function applyFilters() {
    // Les filtres sont réactifs : filteredMatieres se recalcule seul.
  }

  function resetFilters() {
    filters.value.search = ''
    filters.value.filiere_id = ''
    filters.value.niveau_id = ''
  }

  return {
    matieres, filieres, niveaux, loading, error, filters,
    showNiveauModal, selectedNiveau, showMatiereModal, selectedMatiere,
    filteredMatieres, filteredNiveauxWithMatieres, stats,
    viewNiveauDetails, closeNiveauModal, viewMatiereDetails, closeMatiereModal,
    loadMatieres, refreshData, applyFilters, resetFilters,
  }
}
