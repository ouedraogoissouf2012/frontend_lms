import {
  ROLES, hasRole, isSupradmin, isAdminScope, isTeacher, isStudent,
} from '@/constants/roles'

/**
 * Construction des entrées de menu de la sidebar selon le rôle de l'utilisateur
 * (G9 — décomposition de Sidebar.vue pour ramener son <script> sous 300 lignes).
 *
 * Logique PURE extraite telle quelle de la `computed menuSections` d'origine :
 * mêmes conditions de rôle, mêmes libellés, mêmes icônes, mêmes `to` et le même
 * ordre d'insertion. Aucune route ni aucun texte modifié (parité stricte).
 *
 * @param {Object|null} user - Utilisateur courant (auth.getUser()).
 * @returns {Array<{icon: string, label: string, to: string}>} Sections du menu.
 */
export function buildMenuSections(user) {
  if (!user) return []

  // Supradmin (plateforme) : menu minimal. isSupradmin couvre 'supradmin' ET
  // 'superAdmin' (#18, corrige l'incohérence de variante).
  if (isSupradmin(user)) {
    return [{
      icon: 'fa-university',
      label: 'Institutions',
      to: '/admin/institutions'
    }]
  }

  const isStudentRole = isStudent(user)
  // Le "teacher" local inclut le coordinateur (sections enseignant partagées).
  const isTeacherRole = isTeacher(user) || hasRole(user, ROLES.COORDINATEUR)
  const isAdminRole = isAdminScope(user)
  const isCoordinateur = hasRole(user, ROLES.COORDINATEUR)

  const menu = []

  // Student Menu
  if (isStudentRole) {
    menu.push({
      icon: 'fa-home',
      label: 'Dashboard',
      to: '/student/dashboard'
    })
    menu.push({
      icon: 'fa-book',
      label: 'Mes Cours',
      to: '/student/courses'
    })
    menu.push({
      icon: 'fa-clock-o',
      label: 'Emploi du Temps',
      to: '/student/schedule'
    })
    menu.push({
      icon: 'fa-edit',
      label: 'Évaluations',
      to: '/student/evaluations-list'
    })
    menu.push({
      icon: 'fa-star',
      label: 'Mes Notes',
      to: '/student/grades'
    })
    menu.push({
      icon: 'fa-comments',
      label: 'Forum',
      to: '/forum'
    })
    menu.push({
      icon: 'fa-cog',
      label: 'Paramètres',
      to: '/student/settings'
    })
  }

  // Dashboard - Admin pour coordinateur/admin, Teacher pour enseignant
  if (isTeacherRole || isAdminRole) {
    menu.push({
      icon: 'fa-home',
      label: 'Dashboard',
      to: isAdminRole ? '/admin/dashboard' : '/teacher/dashboard'
    })
  }

  // Teacher Menu - OPTIMISE (5 items principaux)
  if (isTeacherRole) {
    // Emploi du Temps - Vue principale quotidienne (calendrier unifie)
    if (!isCoordinateur) {
    menu.push({
      icon: 'fa-calendar',
      label: 'Emploi du Temps',
      to: '/teacher/schedule'
    })
    }
    // Mon Espace - Hub enseignant (Classes + Matieres + Lecons)
    if (!isCoordinateur) {
    menu.push({
      icon: 'fa-th-large',
      label: 'Mon Espace',
      to: '/teacher/hub'
    })
    }
    // Évaluations - Enseignant
    if (!isCoordinateur) {
    menu.push({
      icon: 'fa-edit',
      label: 'Évaluations',
      to: '/teacher/evaluations'
    })
    }
    // Évaluations - Coordinateur (vue globale sans creation)
    if (isCoordinateur) {
    menu.push({
      icon: 'fa-edit',
      label: 'Évaluations',
      to: '/coordinateur/evaluations'
    })
    }
  }

  // Admin Menu
  if (isAdminRole) {
    // Utilisateurs - seulement pour admin complet (pas coordinateur)
    if (!isCoordinateur) {
      menu.push({
        icon: 'fa-users',
        label: 'Utilisateurs',
        to: '/admin/users'
      })
    }

    // Espace Admin (Hub) - Classes, Matières, Enseignants - pour coordinateur
    if (isCoordinateur) {
      menu.push({
        icon: 'fa-building',
        label: 'Espace Admin',
        to: '/admin/hub'
      })
      // Résultats Évaluations - séparé pour coordinateur
      menu.push({
        icon: 'fa-trophy',
        label: 'Résultats',
        to: '/admin/evaluations/results'
      })
      // Séances & Visio
      menu.push({
        icon: 'fa-calendar',
        label: 'Séances & Visio',
        to: '/coordinateur/seances'
      })
    }

    // Menu étendu pour admin/superAdmin (pas coordinateur)
    if (!isCoordinateur) {
      menu.push({
        icon: 'fa-building',
        label: 'Classes',
        to: '/admin/classes'
      })
      menu.push({
        icon: 'fa-book',
        label: 'Matières',
        to: '/admin/matieres'
      })
      menu.push({
        icon: 'fa-user',
        label: 'Enseignants',
        to: '/admin/enseignants'
      })
      menu.push({
        icon: 'fa-calendar',
        label: 'Séances',
        to: '/admin/seances'
      })
      menu.push({
        icon: 'fa-video-camera',
        label: 'Visioconférences',
        to: '/admin/visioconferences'
      })
      menu.push({
        icon: 'fa-trophy',
        label: 'Résultats Évaluations',
        to: '/admin/evaluations/results'
      })
      menu.push({
        icon: 'fa-line-chart',
        label: 'Statistiques',
        to: '/admin/stats'
      })
    }
  }

  // Forum - accessible pour tous (enseignants et admins)
  if (isTeacherRole || isAdminRole) {
    menu.push({
      icon: 'fa-comments',
      label: 'Forum',
      to: '/forum'
    })
  }

  // Historique (seances passees + presences) - uniquement pour enseignants et admins
  if (isTeacherRole || isAdminRole) {
    menu.push({
      icon: 'fa-history',
      label: 'Historique',
      to: '/attendance/seances'
    })
  }

  // Paramètres - dernière entrée pour tous
  if (isTeacherRole || isAdminRole) {
    menu.push({
      icon: 'fa-cog',
      label: 'Paramètres',
      to: isAdminRole ? '/admin/settings' : '/teacher/settings'
    })
  }

  return menu
}
