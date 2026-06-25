import { ref, computed, onMounted } from 'vue'
import { auth, teacherStats } from '@/services/api'

const ROLE_LABELS = {
  'etudiant': 'Étudiant',
  'student': 'Étudiant',
  'enseignant': 'Enseignant',
  'teacher': 'Enseignant',
  'coordinateur': 'Coordinateur',
  'admin': 'Administrateur'
}

/**
 * Couche données du profil enseignant (#H11 ≤300) : utilisateur courant +
 * statistiques (teacherStats), avec les dérivés présentés (initiales, libellé
 * de rôle, date d'inscription). La vue ne fait plus que câbler.
 */
export function useTeacherProfile() {
  const user = ref(null)
  const stats = ref({
    matieres: 0,
    classes: 0,
    evaluations: 0,
    lessons: 0
  })
  const isLoadingStats = ref(false)

  const userInitials = computed(() => {
    if (!user.value) return '?'
    const nom = user.value.nom || ''
    const prenom = user.value.prenom || ''
    return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase()
  })

  function getRoleLabel(role) {
    return ROLE_LABELS[role] || role
  }

  function formatDate(date) {
    if (!date) return 'Non disponible'
    const d = new Date(date)
    return d.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const roleLabel = computed(() => getRoleLabel(user.value?.role))
  const memberSince = computed(() => formatDate(user.value?.created_at))

  async function loadStats() {
    try {
      isLoadingStats.value = true
      const data = await teacherStats.getStats()
      stats.value = data
    } catch (error) {
      console.error('Erreur chargement statistiques:', error)
      // Garder les valeurs par défaut (0) en cas d'erreur
    } finally {
      isLoadingStats.value = false
    }
  }

  onMounted(() => {
    user.value = auth.getUser()
    loadStats()
  })

  return {
    user, stats, isLoadingStats,
    userInitials, roleLabel, memberSince,
    getRoleLabel, formatDate, loadStats,
  }
}
