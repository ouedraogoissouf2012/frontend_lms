import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

/**
 * Résout l'identifiant calendrier **avant** la vue (#330).
 * La vue reçoit un id déjà choisi ; elle ignore klassci_*.
 */
export function useScheduleActorId(role) {
  const currentUser = computed(() => useAuthStore().currentUser)

  const actorId = computed(() => {
    const user = currentUser.value
    if (!user) return null
    if (role === 'student') return user.klassci_etudiant_id ?? user.id ?? null
    return user.klassci_id ?? user.id ?? null
  })

  return { currentUser, actorId }
}
