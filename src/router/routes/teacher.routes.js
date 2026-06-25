// Routes Enseignant (#H12) — extraites verbatim de router/index.js, définitions
// et métadonnées de rôles inchangées. Lazy loading systématique (#27).
export const teacherRoutes = [
  // Dashboard Enseignant
  {
    path: '/teacher',
    redirect: '/teacher/dashboard'
  },
  {
    path: '/teacher/dashboard',
    name: 'TeacherDashboard',
    component: () => import('@/views/dashboards/TeacherDashboard.vue'),
    meta: {
      requiresAuth: true,
      roles: ['enseignant', 'teacher']
    }
  },
  // Séances Enseignant
  {
    path: '/teacher/seances',
    name: 'TeacherSeances',
    component: () => import('@/views/TeacherSeances.vue'),
    meta: {
      requiresAuth: true,
      roles: ['enseignant', 'teacher']
    }
  },
  // Emploi du Temps Enseignant - NOUVEAU (calendrier unifie seances + evaluations)
  {
    path: '/teacher/schedule',
    name: 'TeacherSchedule',
    component: () => import('@/views/teacher/TeacherSchedule.vue'),
    meta: {
      requiresAuth: true,
      roles: ['enseignant', 'teacher'],
      title: 'Emploi du Temps'
    }
  },
  // Hub Enseignant - Mon Espace
  {
    path: '/teacher/hub',
    name: 'TeacherHub',
    component: () => import('@/views/teacher/TeacherHub.vue'),
    meta: {
      requiresAuth: true,
      roles: ['enseignant', 'teacher'],
      title: 'Mon Espace'
    }
  },
  // Classes Enseignant
  {
    path: '/teacher/classes',
    name: 'TeacherClasses',
    component: () => import('@/views/teacher/TeacherClasses.vue'),
    meta: {
      requiresAuth: true,
      roles: ['enseignant', 'teacher']
    }
  },
  // Statistiques Enseignant
  {
    path: '/teacher/stats',
    name: 'TeacherStats',
    component: () => import('@/views/teacher/TeacherStats.vue'),
    meta: {
      requiresAuth: true,
      roles: ['enseignant', 'teacher']
    }
  },
  // Profil - Enseignant
  {
    path: '/teacher/profile',
    name: 'teacher-profile',
    component: () => import('@/views/teacher/TeacherProfile.vue'),
    meta: {
      requiresAuth: true,
      roles: ['enseignant', 'teacher'],
      title: 'Mon Profil'
    }
  },
  // Visioconférences - Enseignant
  {
    path: '/teacher/visio-list',
    name: 'teacher-visio-list',
    component: () => import('@/views/teacher/TeacherVisioList.vue'),
    meta: {
      requiresAuth: true,
      roles: ['enseignant', 'teacher'],
      title: 'Mes Visioconférences'
    }
  },
  // Paramètres - Enseignant
  {
    path: '/teacher/settings',
    name: 'teacher-settings',
    component: () => import('@/views/teacher/TeacherSettings.vue'),
    meta: {
      requiresAuth: true,
      roles: ['enseignant', 'teacher'],
      title: 'Paramètres'
    }
  },
  // Corrections Évaluations
  {
    path: '/teacher/evaluations/:id/corrections',
    name: 'EvaluationCorrections',
    component: () => import('@/views/teacher/EvaluationCorrections.vue'),
    meta: {
      requiresAuth: true,
      roles: ['enseignant', 'teacher']
    }
  }
]
