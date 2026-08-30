import { ROLES } from '@/constants/roles'

/**
 * Groupes de rôles réutilisés par les routes transverses.
 *
 * Contexte : l'issue #12 a supprimé le `||` permissif du guard, mais dix routes
 * `requiresAuth: true` étaient restées SANS `meta.roles` — leur autorisation
 * reposait uniquement sur le backend. Ces groupes rendent l'intention explicite
 * et testable, sans dupliquer une n-ième liste de chaînes.
 *
 * Pourquoi uniquement les valeurs CANONIQUES (pas les alias `teacher`,
 * `superAdmin`, `secretaire`) : `canActivate` → `hasRole` normalise les DEUX
 * côtés via `normalizeRole` (constants/roles.js:99-106). Un utilisateur dont le
 * backend renvoie `teacher`, `superAdmin` ou `secretaire` est donc déjà couvert
 * par `enseignant`, `admin` et `coordinateur` respectivement (superAdmin = admin
 * d'établissement depuis #659). Les routes
 * historiques listent les alias en clair ; on ne les recopie pas ici pour éviter
 * une liste à maintenir en double.
 */

/**
 * Tous les rôles connus de la plateforme. Sémantique : « toute session valide »,
 * MAIS fail-secure — un rôle absent de la table d'alias (donc non normalisable)
 * est refusé, alors qu'un simple `requiresAuth` le laissait passer.
 * @type {ReadonlyArray<string>}
 */
export const AUTHENTICATED_ROLES = Object.freeze([
  ROLES.ETUDIANT,
  ROLES.ENSEIGNANT,
  ROLES.COORDINATEUR,
  ROLES.ADMIN,
  ROLES.SUPRADMIN
])

/**
 * Personnel encadrant : tout sauf l'étudiant. Réservé aux écrans de gestion
 * (présences...) dont aucune vue étudiante ne propose l'accès.
 * @type {ReadonlyArray<string>}
 */
export const STAFF_ROLES = Object.freeze([
  ROLES.ENSEIGNANT,
  ROLES.COORDINATEUR,
  ROLES.ADMIN,
  ROLES.SUPRADMIN
])
