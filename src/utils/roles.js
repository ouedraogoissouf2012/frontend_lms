/**
 * Helper pour la gestion des rôles utilisateurs KLASSCI
 */

/**
 * Rôles disponibles dans KLASSCI
 */
export const ROLES = {
  SUPER_ADMIN: 'superAdmin',
  COORDINATEUR: 'coordinateur',
  SECRETAIRE: 'secretaire',
  ENSEIGNANT: 'enseignant',
  TEACHER: 'teacher',
  ETUDIANT: 'etudiant'
}

/**
 * Obtenir la route du dashboard selon le rôle utilisateur
 * @param {string} role - Le rôle de l'utilisateur
 * @returns {string} - La route du dashboard approprié
 */
export function getDashboardRoute(role) {
  if (!role) return '/login'

  // Admins (superAdmin, coordinateur, secretaire)
  if ([ROLES.SUPER_ADMIN, ROLES.COORDINATEUR, ROLES.SECRETAIRE].includes(role)) {
    return '/admin/dashboard'
  }

  // Enseignants
  if ([ROLES.ENSEIGNANT, ROLES.TEACHER].includes(role)) {
    return '/teacher/dashboard'
  }

  // Étudiants
  if (role === ROLES.ETUDIANT) {
    return '/student/dashboard'
  }

  // Par défaut (fallback)
  return '/dashboard'
}

/**
 * Vérifier si l'utilisateur a un rôle spécifique
 * @param {Object} user - L'objet utilisateur
 * @param {string|Array} roles - Le(s) rôle(s) à vérifier
 * @returns {boolean}
 */
export function hasRole(user, roles) {
  if (!user || !user.role) return false
  const userRoles = Array.isArray(roles) ? roles : [roles]
  return userRoles.includes(user.role)
}

/**
 * Vérifier si l'utilisateur est admin
 * @param {Object} user - L'objet utilisateur
 * @returns {boolean}
 */
export function isAdmin(user) {
  return hasRole(user, [ROLES.SUPER_ADMIN, ROLES.COORDINATEUR, ROLES.SECRETAIRE])
}

/**
 * Vérifier si l'utilisateur est enseignant
 * @param {Object} user - L'objet utilisateur
 * @returns {boolean}
 */
export function isTeacher(user) {
  return hasRole(user, [ROLES.ENSEIGNANT, ROLES.TEACHER])
}

/**
 * Vérifier si l'utilisateur est étudiant
 * @param {Object} user - L'objet utilisateur
 * @returns {boolean}
 */
export function isStudent(user) {
  return hasRole(user, [ROLES.ETUDIANT])
}

/**
 * Obtenir le nom d'affichage du rôle
 * @param {string} role - Le rôle
 * @returns {string}
 */
export function getRoleDisplayName(role) {
  const roleNames = {
    [ROLES.SUPER_ADMIN]: 'Super Administrateur',
    [ROLES.COORDINATEUR]: 'Coordinateur',
    [ROLES.SECRETAIRE]: 'Secrétaire',
    [ROLES.ENSEIGNANT]: 'Enseignant',
    [ROLES.TEACHER]: 'Enseignant',
    [ROLES.ETUDIANT]: 'Étudiant'
  }
  return roleNames[role] || role
}
