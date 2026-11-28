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
      plateforme: true,
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
      plateforme: true,
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
      plateforme: true,
      title: 'Gestion des Institutions'
    }
  },
  {
    path: '/admin/school-requests',
    name: 'AdminSchoolRequests',
    component: () => import('@/views/admin/AdminSchoolRequests.vue'),
    meta: {
      requiresAuth: true,
      roles: ['supradmin'],
      plateforme: true,
      title: 'Demandes d\'ouverture'
    }
  },
  // Journal d'audit - supradmin, lecture seule, toutes écoles (D51, D126)
  {
    path: '/admin/audit-log',
    name: 'AdminAuditLog',
    component: () => import('@/views/admin/AdminAuditLog.vue'),
    meta: {
      requiresAuth: true,
      roles: ['supradmin'],
      plateforme: true,
      title: 'Journal d\'audit'
    }
  },
  {
    path: '/admin/training-sessions',
    name: 'AdminTrainingSessions',
    component: () => import('@/views/admin/AdminTrainingSessions.vue'),
    meta: {
      requiresAuth: true,
      roles: ['superAdmin', 'admin', 'coordinateur'],
      // #605 (lms_backend#1184) : le rôle dit QUI ; la capacité dit SI l'établissement gère son propre
      // catalogue. Le serveur répond 403 `catalogue_managed_by_klassci` sinon ; la garde évite l'écran mort.
      capacite: 'peutGererCatalogueLocal',
      title: 'Sessions de formation'
    }
  },
  // #676 (lms_backend#1669) : la grille hebdomadaire d'une classe. Même porte que le catalogue local : le serveur
  // répond 403 `catalogue_managed_by_klassci` sans la capacité ; la garde évite l'écran mort.
  {
    path: '/admin/emplois-du-temps',
    name: 'AdminEmploisDuTemps',
    component: () => import('@/views/admin/AdminEmploisDuTemps.vue'),
    meta: { requiresAuth: true, roles: ['superAdmin', 'admin', 'coordinateur'], capacite: 'peutGererCatalogueLocal', title: 'Emplois du temps' }
  },
  {
    path: '/admin/emplois-du-temps/:id',
    name: 'AdminEmploiDuTemps',
    component: () => import('@/views/admin/AdminEmploiDuTemps.vue'),
    meta: { requiresAuth: true, roles: ['superAdmin', 'admin', 'coordinateur'], capacite: 'peutGererCatalogueLocal', title: 'Emploi du temps' }
  },
  {
    path: '/admin/enrolment-codes',
    name: 'AdminEnrolmentCodes',
    component: () => import('@/views/admin/AdminEnrolmentCodes.vue'),
    meta: {
      requiresAuth: true,
      roles: ['superAdmin', 'admin', 'coordinateur'],
      // #391 : le rôle dit QUI ; la capacité dit SI l'établissement tient sa propre
      // liste. Le serveur répond 403 sinon ; la garde évite l'écran mort.
      capacite: 'peutInscrireLocalement',
      title: "Classes et codes d'inscription"
    }
  },
  {
    // #655 : le serveur ouvre l'import au coordinateur et au superAdmin (lms
    // `routes/api/imports.php`) ; l'écran n'était routé que pour l'enseignant. C'est
    // le MÊME écran que `/teacher/import`, réutilisé et non recopié.
    path: '/admin/import',
    name: 'AdminImport',
    component: () => import('@/views/import/ImportApprenants.vue'),
    meta: {
      requiresAuth: true,
      roles: ['superAdmin', 'admin', 'coordinateur'],
      // Le rôle dit QUI ; la capacité dit SI l'établissement tient sa propre liste.
      capacite: 'peutInscrireLocalement',
      title: 'Import apprenants'
    }
  }
]
