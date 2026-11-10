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
  if (role === 'supradmin' && ferme) return route.plateforme === true
  if (route.roles) return route.roles.includes(role)
  return true // authentifié sans restriction de rôle, ou public
}

/** Routeur ouvert : la case du supradmin est SANS OBJET sans visite (le serveur refuse, D56). */
export function sansObjetSansVisite(route, role, ferme) {
  return !ferme && role === 'supradmin' && Array.isArray(route.roles) && !route.roles.includes('supradmin')
}

/** Routeur fermé : le refus vu d'un écran d'école est SANS OBJET pour le supradmin, pas un vert. */
export const refusD56 = (route, role, ferme) => ferme && role === 'supradmin' && route.plateforme !== true
