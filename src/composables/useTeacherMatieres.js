import { ref, onMounted } from 'vue'
import { toast } from '@/composables/useToast'
import { useRouter } from 'vue-router'
import lmsService from '@/services/lms'
import { normalizeError } from '@/services/errorHandler'
import { estPannePassagere } from '@/utils/pannePassagere'

/**
 * Couche donnees de TeacherMatieres (#H9 ≤300). Charge les matieres de
 * l enseignant et gere la navigation vers le detail. La vue ne fait que cabler.
 */
export function useTeacherMatieres() {
  const router = useRouter()
  const loading = ref(false)
  const error = ref(null)
  // Un nouvel essai seulement sur une panne passagère (5xx, 429, réseau) : un refus définitif ne se
  // lève pas en réessayant.
  const canRetry = ref(true)
  const matieres = ref([])

  async function loadMatieres() {
    loading.value = true
    error.value = null
    canRetry.value = true

    try {
      console.log('[TeacherMatieres] Chargement des matières...')
      // #296 : getMyMatieres renvoie désormais un tableau normalisé à la frontière
      // (plus de dé-wrap ni de garde `.success` côté composable).
      matieres.value = await lmsService.getMyMatieres()
      console.log('[TeacherMatieres] Matières chargées:', matieres.value.length)
    } catch (err) {
      console.error('[TeacherMatieres] Erreur:', err)
      error.value = err.userMessage ?? normalizeError(err).userMessage
      canRetry.value = estPannePassagere(err)
    } finally {
      loading.value = false
    }
  }

  function navigateToMatiere(matiere) {
    console.log('[TeacherMatieres] Structure matière:', matiere)

    // Essayer différentes propriétés pour l'ID
    const matiereId = matiere.matiere_id || matiere.id || matiere.matiere?.id

    if (matiereId) {
      console.log('[TeacherMatieres] Navigation vers matière:', matiereId)
      router.push({
        name: 'matiere-details',
        params: { id: matiereId }
      })
    } else {
      console.error('[TeacherMatieres] ID matière non trouvé:', matiere)
      // Erreur de NAVIGATION, pas de chargement : un toast, et la liste reste à l'écran (revue de
      // #519 : remplacer la grille par une erreur sans bouton était une impasse).
      toast.error('Impossible de naviguer vers cette matière')
    }
  }

  onMounted(() => {
    loadMatieres()
  })

  return { loading, error, canRetry, matieres, loadMatieres, navigateToMatiere }
}
