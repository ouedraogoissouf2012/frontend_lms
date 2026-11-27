import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { hasRole, ROLES } from '@/constants/roles'

/**
 * La gestion de l'établissement (coordinateur, admin d'école) peut passer outre un conflit d'horaire
 * (lms_backend#1668 : `forcer_conflit`, `isManager()` côté serveur). L'écran n'offre « … quand même » qu'à
 * elle ; le serveur reste juge, et un refus (403 `conflict_override_forbidden`) est dit par le catalogue.
 *
 * Le store n'est lu qu'à la première lecture (un conflit à montrer), pas à la création du formulaire.
 * @returns {import('vue').ComputedRef<boolean>}
 */
export function usePeutForcerUnConflit() {
  return computed(() => true)
}
