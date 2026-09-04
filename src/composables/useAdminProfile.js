import { ref, computed, onMounted } from 'vue'
import { auth } from '@/services/api'
import { klassciService } from '@/services/klassci'
import { logError } from '@/services/errorHandler'
import { getRoleDisplayName } from '@/constants/roles'
import { deriveInstitutionCounters } from '@/utils/classStats'
import { getInitials, formatDateLong } from '@/utils/formatters'

/**
 * Couche données d'AdminProfile (#H3 ≤300) : expose l'utilisateur courant
 * (auth.getUser), ses initiales, le libellé de rôle, la date d'inscription
 * formatée et les statistiques système. La vue ne fait plus que câbler ces
 * éléments aux sous-composants présentationnels.
 *
 * Deux défauts corrigés :
 *  - Les statistiques lisaient `auth.getUser().admin_data.statistics`, champ
 *    ABSENT de la réponse de login : le repli `?? 0` s'appliquait donc toujours
 *    et l'écran affichait quatre zéros. Elles sont désormais dérivées des mêmes
 *    données KLASSCI que le tableau de bord, via une dérivation partagée ; une
 *    source en échec vaut `null` (« non mesuré »), jamais 0.
 *  - Le libellé de rôle venait d'une table locale où `superAdmin` valait
 *    « Super Administrateur », promouvant l'admin d'ÉTABLISSEMENT au rang de
 *    gestionnaire de plateforme (#659). Il passe par `constants/roles.js`.
 */
export function useAdminProfile() {
  const user = ref(null)
  // `null` = non mesuré (aucun chargement abouti), à distinguer d'un vrai zéro.
  const stats = ref({
    enseignants: null,
    etudiants: null,
    classes: null,
    matieres: null,
  })

  // getInitials est polymorphe : il accepte `{name}` (forme réelle du payload de
  // login) autant que `{prenom, nom}`. L'ancien calcul ne lisait que les champs
  // séparés, absents de la réponse, et rendait donc des initiales vides.
  const userInitials = computed(() => getInitials(user.value))

  /** Libellé d'affichage du rôle NORMALISÉ (rôle inconnu → '' : pas de fuite brute). */
  function getRoleLabel(role) {
    return getRoleDisplayName(role)
  }

  // #283 : délègue au formatter canonique (repli local conservé).
  function formatDate(date) {
    return formatDateLong(date, { fallback: 'Non disponible' })
  }

  const roleLabel = computed(() => getRoleLabel(user.value?.role))
  const memberSince = computed(() => formatDate(user.value?.created_at))

  /** Résout une promesse en tolérant l'échec : `null` + journalisation sûre. */
  async function settle(promise, label) {
    try {
      return await promise
    } catch (error) {
      logError(error, `[useAdminProfile] ${label}`)
      return null
    }
  }

  /** Charge les compteurs d'établissement depuis KLASSCI (source du dashboard). */
  async function loadStats() {
    const [classes, matieres, enseignants] = await Promise.all([
      settle(klassciService.getClasses(), 'classes'),
      settle(klassciService.getMatieres(), 'matieres'),
      settle(klassciService.getEnseignants(), 'enseignants'),
    ])

    const counters = deriveInstitutionCounters({ classes, matieres, enseignants })
    stats.value = {
      enseignants: counters.nb_enseignants,
      etudiants: counters.nb_etudiants,
      classes: counters.nb_classes_actives,
      matieres: counters.nb_matieres_actives,
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
