import { safeUrl, stripControlChars } from './safeUrl'

/**
 * Cible d'un lien de notification (`action_url`), décidée AVANT toute navigation.
 *
 * Le schéma passe par `safeUrl`, la garde commune à tous les liens : il n'y a pas
 * de seconde liste ici. Mais `safeUrl` ne dit pas si un lien est INTERNE : il
 * accepte et résout des formes relatives qui sortent de l'origine courante
 * (`//hôte`, `/\hôte`, `\\hôte`, `\/hôte` → `https://hôte/`). D'où la règle :
 *
 *  - même origine après résolution → `internal` : le chemin (pour le routeur)
 *    ET le `href` résolu, absolu (pour un nouvel onglet). Un nouvel onglet ne
 *    reçoit jamais le chemin seul : relu par le navigateur, un chemin qui
 *    commence par `//` désigne une autre origine. Un tel chemin est refusé ;
 *  - forme relative qui quitte l'origine → `none` ;
 *  - URL absolue acceptée par `safeUrl` → `external`, toujours avec le `href`
 *    RÉSOLU, jamais la chaîne brute ;
 *  - tout le reste → `none`.
 *
 * La restriction des schémas propre aux notifications (chemin relatif ou https)
 * vit dans la validation serveur ; ce module ne la duplique pas.
 *
 * L'origine comparée est celle de la page, la même que `safeUrl` prend pour base :
 * une origine passée en paramètre pourrait diverger de cette base.
 *
 * @param {unknown} raw  `action_url` reçu du serveur.
 * @returns {{ kind: 'internal', path: string, href: string } | { kind: 'external', href: string } | { kind: 'none' }}
 */
export function resolveNotificationTarget(raw) {
  const href = safeUrl(raw, { fallback: null })
  if (href === null) return NONE

  const resolved = new URL(href)
  if (resolved.origin === window.location.origin) {
    if (CHEMIN_HORS_ORIGINE.test(resolved.pathname)) return NONE
    return { kind: 'internal', path: `${resolved.pathname}${resolved.search}${resolved.hash}`, href }
  }

  return isAbsolute(raw) ? { kind: 'external', href } : NONE
}

const NONE = Object.freeze({ kind: 'none' })

/** Chemin qu'un navigateur relirait comme une autre origine (`//hôte`, `/\hôte`). */
const CHEMIN_HORS_ORIGINE = /^\/[/\\]/

/** Absolue = analysable SANS base ; une forme relative lève une exception. */
function isAbsolute(raw) {
  try {
    new URL(stripControlChars(raw).trim())
    return true
  } catch {
    return false
  }
}
