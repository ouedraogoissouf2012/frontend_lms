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
