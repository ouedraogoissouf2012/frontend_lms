import { ref, computed } from 'vue'
import { cacheKey } from '@/services/cache'
import { VISIO_MODES } from '@/constants/visioNetwork'

/**
 * Point de décision UNIQUE du profil réseau (#328).
 *
 * ## Pourquoi il est seul
 *
 * L'épique #325 (article 1) impose qu'une préoccupation se résolve à un seul
 * endroit. Si chaque composant média lisait `navigator.connection` de son côté,
 * on obtiendrait des décisions divergentes sur la même page — et aucun moyen de
 * les tester ensemble.
 *
 * ## Pourquoi lire `navigator.connection` est défendable ici
 *
 * L'API n'est pas standard, mais Chrome représente 87,17 % du parc mobile
 * burkinabè : l'objection habituelle ne tient pas sur cette cible. Un repli
 * couvre les autres navigateurs — l'absence de l'API n'est pas une panne, c'est
 * simplement « on ne sait pas », et on ne sait pas prudemment.
 *
 * ## Ce que le composable ne fait PAS
 *
 * Il ne lit **jamais** le mode d'établissement (articles 1 et 2 de l'épique).
 * Le profil réseau est une propriété de la connexion de l'apprenant, pas de la
 * configuration du tenant.
 */

/** Nom logique de la préférence — la clé réelle est scopée plus bas. */
const PREFERENCE = 'visio_mode_reseau'

/**
 * Clé de stockage, scopée par institution ET par utilisateur.
 *
 * On réutilise `cacheKey` plutôt que d'inventer un second schéma : son docblock
 * documente précisément le risque qu'on veut éviter ici aussi — sur un poste
 * partagé, l'élève A ferme l'onglet sans se déconnecter et l'élève B lit ses
 * données. Un mode réseau n'est pas sensible, mais deux schémas de clés qui
 * divergent finissent toujours par diverger au mauvais endroit.
 */
function cle() {
  return cacheKey(PREFERENCE)
}

function lireConnexion() {
  const c = typeof navigator !== 'undefined' ? navigator.connection : null
  return {
    effectiveType: c?.effectiveType ?? null,
    saveData: c?.saveData === true,
    enLigne: typeof navigator !== 'undefined' ? navigator.onLine !== false : true,
  }
}

/**
 * Mode suggéré par la connexion observée.
 *
 * `saveData` prime sur tout : l'utilisateur a explicitement demandé à son
 * navigateur d'économiser. Ne pas l'honorer serait passer outre une préférence
 * déjà exprimée.
 */
export function modeSuggere(connexion = lireConnexion()) {
  if (connexion.saveData) return VISIO_MODES.AUDIO
  if (connexion.effectiveType === 'slow-2g' || connexion.effectiveType === '2g') {
    return VISIO_MODES.AUDIO
  }
  if (connexion.effectiveType === '3g') return VISIO_MODES.ECONOME
  // `4g` ou API absente : on ne force rien, l'utilisateur choisit.
  return VISIO_MODES.ECONOME
}

export function useNetworkProfile() {
  const connexion = ref(lireConnexion())
  const suggere = computed(() => modeSuggere(connexion.value))

  /**
   * Mode retenu : la préférence enregistrée si elle existe, sinon la suggestion.
   *
   * Une préférence illisible ou inconnue ne bloque pas l'entrée en salle : on
   * retombe sur la suggestion. Un stockage corrompu ne doit jamais empêcher un
   * apprenant de suivre son cours.
   */
  function lirePreference() {
    try {
      const valeur = localStorage.getItem(cle())
      return Object.values(VISIO_MODES).includes(valeur) ? valeur : null
    } catch {
      return null
    }
  }

  const choisi = ref(lirePreference() ?? suggere.value)

  function choisir(mode) {
    if (!Object.values(VISIO_MODES).includes(mode)) return
    choisi.value = mode
    try {
      localStorage.setItem(cle(), mode)
    } catch {
      // Stockage indisponible (navigation privée, quota) : le choix vaut pour
      // la session en cours. Il ne sera simplement pas mémorisé.
    }
  }

  function rafraichir() {
    connexion.value = lireConnexion()
  }

  return { connexion, suggere, choisi, choisir, rafraichir }
}
