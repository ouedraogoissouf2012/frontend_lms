/**
 * Composable de navigation (#104 / N1).
 *
 * Expose le menu déclaratif (`@/constants/navigation`) déjà filtré selon le rôle de
 * l'utilisateur courant. Réutilise `hasRole` de `@/constants/roles` — la logique de
 * rôle (normalisation des alias backend, fail-secure) n'est jamais réimplémentée ici.
 *
 * Séparation des responsabilités :
 *   - `filterSectionsByRole` : fonction PURE (données → données), sans Vue ni auth,
 *     unité-testable en isolation avec un faux `user`. Gère le filtrage récursif des
 *     `children` (un groupe dont tous les enfants sont masqués disparaît).
 *   - `useNavigation`        : enveloppe réactive fine qui lit l'utilisateur via le
 *     store/auth (`auth.getUser()`), ou via un `user` injecté (tests / SSR).
 */

import { computed } from 'vue'
import { auth } from '@/services/api'
import { hasRole } from '@/constants/roles'
import { NAV_SECTIONS } from '@/constants/navigation'
import { getActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

/**
 * Filtre récursivement une liste d'items de navigation selon le rôle de l'utilisateur.
 * Un item est conservé ssi l'utilisateur possède l'un de ses `roles` (via `hasRole`,
 * donc fail-secure : rôle inconnu/null → rien). Un item avec `children` est conservé
 * si l'utilisateur y a droit ET qu'il reste au moins un enfant visible (ou aucun
 * enfant défini). Les `children` sont remplacés par leur version filtrée.
 *
 * @param {ReadonlyArray<import('@/constants/navigation').NavItem>} sections
 * Un item portant `capacite` (#391) n'est conservé que si cette capacité, accordée par
 * le serveur, vaut `true` dans `capacites` — même principe que `meta.capacite` de la
 * garde de route (guards.js). Absente ou fausse : l'item disparaît (fail-secure).
 *
 * @param {object|string|null} userOrRole - Objet user, chaîne de rôle, ou null.
 * @param {Record<string, boolean>} [capacites] - Capacités accordées (nom → booléen).
 * @returns {Array<import('@/constants/navigation').NavItem>} Nouveaux items filtrés.
 */
export function filterSectionsByRole(sections, userOrRole, capacites = {}) {
  if (!Array.isArray(sections)) return []

  return sections.reduce((acc, item) => {
    if (!hasRole(userOrRole, item.roles)) return acc
    if (item.capacite && capacites?.[item.capacite] !== true) return acc

    if (Array.isArray(item.children)) {
      const children = filterSectionsByRole(item.children, userOrRole, capacites)
      // Un groupe sans aucun enfant visible n'est pas affiché.
      if (children.length === 0) return acc
      acc.push({ ...item, children })
    } else {
      acc.push({ ...item })
    }
    return acc
  }, [])
}

/**
 * Retourne les sections de navigation filtrées par rôle, sous forme réactive.
 *
 * @param {Object} [options]
 * @param {object|string|null} [options.user] - Utilisateur injecté (sinon `auth.getUser()`).
 * @param {ReadonlyArray<import('@/constants/navigation').NavItem>} [options.sections]
 *        Config injectée (sinon `NAV_SECTIONS`) — utile pour les tests.
 * @param {Record<string, boolean>} [options.capacites] Capacités injectées (sinon
 *        lues dans le store, par leur nom, comme le fait la garde de route).
 * @returns {{ sections: import('vue').ComputedRef<Array<import('@/constants/navigation').NavItem>> }}
 */
export function useNavigation(options = {}) {
  const source = options.sections ?? NAV_SECTIONS

  const sections = computed(() => {
    const user = 'user' in options ? options.user : auth.getUser()
    const capacites = options.capacites ?? capacitesDuStore(source)
    return filterSectionsByRole(source, user, capacites)
  })

  return { sections }
}

/** Noms de capacités employés par le menu (récursif). */
function nomsDeCapacites(sections, noms = new Set()) {
  for (const item of sections ?? []) {
    if (item.capacite) noms.add(item.capacite)
    if (Array.isArray(item.children)) nomsDeCapacites(item.children, noms)
  }
  return noms
}

/**
 * Valeur de chaque capacité du menu, LUE dans le store (jamais calculée ici). Sans
 * Pinia actif (rendu isolé), aucune capacité n'est accordée : fail-secure, l'entrée
 * gardée reste masquée.
 */
function capacitesDuStore(sections) {
  const noms = nomsDeCapacites(sections)
  if (noms.size === 0 || !getActivePinia()) return {}
  const store = useAuthStore()
  return Object.fromEntries([...noms].map((nom) => [nom, store[nom] === true]))
}
