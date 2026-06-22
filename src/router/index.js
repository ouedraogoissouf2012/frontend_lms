import { createRouter, createWebHistory } from 'vue-router'
import { auth } from '@/services/api'
import { getDashboardRoute } from '@/constants/roles'
import { navigationGuard } from './guards'

// #27 : toutes les routes sont en lazy loading (() => import()) pour un code
// splitting systématique (un chunk par route). Voir la convention dans
// CONTRIBUTING.md (« <script setup> + lazy routes »).

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { guest: true }
  },
  // Redirection / vers dashboard approprié
  {
    path: '/',
    // Redirection via la source unique getDashboardRoute (rôle normalisé, #18)
    redirect: () => getDashboardRoute(auth.getUser())
  },
  // Redirect /admin → dashboard approprié selon le rôle normalisé
  {
    path: '/admin',
    redirect: () => getDashboardRoute(auth.getUser())
  },
  // Dashboard Admin
  {
    path: '/admin/dashboard',
    name: 'AdminDashboard',
    component: () => import('@/views/dashboards/AdminDashboard.vue'),
    meta: {
      requiresAuth: true,
      roles: ['superAdmin', 'coordinateur', 'secretaire']
    }
  },
  // Gestion Utilisateurs Admin
  {
    path: '/admin/users',
    name: 'AdminUsers',
    component: () => import('@/views/admin/AdminUsers.vue'),
    meta: {
      requiresAuth: true,
      roles: ['superAdmin', 'coordinateur']
    }
  },
  // Espace Admin (Hub) - Classes, Matières, Enseignants
  {
    path: '/admin/hub',
    name: 'AdminHub',
    component: () => import('@/views/admin/AdminHub.vue'),
    meta: {
      requiresAuth: true,
      roles: ['superAdmin', 'coordinateur', 'secretaire']
    }
  },
  // Gestion Classes Admin
  {
    path: '/admin/classes',
    name: 'AdminClasses',
    component: () => import('@/views/admin/AdminClasses.vue'),
    meta: {
      requiresAuth: true,
      roles: ['superAdmin', 'coordinateur']
    }
  },
  // Gestion Matières Admin
  {
    path: '/admin/matieres',
    name: 'AdminMatieres',
    component: () => import('@/views/admin/AdminMatieres.vue'),
    meta: {
      requiresAuth: true,
      roles: ['superAdmin', 'coordinateur']
    }
  },
  // Gestion Enseignants Admin
  {
    path: '/admin/enseignants',
    name: 'AdminEnseignants',
    component: () => import('@/views/admin/AdminEnseignants.vue'),
    meta: {
      requiresAuth: true,
      roles: ['superAdmin', 'coordinateur']
    }
  },
  // Gestion Séances Admin
  {
    path: '/admin/seances',
    name: 'AdminSeances',
    component: () => import('@/views/admin/AdminSeances.vue'),
    meta: {
      requiresAuth: true,
      roles: ['superAdmin', 'coordinateur']
    }
  },
  // Gestion Visioconférences Admin
  {
    path: '/admin/visioconferences',
    name: 'AdminVisio',
    component: () => import('@/views/admin/AdminVisio.vue'),
    meta: {
      requiresAuth: true,
      roles: ['superAdmin', 'coordinateur']
    }
  },
  // Statistiques Admin
  {
    path: '/admin/stats',
    name: 'AdminStats',
    component: () => import('@/views/admin/AdminStats.vue'),
    meta: {
      requiresAuth: true,
      roles: ['superAdmin', 'coordinateur']
    }
  },
  // Résultats Évaluations Admin/Coordinateur
  {
    path: '/admin/evaluations/results',
    name: 'AdminEvaluationResults',
    component: () => import('@/views/admin/AdminEvaluationResults.vue'),
    meta: {
      requiresAuth: true,
      roles: ['superAdmin', 'coordinateur']
    }
  },
  // Détails résultats d'une évaluation (tous les étudiants)
  {
    path: '/admin/evaluations/:id/details',
    name: 'AdminEvaluationDetails',
    component: () => import('@/views/admin/AdminEvaluationDetails.vue'),
    meta: {
      requiresAuth: true,
      roles: ['superAdmin', 'coordinateur']
    }
  },
  // Profil - Admin
  {
    path: '/admin/profile',
    name: 'admin-profile',
    component: () => import('@/views/admin/AdminProfile.vue'),
    meta: {
      requiresAuth: true,
      roles: ['superAdmin', 'coordinateur'],
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
      roles: ['superAdmin', 'coordinateur'],
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
  },
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
  },
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
  },
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

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Guard de navigation global (logique métier extraite dans ./guards)
router.beforeEach(navigationGuard)

export default router
