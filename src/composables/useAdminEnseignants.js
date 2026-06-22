import { ref, computed, onMounted } from 'vue'
import klassciService from '@/services/klassci'
import { readCache, writeCache, clearCache } from '@/services/cache'
// #28 : logique métier pure extraite (testée dans tests/unit/enseignants.test.js)
import { computeEnseignantsStats } from '@/utils/enseignants'

/**
 * Couche données d'AdminEnseignants (#G1 ≤300) : charge les enseignants KLASSCI
 * (endpoint enrichi avec fallback simple), gère cache + rafraîchissement en
 * arrière-plan, expose les statistiques agrégées et la sélection pour la modale.
 * La vue ne fait plus que câbler ces valeurs à ses sous-composants.
 */
export function useAdminEnseignants() {
  const enseignants = ref([])
  const loading = ref(true)
  const error = ref(null)
  const selectedEnseignant = ref(null)

  // Computed stats — délégués à la logique pure extraite (#28)
  const stats = computed(() => computeEnseignantsStats(enseignants.value))
  const totalMatieres = computed(() => stats.value.totalMatieres)
  const totalClasses = computed(() => stats.value.totalClasses)
  const enseignantsActifs = computed(() => stats.value.actifs)

  // Load enseignants from API
  async function loadEnseignants(forceReload = false) {
    try {
      loading.value = true
      error.value = null

      // Si force reload, ignorer le cache
      if (forceReload) {
        console.log('🔄 Force reload demandé, vidage du cache...')
        clearCache('admin_enseignants')
      } else {
        // Check cache first
        const cached = readCache('admin_enseignants')
        if (cached) {
          const cacheHasData = cached && cached.length > 0
          const cacheHasDetails = cacheHasData && (cached.some(e => e.matieres?.length > 0 || e.classes?.length > 0))

          if (cacheHasData) {
            console.log('fa-check-circle Loaded enseignants from cache')
            enseignants.value = cached
            loading.value = false

            // Si le cache n'a pas de détails, forcer un refresh en background
            if (!cacheHasDetails) {
              console.log('fa-exclamation-triangle️ Cache sans détails, refresh en background forcé')
            }

            // Refresh in background
            refreshInBackground()
            return
          } else if (!cacheHasData) {
            console.log('📭 Cache vide, rechargement...')
          }
        }
      }

      // Load from API avec détails enrichis
      console.log('🔄 Loading enseignants from API (with details)...')

      try {
        const response = await klassciService.getLmsEnseignants({
          with_details: true
        })

        console.log('fa-bar-chart API Response:', response)

        // Process data
        if (response.success) {
          enseignants.value = Array.isArray(response.data) ? response.data : []
          console.log(`fa-check-circle Loaded ${enseignants.value.length} enseignants with full details`)
          console.log('fa-clipboard Sample enseignant:', enseignants.value[0])
        } else {
          // Fallback vers l'endpoint simple si l'enrichi retourne success=false
          console.warn('fa-exclamation-triangle️ Endpoint enrichi retourne success=false, utilisation endpoint simple')
          const fallbackData = await klassciService.getEnseignants()
          enseignants.value = Array.isArray(fallbackData) ? fallbackData : []
          console.log(`fa-check-circle Loaded ${enseignants.value.length} enseignants (format simple)`)
        }
      } catch (apiErr) {
        // Si erreur API (503, etc.), utiliser endpoint simple
        console.warn('fa-exclamation-triangle️ Endpoint enrichi en erreur, fallback vers endpoint simple:', apiErr.message)
        const fallbackData = await klassciService.getEnseignants()
        enseignants.value = Array.isArray(fallbackData) ? fallbackData : []
        console.log(`fa-check-circle Loaded ${enseignants.value.length} enseignants via fallback (format simple)`)
      }

      // Update cache
      writeCache('admin_enseignants', enseignants.value)

      loading.value = false
    } catch (err) {
      console.error('fa-times-circle Error loading enseignants (all methods failed):', err)
      error.value = err.message || 'Erreur lors du chargement des enseignants'
      loading.value = false
    }
  }

  // Refresh in background
  async function refreshInBackground() {
    console.log('🔄 Background refresh started...')
    try {
      const response = await klassciService.getLmsEnseignants({
        with_details: true
      })

      console.log('fa-bar-chart Background refresh - API response received:', response)
      console.log('fa-bar-chart response.success:', response.success)
      console.log('fa-bar-chart response.data:', response.data)

      if (response.success && response.data && Array.isArray(response.data)) {
        enseignants.value = response.data
        console.log(`fa-check-circle Background refresh completed (enriched data) - ${enseignants.value.length} enseignants`)
      } else {
        // Fallback si réponse sans succès
        console.warn('fa-exclamation-triangle️ Endpoint enrichi retourne success=false ou pas de données, fallback vers endpoint simple')
        console.log('🔄 Calling fallback endpoint...')
        const fallbackData = await klassciService.getEnseignants()
        console.log('fa-bar-chart Fallback data received:', fallbackData)
        enseignants.value = Array.isArray(fallbackData) ? fallbackData : []
        console.log(`fa-check-circle Background refresh completed (simple data) - ${enseignants.value.length} enseignants`)
      }

      // Update cache
      writeCache('admin_enseignants', enseignants.value)
      console.log('fa-save Cache updated with', enseignants.value.length, 'enseignants')
    } catch (err) {
      // Si erreur (503, etc.), utiliser endpoint simple
      console.warn('fa-exclamation-triangle️ Endpoint enrichi en erreur, fallback vers endpoint simple:', err.message)
      console.error('fa-times-circle Full error:', err)
      try {
        console.log('🔄 Calling fallback endpoint after error...')
        const fallbackData = await klassciService.getEnseignants()
        console.log('fa-bar-chart Fallback data after error:', fallbackData)
        enseignants.value = Array.isArray(fallbackData) ? fallbackData : []

        // Update cache avec données simple
        writeCache('admin_enseignants', enseignants.value)

        console.log(`fa-check-circle Background refresh completed with fallback (simple data) - ${enseignants.value.length} enseignants`)
      } catch (fallbackErr) {
        console.error('fa-times-circle Fallback failed:', fallbackErr)
      }
    }
  }

  // Select enseignant
  function selectEnseignant(enseignant) {
    selectedEnseignant.value = enseignant
  }

  // Close modal
  function closeModal() {
    selectedEnseignant.value = null
  }

  // Load on mount
  onMounted(() => {
    loadEnseignants()
  })

  return {
    enseignants, loading, error, selectedEnseignant,
    totalMatieres, totalClasses, enseignantsActifs,
    loadEnseignants, selectEnseignant, closeModal,
  }
}
