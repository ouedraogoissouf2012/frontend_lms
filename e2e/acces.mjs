// Qui doit ouvrir quel écran : la règle du routeur MESURÉ, lue dans ses routes extraites.
//
// Le supradmin (plateforme, sans établissement) ne voit aucun contenu d'école (D56). Deux routeurs
// peuvent être mesurés :
//  - fermé (D126, #510) : ses routes portent `plateforme`. Le supradmin n'ouvre QUE celles-là ; sur
//    toute autre route, le routeur doit le renvoyer vers son espace. La case est SANS OBJET (D56),
//    mais seulement après avoir VU ce refus : sinon elle est rouge.
//  - ouvert (avant #510) : aucune route ne porte `plateforme`, le garde le laisse passer partout et
//    c'est le SERVEUR qui refuse. Un écran d'école qui ne le nomme pas dans ses rôles est SANS OBJET
//    sans visite, comme avant.

/** Le routeur mesuré ferme-t-il les écrans d'école au supradmin (marquage `plateforme`) ? */
export const routeurFerme = (routes) => routes.some((r) => r.plateforme === true)

/**
 * L'écran doit-il s'ouvrir pour ce rôle ? `null` : hors matrice (écran d'invité).
 * @returns {boolean|null}
 */
export function ouverte(route, role, ferme) {
  if (route.invite) return null
  // Seules les routes AUTHENTIFIÉES lui sont fermées : une route publique (lien d'activation, #409)
  // ne demande ni session ni rôle, le garde n'y juge rien.
  if (role === 'supradmin' && ferme && route.authentifie) return route.plateforme === true
  if (route.roles) return route.roles.includes(role)
  return true // authentifié sans restriction de rôle, ou public
}

/** Routeur ouvert : la case du supradmin est SANS OBJET sans visite (le serveur refuse, D56). */
export function sansObjetSansVisite(route, role, ferme) {
  return !ferme && role === 'supradmin' && Array.isArray(route.roles) && !route.roles.includes('supradmin')
}

/**
 * Refus MÉTIER du serveur sur un écran que le routeur ouvre (décision de la superviseure, 14/11) : la
 * case attend le refus (son statut HTTP vu pendant la visite), pas l'écran.
 */
export const REFUS_SERVEUR = Object.freeze([
  { chemin: '/coordinateur/evaluations/:id/preview', role: 'coordinateur', statut: 403,
    regle: 'un coordinateur ne prévisualise que les évaluations terminées (TeacherEvaluationViewService::preview:140-147)' },
])
export const refusServeur = (route, role) => REFUS_SERVEUR.find((r) => r.chemin === route.chemin && r.role === role) ?? null

/** Routeur fermé : le refus vu d'un écran d'école est SANS OBJET pour le supradmin, pas un vert. */
export const refusD56 = (route, role, ferme) => ferme && role === 'supradmin' && route.authentifie && route.plateforme !== true

/**
 * D607 : le verdict d'un écran gardé par une CAPACITÉ que l'école DÉCLARE (`jeu.capacites`). Une capacité absente
 * par conception du produit (l'inscription locale dans une école KLASSCI) rend un refus TENU, compté VERT ; un écran
 * qui s'ouvre malgré elle est ROUGE. Sans déclaration, ou capacité accordée et écran ouvert : null, la règle du
 * parcours s'applique.
 * @param {{ capacite?: string }} route
 * @param {Record<string, boolean> | undefined} capacites - les capacités déclarées de l'école
 * @param {boolean} ouvert - l'écran visé s'est-il ouvert ?
 * @param {string} arrivee - le chemin d'arrivée
 * @returns {{ verdict: string, attendu: string, defaut: string } | null}
 */
export function verdictCapacite(route, capacites, ouvert, arrivee) {
  const attendue = route.capacite ? capacites?.[route.capacite] : undefined
  if (attendue === false) {
    return ouvert
      ? { verdict: 'ROUGE', attendu: 'refusé', defaut: `refus NON tenu : capacité « ${route.capacite} » absente dans cette école, l’écran s’est pourtant ouvert` }
      : { verdict: 'VERT', attendu: 'refusé', defaut: `refus tenu : capacité « ${route.capacite} » absente dans cette école, comme le veut le produit (renvoyé vers ${arrivee})` }
  }
  if (attendue === true && !ouvert) {
    return { verdict: 'ROUGE', attendu: 'ouvert', defaut: `capacité « ${route.capacite} » attendue, mais l’écran est refusé (renvoyé vers ${arrivee})` }
  }
  return null
}

// D625 (D57) : l'élève INACTIF n'a aucun accès, décision du user. Ses écrans qui disent ce refus sont des refus
// ATTENDUS : VERT « refus tenu » quand l'écran le dit, ROUGE sinon. Par COMPTE, l'élève inactif partageant son rôle.
const ECRANS_SANS_ACCES_INACTIF = ['/student/dashboard', '/student/lessons/:id', '/lessons/:id', '/matieres/:id', '/classes/:id', '/classes/local/:id', '/seances/:id']
export const REFUS_ATTENDUS = Object.freeze(ECRANS_SANS_ACCES_INACTIF.map((chemin) => Object.freeze({ compte: 'etudiant_inactif', chemin, regle: 'D57 : élève inactif sans accès' })))
export const refusAttendu = (compte, route) => REFUS_ATTENDUS.find((r) => r.compte === compte && r.chemin === route.chemin) ?? null

/** D625 : un écran sans sujet dans cette école (une classe LOCALE dans une école KLASSCI) : son motif, ou null. */
export function nonApplicable(route, jeu) {
  return jeu?.ecole === 'klassci' && /\/local\//.test(route.chemin) ? 'aucune classe locale dans une école KLASSCI' : null
}
