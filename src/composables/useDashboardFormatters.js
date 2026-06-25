/**
 * Helpers de présentation d'AdminDashboard (#H3 ≤300) : initiales, libellé/classe
 * de rôle et date relative. Fonctions pures sans état ni effet de bord ; extraites
 * verbatim de la vue d'origine pour garantir la parité de rendu.
 */
export function useDashboardFormatters() {
  function getInitials(name) {
    if (!name) return '?'
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  function getRoleLabel(role) {
    const labels = {
      'etudiant': 'Étudiant',
      'student': 'Étudiant',
      'enseignant': 'Enseignant',
      'teacher': 'Enseignant',
      'coordinateur': 'Coordinateur',
      'superAdmin': 'Admin',
      'admin': 'Admin'
    }
    return labels[role] || role
  }

  function getRoleClass(role) {
    const classes = {
      'etudiant': 'role-student',
      'student': 'role-student',
      'enseignant': 'role-teacher',
      'teacher': 'role-teacher',
      'coordinateur': 'role-coordinator',
      'superAdmin': 'role-admin',
      'admin': 'role-admin'
    }
    return classes[role] || 'role-default'
  }

  function formatDate(dateString) {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'À l\'instant'
    if (diffMins < 60) return `Il y a ${diffMins}min`
    if (diffHours < 24) return `Il y a ${diffHours}h`
    if (diffDays < 7) return `Il y a ${diffDays}j`

    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
  }

  return { getInitials, getRoleLabel, getRoleClass, formatDate }
}
