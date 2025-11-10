import { createRouter, createWebHistory } from 'vue-router'
import { auth } from '@/services/api'

// Import des pages
import Login from '@/views/Login.vue'
import Dashboard from '@/views/Dashboard.vue'
import Quizzes from '@/views/Quizzes.vue'
import QuizTake from '@/views/QuizTake.vue'
import Forum from '@/views/Forum.vue'
import ForumTopic from '@/views/ForumTopic.vue'

// Import Lessons
import StudentLessonView from '@/views/lessons/StudentLessonView.vue'

// Import des dashboards par rôle
import AdminDashboard from '@/views/dashboards/AdminDashboard.vue'
import TeacherDashboard from '@/views/dashboards/TeacherDashboard.vue'
import StudentDashboard from '@/views/dashboards/StudentDashboard.vue'

// Import Visioconférence
import VideoConference from '@/views/VideoConference.vue'

// Import Évaluations
import TeacherEvaluations from '@/views/evaluations/TeacherEvaluations.vue'
import CreateQuestions from '@/views/evaluations/CreateQuestions.vue'
import StudentEvaluations from '@/views/evaluations/StudentEvaluations.vue'
import TakeEvaluation from '@/views/evaluations/TakeEvaluation.vue'
import PreviewEvaluation from '@/views/evaluations/PreviewEvaluation.vue'
import EvaluationResults from '@/views/evaluations/EvaluationResults.vue'

// Import Matières, Classes, Séances et Coordinateur
import MatiereDetails from '@/views/matieres/MatiereDetails.vue'
import ClasseDetails from '@/views/classes/ClasseDetails.vue'
import SeanceDetails from '@/views/seances/SeanceDetails.vue'
import SeanceManagement from '@/views/coordinateur/SeanceManagement.vue'
import CoordinatorEvaluations from '@/views/coordinateur/CoordinatorEvaluations.vue'
import TeacherSeances from '@/views/TeacherSeances.vue'

// Import des nouvelles vues Enseignant et Admin
import TeacherClasses from '@/views/teacher/TeacherClasses.vue'
import TeacherStats from '@/views/teacher/TeacherStats.vue'
import EvaluationCorrections from '@/views/teacher/EvaluationCorrections.vue'
import AdminUsers from '@/views/admin/AdminUsers.vue'
import AdminClasses from '@/views/admin/AdminClasses.vue'
import AdminMatieres from '@/views/admin/AdminMatieres.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { guest: true }
  },
  // Redirection / vers dashboard approprié
  {
    path: '/',
    redirect: () => {
      const user = auth.getUser()
      if (!user) return '/login'

      // Redirection selon le rôle
      if (['superAdmin', 'coordinateur', 'secretaire'].includes(user.role)) {
        return '/admin/dashboard'
      } else if (['enseignant', 'teacher'].includes(user.role)) {
        return '/teacher/dashboard'
      } else if (user.role === 'etudiant') {
        return '/student/dashboard'
      }
      return '/dashboard'
    }
  },
  // Dashboard Admin
  {
    path: '/admin/dashboard',
    name: 'AdminDashboard',
    component: AdminDashboard,
    meta: {
      requiresAuth: true,
      roles: ['superAdmin', 'coordinateur', 'secretaire']
    }
  },
  // Gestion Utilisateurs Admin
  {
    path: '/admin/users',
    name: 'AdminUsers',
    component: AdminUsers,
    meta: {
      requiresAuth: true,
      roles: ['superAdmin', 'coordinateur']
    }
  },
  // Gestion Classes Admin
  {
    path: '/admin/classes',
    name: 'AdminClasses',
    component: AdminClasses,
    meta: {
      requiresAuth: true,
      roles: ['superAdmin', 'coordinateur']
    }
  },
  // Gestion Matières Admin
  {
    path: '/admin/matieres',
    name: 'AdminMatieres',
    component: AdminMatieres,
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
  // Dashboard Enseignant
  {
    path: '/teacher',
    redirect: '/teacher/dashboard'
  },
  {
    path: '/teacher/dashboard',
    name: 'TeacherDashboard',
    component: TeacherDashboard,
    meta: {
      requiresAuth: true,
      roles: ['enseignant', 'teacher']
    }
  },
  // Séances Enseignant
  {
    path: '/teacher/seances',
    name: 'TeacherSeances',
    component: TeacherSeances,
    meta: {
      requiresAuth: true,
      roles: ['enseignant', 'teacher']
    }
  },
  // Classes Enseignant
  {
    path: '/teacher/classes',
    name: 'TeacherClasses',
    component: TeacherClasses,
    meta: {
      requiresAuth: true,
      roles: ['enseignant', 'teacher']
    }
  },
  // Statistiques Enseignant
  {
    path: '/teacher/stats',
    name: 'TeacherStats',
    component: TeacherStats,
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
    component: EvaluationCorrections,
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
    component: StudentDashboard,
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
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  // Leçons - Étudiants
  {
    path: '/lessons/:id',
    name: 'LessonView',
    component: StudentLessonView,
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
    component: Quizzes,
    meta: { requiresAuth: true }
  },
  {
    path: '/quizzes/:id/take',
    name: 'QuizTake',
    component: QuizTake,
    meta: { requiresAuth: true }
  },
  {
    path: '/forum',
    name: 'Forum',
    component: Forum,
    meta: { requiresAuth: true }
  },
  {
    path: '/forum/topics/:id',
    name: 'ForumTopic',
    component: ForumTopic,
    meta: { requiresAuth: true }
  },
  // Visioconférence
  {
    path: '/video-conference/:roomName',
    name: 'VideoConference',
    component: VideoConference,
    meta: { requiresAuth: true }
  },
  // Évaluations - Enseignant
  {
    path: '/teacher/evaluations',
    name: 'TeacherEvaluations',
    component: TeacherEvaluations,
    meta: {
      requiresAuth: true,
      roles: ['enseignant', 'teacher']
    }
  },
  {
    path: '/teacher/evaluations/create',
    redirect: '/teacher/evaluations/create-questions'
  },
  {
    path: '/teacher/evaluations/create-questions',
    name: 'CreateQuestions',
    component: CreateQuestions,
    meta: {
      requiresAuth: true,
      roles: ['enseignant', 'teacher']
    }
  },
  {
    path: '/teacher/evaluations/:id/edit-questions',
    name: 'EditQuestions',
    component: CreateQuestions,
    meta: {
      requiresAuth: true,
      roles: ['enseignant', 'teacher']
    }
  },
  // Évaluations - Étudiant
  {
    path: '/student/evaluations',
    name: 'StudentEvaluations',
    component: StudentEvaluations,
    meta: {
      requiresAuth: true,
      roles: ['etudiant']
    }
  },
  {
    path: '/student/evaluations/:id/take',
    name: 'TakeEvaluation',
    component: TakeEvaluation,
    meta: {
      requiresAuth: true,
      roles: ['etudiant']
    }
  },
  {
    path: '/student/evaluations/:id/results',
    name: 'EvaluationResults',
    component: EvaluationResults,
    meta: {
      requiresAuth: true,
      roles: ['etudiant']
    }
  },
  {
    path: '/teacher/evaluations/:id/preview',
    name: 'PreviewEvaluation',
    component: PreviewEvaluation,
    meta: {
      requiresAuth: true,
      roles: ['enseignant']
    }
  },
  // Coordinateur - Prévisualisation évaluation (seulement si terminée - contrôlé par le backend)
  {
    path: '/coordinateur/evaluations/:id/preview',
    name: 'CoordinatorPreviewEvaluation',
    component: PreviewEvaluation,
    meta: {
      requiresAuth: true,
      roles: ['coordinateur', 'superAdmin']
    }
  },
  // Matières - Navigation hiérarchique (AVEC LAYOUT MODERNE)
  {
    path: '/matieres/:id',
    name: 'matiere-details',
    component: MatiereDetails,
    meta: {
      requiresAuth: true,
      title: 'Détails Matière'
    }
  },
  // Classes - Détails complets
  {
    path: '/classes/:id',
    name: 'classe-details',
    component: ClasseDetails,
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
    component: SeanceDetails,
    meta: { requiresAuth: true }
  },
  // Coordinateur - Gestion des évaluations
  {
    path: '/coordinateur/evaluations',
    name: 'coordinator-evaluations',
    component: CoordinatorEvaluations,
    meta: {
      requiresAuth: true,
      roles: ['coordinateur', 'superAdmin']
    }
  },

  // Coordinateur - Gestion des séances et visio
  {
    path: '/coordinateur/seances',
    name: 'seance-management',
    component: SeanceManagement,
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

// Guard de navigation amélioré
router.beforeEach((to, from, next) => {
  const isAuthenticated = auth.isAuthenticated()
  const user = auth.getUser()

  console.log('🛣️ Navigation:', from.path, '→', to.path)
  console.log('🔒 isAuthenticated:', isAuthenticated, 'User:', user?.name, 'Role:', user?.role)

  // Si la route nécessite l'authentification
  if (to.meta.requiresAuth && !isAuthenticated) {
    console.warn('⛔ Route protégée sans authentification → Redirect /login')
    next('/login')
    return
  }

  // Si l'utilisateur est connecté et va sur login
  if (to.meta.guest && isAuthenticated) {
    // Rediriger vers le dashboard approprié
    if (user) {
      if (['superAdmin', 'coordinateur', 'secretaire'].includes(user.role)) {
        next('/admin/dashboard')
      } else if (['enseignant', 'teacher'].includes(user.role)) {
        next('/teacher/dashboard')
      } else if (user.role === 'etudiant') {
        next('/student/dashboard')
      } else {
        next('/dashboard')
      }
    } else {
      next('/dashboard')
    }
    return
  }

  // Vérifier les rôles requis pour la route
  if (to.meta.roles && user) {
    const hasRequiredRole = to.meta.roles.includes(user.role)
    if (!hasRequiredRole) {
      // Rediriger vers le dashboard approprié si rôle incorrect
      if (['superAdmin', 'coordinateur', 'secretaire'].includes(user.role)) {
        next('/admin/dashboard')
      } else if (['enseignant', 'teacher'].includes(user.role)) {
        next('/teacher/dashboard')
      } else if (user.role === 'etudiant') {
        next('/student/dashboard')
      } else {
        next('/dashboard')
      }
      return
    }
  }

  // Laisser passer
  next()
})

export default router
