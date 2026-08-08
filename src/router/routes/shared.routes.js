import { AUTHENTICATED_ROLES, STAFF_ROLES } from './roleGroups'

// Routes transverses (#H12) — leçons, quiz, forum, visio, évaluations, matières,
// classes, séances, présences et coordinateur. Extraites verbatim de
// router/index.js. Lazy loading systématique (#27).
//
// Reliquat #12 : dix routes portaient `requiresAuth: true` SANS `meta.roles`,
// l'autorisation reposant alors entièrement sur le backend. Chaque `roles`
// ajouté ci-dessous est justifié par un point d'entrée réel (lien de navigation
// ou `router.push`) cité en commentaire — aucune restriction n'est déduite à
// l'intuition. Voir ./roleGroups.js pour la sémantique des deux groupes.
export const sharedRoutes = [
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
  // Quiz (module hérité) — Preuve : lien INCONDITIONNEL de Navbar.vue:50-56
  // (aucun `v-if` de rôle, contrairement aux liens enseignant/étudiant voisins
  // lignes 21-41) et absence totale du menu de navigation.js. Faute de preuve
  // d'un périmètre plus étroit, on conserve l'audience observée (tous rôles) ;
  // restreindre demanderait un arbitrage produit (cf. rapport).
  {
    path: '/quizzes',
    name: 'Quizzes',
    component: () => import('@/views/Quizzes.vue'),
    meta: { requiresAuth: true, roles: AUTHENTICATED_ROLES }
  },
  // Preuve : unique point d'entrée = Quizzes.vue:105 (`startQuiz`), donc même
  // audience que /quizzes ci-dessus.
  {
    path: '/quizzes/:id/take',
    name: 'QuizTake',
    component: () => import('@/views/QuizTake.vue'),
    meta: { requiresAuth: true, roles: AUTHENTICATED_ROLES }
  },
  // Preuve : navigation.js:56 (étudiant) + navigation.js:85 (enseignant,
  // coordinateur, admin) + useMobileSidebar.js:64,72 → les 4 rôles non
  // supradmin ; supradmin passe par le bypass de canActivate.
  {
    path: '/forum',
    name: 'Forum',
    component: () => import('@/views/Forum.vue'),
    meta: { requiresAuth: true, roles: AUTHENTICATED_ROLES }
  },
  // Preuve : unique point d'entrée = Forum.vue:162 (`viewTopic`) → même
  // audience que /forum.
  {
    path: '/forum/topics/:id',
    name: 'ForumTopic',
    component: () => import('@/views/ForumTopic.vue'),
    meta: { requiresAuth: true, roles: AUTHENTICATED_ROLES }
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
  // Preuve : entrées enseignant/coordinateur/admin (useTeacherMatieres.js:54,
  // useTeacherDashboard.js:99, useLessonChapters.js:71,95, useClasseDetails.js:108)
  // MAIS la vue gère explicitement l'étudiant — utils/matiereDetails.js:125-130
  // (`role === 'etudiant'` → TakeEvaluation / EvaluationResults), branche
  // atteinte depuis useMatiereDetails.js:234-244. L'étudiant est donc un public
  // prévu de cette vue : pas de restriction au personnel.
  {
    path: '/matieres/:id',
    name: 'matiere-details',
    component: () => import('@/views/matieres/MatiereDetails.vue'),
    meta: {
      requiresAuth: true,
      roles: AUTHENTICATED_ROLES,
      title: 'Détails Matière'
    }
  },
  // Classes - Détails complets
  // Preuve : useAdminClasses.js:245 (admin/coordinateur) ET useMatiereDetails.js:246-248
  // (`viewClasse`, onglet « Classes » rendu sans condition de rôle,
  // useMatiereDetails.js:32-38) — donc atteignable depuis /matieres/:id par un
  // étudiant. Même audience que la matière.
  {
    path: '/classes/:id',
    name: 'classe-details',
    component: () => import('@/views/classes/ClasseDetails.vue'),
    meta: { requiresAuth: true, roles: AUTHENTICATED_ROLES }
  },
  // Séances - Détails avec visioconférence
  {
    path: '/seances',
    redirect: '/student/visio-list'
  },
  // Preuve : poussée depuis les quatre périmètres — StudentSchedule.vue:77
  // (étudiant), TeacherSchedule.vue:107,143 (enseignant), useSeanceManagement.js:153
  // (coordinateur), useMatiereDetails.js:215. La vue distingue d'ailleurs
  // explicitement l'étudiant : useSeanceDetails.js:49-55 (isTeacher/isStudent).
  {
    path: '/seances/:id',
    name: 'seance-details',
    component: () => import('@/views/seances/SeanceDetails.vue'),
    meta: { requiresAuth: true, roles: AUTHENTICATED_ROLES }
  },
  // Historique des séances avec présences
  // Preuve : navigation.js:86 → [enseignant, coordinateur, admin] UNIQUEMENT,
  // confirmé par useMobileSidebar.js:65 (enseignant) et :73 (coordinateur).
  // Aucune vue ni composant étudiant ne référence /attendance/* (vérifié par
  // recherche sur src/views/student et src/components/student).
  {
    path: '/attendance/seances',
    name: 'seance-attendance-history',
    component: () => import('@/views/attendance/SeanceAttendanceHistory.vue'),
    meta: { requiresAuth: true, roles: STAFF_ROLES }
  },
  // Preuve : même vue, poussée par TeacherSchedule.vue:112,132,137 (enseignant)
  // et useSeanceManagement.js:148 (coordinateur). Même périmètre que la liste.
  {
    path: '/attendance/seances/:seanceId',
    name: 'seance-attendance-detail',
    component: () => import('@/views/attendance/SeanceAttendanceHistory.vue'),
    meta: { requiresAuth: true, roles: STAFF_ROLES }
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
