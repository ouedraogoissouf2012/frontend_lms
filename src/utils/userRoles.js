/**
 * Libellé d'affichage (FR) d'un rôle utilisateur. Fonction pure, partagée entre
 * la table d'AdminUsers et UserDetailModal (#G1 décompo — DRY du mapping de rôle,
 * qui était dupliqué dans le composant).
 *
 * @param {string} role
 * @returns {string} le libellé, ou le rôle brut si inconnu.
 */
export function getRoleLabel(role) {
  const labels = {
    etudiant: 'Étudiant',
    student: 'Étudiant',
    enseignant: 'Enseignant',
    teacher: 'Enseignant',
    coordinateur: 'Coordinateur',
    admin: 'Admin',
    superAdmin: 'Super Admin',
  }
  return labels[role] || role
}
