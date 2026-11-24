import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

/**
 * Ce que l'agenda sait du compte (#626, qui remplace `useScheduleActorId`, #330) : s'il est CONNECTÉ, rien de plus.
 *
 * L'ancien « id d'acteur » n'était jamais envoyé au serveur : `useCalendarEvents` n'en lisait que la vérité (les
 * évaluations de l'élève connecté se lisent par son jeton, anti-IDOR). Il lisait pourtant `klassci_etudiant_id`, une
 * clé qu'aucune charge n'envoie, et mêlait un id KLASSCI et un id local sous le même nom. Un booléen dit exactement
 * ce qui sert, sans espace d'id à choisir.
 */
export function useScheduleConnexion() {
  const currentUser = computed(() => useAuthStore().currentUser)
  const connecte = computed(() => Boolean(currentUser.value))
  return { currentUser, connecte }
}
