import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import lmsService from '@/services/lms'

/**
 * Couche donnees de TeacherMatieres (#H9 ≤300). Charge les matieres de
 * l enseignant et gere la navigation vers le detail. La vue ne fait que cabler.
 */
export function useTeacherMatieres() {
  const router = useRouter()
  const loading = ref(false)
  const error = ref(null)
  const matieres = ref([])

  async function loadMatieres() {
    loading.value = true
    error.value = null

    try {
      console.log('[TeacherMatieres] Chargement des matières...')
      // #296 : getMyMatieres renvoie désormais un tableau normalisé à la frontière
      // (plus de dé-wrap ni de garde `.success` côté composable).
      matieres.value = await lmsService.getMyMatieres()
      console.log('[TeacherMatieres] Matières chargées:', matieres.value.length)
    } catch (err) {
      console.error('[TeacherMatieres] Erreur:', err)
      error.value = 'Impossible de charger les matières'
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
      error.value = 'Impossible de naviguer vers cette matière'
    }
  }

  onMounted(() => {
    loadMatieres()
  })

  return { loading, error, matieres, loadMatieres, navigateToMatiere }
}
