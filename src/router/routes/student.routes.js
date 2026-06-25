// Routes Étudiant (#H12) — extraites verbatim de router/index.js, définitions et
// métadonnées de rôles inchangées. Lazy loading systématique (#27).
export const studentRoutes = [
  // Dashboard Étudiant (AVEC LAYOUT MODERNE)
  {
    path: '/student',
    redirect: '/student/dashboard'
  },
  {
    path: '/student/dashboard',
    name: 'StudentDashboard',
    component: () => import('@/views/dashboards/StudentDashboard.vue'),
    meta: {
      requiresAuth: true,
      roles: ['etudiant'],
      title: 'Dashboard'
    }
  },
  // Mes Cours - Étudiant
  {
    path: '/student/courses',
    name: 'student-courses',
    component: () => import('@/views/student/StudentCourses.vue'),
    meta: {
      requiresAuth: true,
      roles: ['etudiant'],
      title: 'Mes Cours'
    }
  },
  // Détails d'un cours (leçon) - Étudiant (vue apprenant dédiée)
  {
    path: '/student/lessons/:id',
    name: 'lesson-details',
    component: () => import('@/views/student/StudentLessonView.vue'),
    meta: {
      requiresAuth: true,
      roles: ['etudiant'],
      title: 'Contenu du cours',
      hideLayout: true
    }
  },
  // Évaluations - Étudiant (liste centralisée)
  {
    path: '/student/evaluations-list',
    name: 'student-evaluations-list',
    component: () => import('@/views/student/StudentEvaluationsList.vue'),
    meta: {
      requiresAuth: true,
      roles: ['etudiant'],
      title: 'Mes Évaluations'
    }
  },
  // Notes - Étudiant (toutes les notes groupées par matière)
  {
    path: '/student/grades',
    name: 'student-grades',
    component: () => import('@/views/student/StudentGrades.vue'),
    meta: {
      requiresAuth: true,
      roles: ['etudiant'],
      title: 'Mes Notes'
    }
  },
  // Visioconférences - Étudiant (ANCIEN - redirige vers /student/schedule?filter=visio)
  {
    path: '/student/visio-list',
    redirect: to => {
      return { path: '/student/schedule', query: { filter: 'visio' } }
    }
  },
  // Paramètres - Étudiant
  {
    path: '/student/settings',
    name: 'student-settings',
    component: () => import('@/views/student/StudentSettings.vue'),
    meta: {
      requiresAuth: true,
      roles: ['etudiant'],
      title: 'Paramètres'
    }
  },
  // Emploi du temps unifié - NOUVEAU (remplace séances + visio-list)
  {
    path: '/student/schedule',
    name: 'student-schedule',
    component: () => import('@/views/student/StudentSchedule.vue'),
    meta: {
      requiresAuth: true,
      roles: ['etudiant'],
      title: 'Mon Emploi du Temps'
    }
  },
  // Séances étudiant - Emploi du temps (ANCIEN - redirige vers /student/schedule)
  {
    path: '/student/seances',
    redirect: to => {
      return { path: '/student/schedule', query: { filter: 'all' } }
    }
  }
]
