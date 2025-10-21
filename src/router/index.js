import { createRouter, createWebHistory } from 'vue-router'
import { auth } from '@/services/api'

// Import des pages
import Login from '@/views/Login.vue'
import Dashboard from '@/views/Dashboard.vue'
import Lessons from '@/views/Lessons.vue'
import LessonView from '@/views/LessonView.vue'
import Quizzes from '@/views/Quizzes.vue'
import QuizTake from '@/views/QuizTake.vue'
import Forum from '@/views/Forum.vue'
import ForumTopic from '@/views/ForumTopic.vue'

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

// Import Matieres, Classes, Séances et Coordinateur
import MatiereDetails from '@/views/matieres/MatiereDetails.vue'
import ClasseDetails from '@/views/classes/ClasseDetails.vue'
import SeanceDetails from '@/views/seances/SeanceDetails.vue'
import SeanceManagement from '@/views/coordinateur/SeanceManagement.vue'
import TeacherSeances from '@/views/TeacherSeances.vue'

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
  // Dashboard Enseignant
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
  // Dashboard Étudiant
  {
    path: '/student/dashboard',
    name: 'StudentDashboard',
    component: StudentDashboard,
    meta: {
      requiresAuth: true,
      roles: ['etudiant']
    }
  },
  // Dashboard générique (fallback)
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/lessons',
    name: 'Lessons',
    component: Lessons,
    meta: { requiresAuth: true }
  },
  {
    path: '/lessons/:id',
    name: 'LessonView',
    component: LessonView,
    meta: { requiresAuth: true }
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
      roles: ['enseignant', 'teacher', 'coordinateur']
    }
  },
  {
    path: '/teacher/evaluations/create-questions',
    name: 'CreateQuestions',
    component: CreateQuestions,
    meta: {
      requiresAuth: true,
      roles: ['enseignant', 'teacher', 'coordinateur']
    }
  },
  {
    path: '/teacher/evaluations/:id/edit-questions',
    name: 'EditQuestions',
    component: CreateQuestions,
    meta: {
      requiresAuth: true,
      roles: ['enseignant', 'teacher', 'coordinateur']
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
  // Matières - Navigation hiérarchique
  {
    path: '/matieres/:id',
    name: 'matiere-details',
    component: MatiereDetails,
    meta: { requiresAuth: true }
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
    path: '/seances/:id',
    name: 'seance-details',
    component: SeanceDetails,
    meta: { requiresAuth: true }
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
