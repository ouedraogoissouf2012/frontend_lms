// Routes transverses (#H12) — leçons, quiz, forum, visio, évaluations, matières,
// classes, séances, présences et coordinateur. Extraites verbatim de
// router/index.js, définitions et rôles inchangés. Lazy loading systématique (#27).
export const sharedRoutes = [
  // Dashboard générique (fallback)
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
  {
    path: '/quizzes',
    name: 'Quizzes',
    component: () => import('@/views/Quizzes.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/quizzes/:id/take',
    name: 'QuizTake',
    component: () => import('@/views/QuizTake.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/forum',
    name: 'Forum',
    component: () => import('@/views/Forum.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/forum/topics/:id',
    name: 'ForumTopic',
    component: () => import('@/views/ForumTopic.vue'),
    meta: { requiresAuth: true }
  },
  // Visioconférence
  {
    path: '/video-conference/:roomName',
    name: 'VideoConference',
    component: () => import('@/views/VideoConference.vue'),
    meta: { requiresAuth: true }
  },
  // Évaluations - Enseignant
  {
    path: '/teacher/evaluations',
    name: 'TeacherEvaluations',
    component: () => import('@/views/evaluations/TeacherEvaluations.vue'),
    meta: {
      requiresAuth: true,
      roles: ['enseignant', 'teacher']
    }
  },
  {
    path: '/teacher/evaluations/create',
    redirect: '/teacher/evaluations'
  },
  {
    path: '/teacher/evaluations/create-questions',
    name: 'CreateQuestions',
    component: () => import('@/views/evaluations/CreateQuestions.vue'),
    meta: {
      requiresAuth: true,
      roles: ['enseignant', 'teacher']
    }
  },
  {
    path: '/teacher/evaluations/:id/edit-questions',
    name: 'EditQuestions',
    component: () => import('@/views/evaluations/CreateQuestions.vue'),
    meta: {
      requiresAuth: true,
      roles: ['enseignant', 'teacher']
    }
  },
  // Évaluations - Étudiant (redirige vers la liste avec layout)
  {
    path: '/student/evaluations',
    redirect: '/student/evaluations-list'
  },
  {
    path: '/student/evaluations/:id/take',
    name: 'TakeEvaluation',
    component: () => import('@/views/evaluations/TakeEvaluation.vue'),
    meta: {
      requiresAuth: true,
      roles: ['etudiant']
    }
  },
  {
    path: '/student/evaluations/:id/results',
    name: 'EvaluationResults',
    component: () => import('@/views/evaluations/EvaluationResults.vue'),
    meta: {
      requiresAuth: true,
      roles: ['etudiant']
    }
  },
  {
    path: '/teacher/evaluations/:id/preview',
    name: 'PreviewEvaluation',
    component: () => import('@/views/evaluations/PreviewEvaluation.vue'),
    meta: {
      requiresAuth: true,
      roles: ['enseignant']
    }
  },
  // Coordinateur - Prévisualisation évaluation (seulement si terminée - contrôlé par le backend)
  {
    path: '/coordinateur/evaluations/:id/preview',
    name: 'CoordinatorPreviewEvaluation',
    component: () => import('@/views/evaluations/PreviewEvaluation.vue'),
    meta: {
      requiresAuth: true,
      roles: ['coordinateur', 'superAdmin']
    }
  },
  // Matières - Navigation hiérarchique (AVEC LAYOUT MODERNE)
  {
    path: '/matieres/:id',
    name: 'matiere-details',
    component: () => import('@/views/matieres/MatiereDetails.vue'),
    meta: {
      requiresAuth: true,
      title: 'Détails Matière'
    }
  },
  // Classes - Détails complets
  {
    path: '/classes/:id',
    name: 'classe-details',
    component: () => import('@/views/classes/ClasseDetails.vue'),
    meta: { requiresAuth: true }
  },
  // Séances - Détails avec visioconférence
  {
    path: '/seances',
    redirect: '/student/visio-list'
  },
  {
    path: '/seances/:id',
    name: 'seance-details',
    component: () => import('@/views/seances/SeanceDetails.vue'),
    meta: { requiresAuth: true }
  },
  // Historique des séances avec présences
  {
    path: '/attendance/seances',
    name: 'seance-attendance-history',
    component: () => import('@/views/attendance/SeanceAttendanceHistory.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/attendance/seances/:seanceId',
    name: 'seance-attendance-detail',
    component: () => import('@/views/attendance/SeanceAttendanceHistory.vue'),
    meta: { requiresAuth: true }
  },
  // Coordinateur - Gestion des évaluations
  {
    path: '/coordinateur/evaluations',
    name: 'coordinator-evaluations',
    component: () => import('@/views/coordinateur/CoordinatorEvaluations.vue'),
    meta: {
      requiresAuth: true,
      roles: ['coordinateur', 'superAdmin']
    }
  },

  // Coordinateur - Gestion des séances et visio
  {
    path: '/coordinateur/seances',
    name: 'seance-management',
    component: () => import('@/views/coordinateur/SeanceManagement.vue'),
    meta: {
      requiresAuth: true,
      roles: ['coordinateur', 'superAdmin']
    }
  }
]
