import { ref, computed, onMounted } from 'vue'
import { auth, teacherStats } from '@/services/api'
import { getInitials } from '@/utils/formatters'

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

  // `getInitials` est polymorphe : il accepte `{name}` — la forme RÉELLE du
  // payload de login, dont la whitelist est fermée (#504) — autant que
  // `{prenom, nom}`. L'ancien calcul ne lisait que les champs séparés, absents
  // de la réponse : il rendait `''`, et le repli `'?'` ne s'appliquait pas
  // (il est conditionné à l'absence de `user`). Une pastille d'avatar VIDE.
  // Même correctif que useAdminProfile, qui l'avait déjà reçu.
  const userInitials = computed(() => getInitials(user.value))

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

  // « Membre depuis » a été RETIRÉ : aucune source ne peut l'alimenter.
  //
  // `user` vient de `auth.getUser()`, dont l'unique écrivain est
  // `stores/auth.js` au retour du login. Or la charge de login ne porte pas de
  // date — mesuré le 2026-09-11 sur le compte enseignant réel, les deux
  // branches du présentateur confondues :
  //   {id, klassci_id, name, email, role, role_display_name, avatar,
  //    enseignant_data, etudiant_data}
  // et `GET /auth/me` rend `klassci_data: []`, vide.
  //
  // La ligne affichait donc « Non disponible » en permanence, et le test qui la
  // couvrait fabriquait un `created_at` que l'API n'envoie jamais : vert sur du
  // code mort. Exposer `users.created_at` serait possible côté LMS, mais pour un
  // compte MIROITÉ cette date mesure la première synchro, pas l'ancienneté dans
  // l'établissement — l'afficher inventerait une information.
  // Le besoin produit, s'il existe, est suivi hors de ce fichier.

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
    userInitials, roleLabel,
    getRoleLabel, formatDate, loadStats,
  }
}
