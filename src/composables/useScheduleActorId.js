import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { isStudent } from '@/constants/roles'

/**
 * Résout l'identifiant calendrier **avant** la vue (#330).
 * La vue reçoit un id déjà choisi ; elle ignore klassci_*.
 */
export function useScheduleActorId() {
  const currentUser = computed(() => useAuthStore().currentUser)

  const actorId = computed(() => {
    const user = currentUser.value
    if (!user) return null
    // DETTE TRACÉE — `klassci_etudiant_id` n'existe dans AUCUNE charge.
    //
    // Mesuré le 2026-09-11 sur le compte enseignant réel, les deux branches du
    // présentateur de login confondues, la clé n'y est pas ; le repli `user.id`
    // fait donc tout le travail et la distinction étudiant/enseignant est
    // aujourd'hui sans effet.
    //
    // La réparer demande de savoir ce que le calendrier KLASSCI attend pour un
    // étudiant : l'id de l'UTILISATEUR (`klassci_id`, présent) ou celui de
    // l'entité étudiant, qui vivrait dans `etudiant_data` — bloc exposé par le
    // présentateur mais qui vaut `null` pour un enseignant. Sa forme n'a jamais
    // pu être mesurée : aucun compte étudiant de test n'est disponible.
    //
    // On ne devine donc pas. Cette ligne reste gelée dans
    // `.cles-inexistantes-baseline.json` — seule entrée restante — jusqu'à ce
    // qu'une capture avec un jeton étudiant tranche.
    if (isStudent(user)) return user.klassci_etudiant_id ?? user.id ?? null
    return user.klassci_id ?? user.id ?? null
  })

  return { currentUser, actorId }
}
