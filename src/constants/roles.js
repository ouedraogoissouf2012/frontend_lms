/**
 * Couche d'autorisation frontend — source unique des rôles (#18).
 *
 * Le backend (`AuthResponsePresenter`) renvoie `data.user.role` BRUT, non normalisé :
 * l'enum backend `App\Enums\Role` (méthode `tryFromString`) accepte plusieurs alias
 * EN/FR pour un même rôle. Ce module reproduit EXACTEMENT cette table d'alias côté
 * frontend, expose un enum GELÉ des 5 rôles canoniques, et des helpers fail-secure
 * qui ne raisonnent QUE sur le rôle normalisé. Toute décision d'accès passe par ici.
 *
 * Correspondance 1:1 avec `app/Enums/Role.php` (backend, lecture seule — AUCUNE
 * modification backend autorisée). La seule divergence est l'alias `secretaire`
 * (cf. table d'alias, dette #18-FE-1).
 */

/**
 * Rôles canoniques — gelés (immuables à l'exécution).
 * Valeurs alignées sur les cases de `App\Enums\Role` (casse `supradmin` minuscule).
 * @type {Readonly<{ETUDIANT:'etudiant',ENSEIGNANT:'enseignant',COORDINATEUR:'coordinateur',ADMIN:'admin',SUPRADMIN:'supradmin'}>}
 */
export const ROLES = Object.freeze({
  ETUDIANT: 'etudiant',
  ENSEIGNANT: 'enseignant',
  COORDINATEUR: 'coordinateur',
  ADMIN: 'admin',
  SUPRADMIN: 'supradmin',
})

/**
 * Table d'alias brut → canonique, miroir de `Role::tryFromString` du backend.
 * Gelée pour empêcher toute mutation accidentelle.
 */
const ALIAS = Object.freeze({
  etudiant: ROLES.ETUDIANT,
  student: ROLES.ETUDIANT,
  'étudiant': ROLES.ETUDIANT,
  enseignant: ROLES.ENSEIGNANT,
  teacher: ROLES.ENSEIGNANT,
  coordinateur: ROLES.COORDINATEUR,
  coordinator: ROLES.COORDINATEUR,
  admin: ROLES.ADMIN,
  administrateur: ROLES.ADMIN,
  supradmin: ROLES.SUPRADMIN,
  superAdmin: ROLES.SUPRADMIN,
  // --- Divergence backend tracée #18-FE-1 (Décision C) ---
  // `secretaire` est un rôle KLASSCI réellement émis (cf. docs/INTEGRATION_KLASSCI.md)
  // mais ABSENT de Role::tryFromString backend. On le mappe vers `coordinateur`
  // (moindre privilège préservant son accès admin observé). Retirable d'un seul
  // endroit le jour où le backend l'intègre.
  secretaire: ROLES.COORDINATEUR,
})

/** Libellés d'affichage uniques par rôle canonique. */
const DISPLAY_NAMES = Object.freeze({
  [ROLES.SUPRADMIN]: 'Super Administrateur',
  [ROLES.ADMIN]: 'Administrateur',
  [ROLES.COORDINATEUR]: 'Coordinateur',
  [ROLES.ENSEIGNANT]: 'Enseignant',
  [ROLES.ETUDIANT]: 'Étudiant',
})

/** Route du dashboard par rôle canonique. */
const DASHBOARD_ROUTES = Object.freeze({
  [ROLES.SUPRADMIN]: '/admin/institutions',
  [ROLES.ADMIN]: '/admin/dashboard',
  [ROLES.COORDINATEUR]: '/admin/dashboard',
  [ROLES.ENSEIGNANT]: '/teacher/dashboard',
  [ROLES.ETUDIANT]: '/student/dashboard',
})

/**
 * Normalise une valeur de rôle brute en rôle canonique.
 * @param {unknown} raw - Valeur reçue du backend (potentiellement un alias).
 * @returns {string|null} Rôle canonique, ou `null` si non reconnu (fail-soft).
 */
export function normalizeRole(raw) {
  if (typeof raw !== 'string' || raw.length === 0) return null
  return ALIAS[raw] ?? null
}

/** Extrait le rôle brut d'un argument `user` (objet) OU d'une chaîne de rôle. */
function extractRawRole(userOrRole) {
  if (typeof userOrRole === 'string') return userOrRole
  if (userOrRole && typeof userOrRole === 'object') return userOrRole.role
  return null
}

/** Rôle canonique de l'argument (objet user ou chaîne), ou `null`. */
function canonical(userOrRole) {
  return normalizeRole(extractRawRole(userOrRole))
}

/**
 * Vrai si le rôle (normalisé) de l'utilisateur appartient aux rôles attendus
 * (eux-mêmes normalisés). Fail-secure : rôle inconnu/null → false.
 * @param {object|string|null} userOrRole
 * @param {string|string[]} roles
 * @returns {boolean}
 */
export function hasRole(userOrRole, roles) {
  const role = canonical(userOrRole)
  if (!role) return false
  const expected = (Array.isArray(roles) ? roles : [roles])
    .map(normalizeRole)
    .filter(Boolean)
  return expected.includes(role)
}

/** Vrai ssi le rôle normalisé est `supradmin`. */
export function isSupradmin(userOrRole) {
  return canonical(userOrRole) === ROLES.SUPRADMIN
}

/** Périmètre administratif STRICT, aligné backend `Role::isAdmin()` : admin | supradmin. */
export function isAdmin(userOrRole) {
  const role = canonical(userOrRole)
  return role === ROLES.ADMIN || role === ROLES.SUPRADMIN
}

/** Périmètre d'affichage admin ÉLARGI (UI) : admin | supradmin | coordinateur. */
export function isAdminScope(userOrRole) {
  const role = canonical(userOrRole)
  return role === ROLES.ADMIN || role === ROLES.SUPRADMIN || role === ROLES.COORDINATEUR
}

/** Vrai ssi le rôle normalisé est `enseignant`. */
export function isTeacher(userOrRole) {
  return canonical(userOrRole) === ROLES.ENSEIGNANT
}

/** Vrai ssi le rôle normalisé est `etudiant`. */
export function isStudent(userOrRole) {
  return canonical(userOrRole) === ROLES.ETUDIANT
}

/**
 * Route du dashboard selon le rôle (objet user ou chaîne).
 * Rôle inconnu/null → `/login` (route neutre, fail-secure).
 * @param {object|string|null} userOrRole
 * @returns {string}
 */
export function getDashboardRoute(userOrRole) {
  const role = canonical(userOrRole)
  return role ? DASHBOARD_ROUTES[role] : '/login'
}

/**
 * Libellé d'affichage du rôle. Rôle inconnu → `''` (pas de fuite de valeur brute en UI).
 * @param {object|string|null} userOrRole
 * @returns {string}
 */
export function getRoleDisplayName(userOrRole) {
  const role = canonical(userOrRole)
  return role ? DISPLAY_NAMES[role] : ''
}

/**
 * Décision d'accès à une route protégée. Fonction PURE unique, réutilisée par le
 * guard du router ET par les tests (pas de logique dupliquée).
 * @param {object|string|null} user
 * @param {string[]|undefined} metaRoles - Rôles requis par la route (`to.meta.roles`).
 * @returns {{allowed: boolean, redirectTo: string|null}}
 */
export function canActivate(user, metaRoles) {
  if (!metaRoles || metaRoles.length === 0) {
    return { allowed: true, redirectTo: null }
  }
  const allowed = hasRole(user, metaRoles) || isSupradmin(user)
  return { allowed, redirectTo: allowed ? null : getDashboardRoute(user) }
}

/**
 * Journalise une décision/incohérence de rôle SANS donnée sensible (pas de nom ni
 * d'email). Conditionné hors production (cohérent avec la désactivation des
 * console.log en prod, #15).
 * @param {string} event - Ex. 'access_denied', 'unknown_role', 'supradmin_flag_mismatch'.
 * @param {object} [context] - Contexte non sensible (ex. { route, role }).
 */
export function logRoleDecision(event, context = {}) {
  if (import.meta.env?.PROD) return
  console.warn(`[roles] ${event}`, context)
}
