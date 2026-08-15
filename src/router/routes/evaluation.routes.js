// #226 : routes évaluations (extraites verbatim de shared.routes.js).
export const evaluationRoutes = [
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
]
