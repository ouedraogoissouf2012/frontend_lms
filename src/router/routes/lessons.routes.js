// #226 : routes leçons/dashboard (extraites verbatim de shared.routes.js).
export const lessonRoutes = [
  // Dashboard générique — SEULE route volontairement laissée sans `meta.roles`
  // (exception verrouillée par routerRoutes.test.js). Preuve : aucun lien de
  // menu, c'est le REPLI de useNavbar.js:51,59 et le défaut de
  // NavbarUserMenu.vue:34-35, atteint quand le rôle n'est PAS normalisable.
  // Y poser des `roles` renverrait ce cas vers getDashboardRoute() = '/login'
  // (roles.js:141-144), que le guard renvoie vers '/login' (guards.js:28-30)
  // → boucle. La vue n'affiche que les données de l'utilisateur courant.
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { requiresAuth: true }
  },
  // Leçons - Étudiants
  // #26 : vue leçon unifiée. /lessons/:id et /student/lessons/:id pointent vers
  // la même vue canonique (src/views/student/StudentLessonView.vue) ; l'ancien
  // doublon src/views/lessons/StudentLessonView.vue a été supprimé.
  {
    path: '/lessons/:id',
    name: 'LessonView',
    component: () => import('@/views/student/StudentLessonView.vue'),
    meta: {
      requiresAuth: true,
      roles: ['etudiant', 'enseignant', 'teacher', 'coordinateur', 'superAdmin']
    }
  },
  // Leçons - Enseignant
  {
    path: '/teacher/lessons/create',
    name: 'LessonCreate',
    component: () => import('@/views/lessons/LessonEditor.vue'),
    meta: {
      requiresAuth: true,
      roles: ['enseignant', 'teacher']
    }
  },
  {
    path: '/teacher/lessons/:id/edit',
    name: 'LessonEdit',
    component: () => import('@/views/lessons/LessonEditor.vue'),
    meta: {
      requiresAuth: true,
      roles: ['enseignant', 'teacher']
    }
  },
  {
    path: '/teacher/matieres',
    name: 'TeacherMatieres',
    component: () => import('@/views/teacher/TeacherMatieres.vue'),
    meta: {
      requiresAuth: true,
      roles: ['enseignant', 'teacher'],
      title: 'Mes Matières'
    }
  },
  {
    path: '/teacher/lessons',
    name: 'TeacherLessons',
    component: () => import('@/views/lessons/TeacherLessons.vue'),
    meta: {
      requiresAuth: true,
      roles: ['enseignant', 'teacher']
    }
  },
  {
    path: '/teacher/lessons/:id/chapters',
    name: 'LessonChapters',
    component: () => import('@/views/lessons/LessonChapters.vue'),
    meta: {
      requiresAuth: true,
      roles: ['enseignant', 'teacher'],
      title: 'Gestion des chapitres'
    }
  },
]
