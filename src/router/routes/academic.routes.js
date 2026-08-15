import { AUTHENTICATED_ROLES, STAFF_ROLES } from './roleGroups'

// #226 : routes matières/classes/séances/présences/coordinateur (verbatim).
export const academicRoutes = [
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
