import { ref, computed, onMounted } from 'vue'
import { auth } from '@/services/api'

const ROLE_LABELS = {
  etudiant: 'Étudiant',
  student: 'Étudiant',
  enseignant: 'Enseignant',
  teacher: 'Enseignant',
  coordinateur: 'Coordinateur',
  superAdmin: 'Super Administrateur',
  admin: 'Administrateur',
}

/**
 * Couche données d'AdminProfile (#H3 ≤300) : expose l'utilisateur courant
 * (auth.getUser), ses initiales, le libellé de rôle, la date d'inscription
 * formatée et les statistiques système. La vue ne fait plus que câbler ces
 * éléments aux sous-composants présentationnels.
 *
 * Dette pré-existante conservée à l'identique : `loadStats` est un stub
 * (TODO API) renvoyant des valeurs fictives — comportement inchangé.
 */
export function useAdminProfile() {
  const user = ref(null)
  const stats = ref({
    enseignants: 0,
    etudiants: 0,
    classes: 0,
    matieres: 0,
  })

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
      day: 'numeric',
    })
  }

  const roleLabel = computed(() => getRoleLabel(user.value?.role))
  const memberSince = computed(() => formatDate(user.value?.created_at))

  async function loadStats() {
    // TODO: Charger les statistiques depuis l'API
    // Pour l'instant, valeurs fictives
    stats.value = {
      enseignants: 25,
      etudiants: 350,
      classes: 15,
      matieres: 30,
    }
  }

  onMounted(() => {
    user.value = auth.getUser()
    loadStats()
  })

  return {
    user, stats,
    userInitials, roleLabel, memberSince,
    getRoleLabel, formatDate, loadStats,
  }
}
