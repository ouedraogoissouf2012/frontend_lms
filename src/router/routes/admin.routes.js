// Routes Admin (#H12) — lazy loading systématique (#27).
// Les routes du périmètre admin acceptent le rôle canonique `admin` en plus des
// alias historiques utilisés par KLASSCI ; `/admin/institutions` reste supradmin.
export const adminRoutes = [
  // Dashboard Admin
  {
    path: '/admin/dashboard',
    name: 'AdminDashboard',
    component: () => import('@/views/dashboards/AdminDashboard.vue'),
    meta: {
      requiresAuth: true,
      roles: ['superAdmin', 'admin', 'coordinateur', 'secretaire']
    }
  },
  // Gestion Utilisateurs Admin
  {
    path: '/admin/users',
    name: 'AdminUsers',
    component: () => import('@/views/admin/AdminUsers.vue'),
    meta: {
      requiresAuth: true,
      roles: ['superAdmin', 'admin', 'coordinateur']
    }
  },
  // Espace Admin (Hub) - Classes, Matières, Enseignants
  {
    path: '/admin/hub',
    name: 'AdminHub',
    component: () => import('@/views/admin/AdminHub.vue'),
    meta: {
      requiresAuth: true,
      roles: ['superAdmin', 'admin', 'coordinateur', 'secretaire']
    }
  },
  // Gestion Classes Admin
  {
    path: '/admin/classes',
    name: 'AdminClasses',
    component: () => import('@/views/admin/AdminClasses.vue'),
    meta: {
      requiresAuth: true,
      roles: ['superAdmin', 'admin', 'coordinateur']
    }
  },
  // Gestion Matières Admin
  {
    path: '/admin/matieres',
    name: 'AdminMatieres',
    component: () => import('@/views/admin/AdminMatieres.vue'),
    meta: {
      requiresAuth: true,
      roles: ['superAdmin', 'admin', 'coordinateur']
    }
  },
  // Gestion Enseignants Admin
  {
    path: '/admin/enseignants',
    name: 'AdminEnseignants',
    component: () => import('@/views/admin/AdminEnseignants.vue'),
    meta: {
      requiresAuth: true,
      roles: ['superAdmin', 'admin', 'coordinateur']
    }
  },
  // Gestion Séances Admin
  {
    path: '/admin/seances',
    name: 'AdminSeances',
    component: () => import('@/views/admin/AdminSeances.vue'),
    meta: {
      requiresAuth: true,
      roles: ['superAdmin', 'admin', 'coordinateur']
    }
  },
  // Gestion Visioconférences Admin
  {
    path: '/admin/visioconferences',
    name: 'AdminVisio',
    component: () => import('@/views/admin/AdminVisio.vue'),
    meta: {
      requiresAuth: true,
      roles: ['superAdmin', 'admin', 'coordinateur']
    }
  },
  // Statistiques Admin
  {
    path: '/admin/stats',
    name: 'AdminStats',
    component: () => import('@/views/admin/AdminStats.vue'),
    meta: {
      requiresAuth: true,
      roles: ['superAdmin', 'admin', 'coordinateur']
    }
  },
  // Résultats Évaluations Admin/Coordinateur
  {
    path: '/admin/evaluations/results',
    name: 'AdminEvaluationResults',
    component: () => import('@/views/admin/AdminEvaluationResults.vue'),
    meta: {
      requiresAuth: true,
      roles: ['superAdmin', 'admin', 'coordinateur']
    }
  },
  // Détails résultats d'une évaluation (tous les étudiants)
  {
    path: '/admin/evaluations/:id/details',
    name: 'AdminEvaluationDetails',
    component: () => import('@/views/admin/AdminEvaluationDetails.vue'),
    meta: {
      requiresAuth: true,
      roles: ['superAdmin', 'admin', 'coordinateur']
    }
  },
  // Profil - Admin
  {
    path: '/admin/profile',
    name: 'admin-profile',
    component: () => import('@/views/admin/AdminProfile.vue'),
    meta: {
      requiresAuth: true,
      roles: ['superAdmin', 'admin', 'coordinateur'],
      title: 'Mon Profil'
    }
  },
  // Paramètres - Admin
  {
    path: '/admin/settings',
    name: 'admin-settings',
    component: () => import('@/views/admin/AdminSettings.vue'),
    meta: {
      requiresAuth: true,
      roles: ['superAdmin', 'admin', 'coordinateur'],
      title: 'Paramètres'
    }
  },
  // Gestion Institutions - supradmin uniquement
  {
    path: '/admin/institutions',
    name: 'AdminInstitutions',
    component: () => import('@/views/admin/AdminInstitutions.vue'),
    meta: {
      requiresAuth: true,
      roles: ['supradmin'],
      title: 'Gestion des Institutions'
    }
  }
]
