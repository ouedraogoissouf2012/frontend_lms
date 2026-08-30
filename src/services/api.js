import axios from 'axios'
import notificationsService from './notifications'
// Imports relatifs (pas l'alias @) : le runner natif des tests de contrat (#17) ne
// résout que les chemins relatifs.
import { hasRole as roleHasRole } from '../constants/roles'
import { normalizeError, logError, shouldForceLogout } from './errorHandler'
// Carte unique des chemins d'API (#105/#110) — source de vérité des URLs.
import { endpoints } from './endpoints'
import { apiBaseUrl, API_TIMEOUT_MS } from '../constants/http'
// useAuthStore : on importe la DÉFINITION au top-level (sûr) ; on n'APPELLE
// useAuthStore() qu'à la volée dans les méthodes (Pinia actif à l'exécution).
// Cycle api.js <-> auth.js sans danger : aucune des deux références n'est utilisée
// au chargement du module, seulement dans les corps de fonctions (#19, décision C/D).
import { useAuthStore } from '../stores/auth'

const api = axios.create({
  // Base unique : en dev, `/api` passe par le proxy Vite et évite les faux CORS
  // locaux ; en prod, VITE_API_URL reste obligatoire via apiBaseUrl().
  baseURL: apiBaseUrl(),
  // Sans ceci, axios attend INDÉFINIMENT (défaut `timeout: 0`) : une requête que
  // le serveur ne termine jamais figeait l'écran sur son spinner, sans erreur ni
  // moyen de réessayer. Le timeout garantit une sortie, normalisée en catégorie
  // `timeout` par errorHandler (message distinct d'une panne réseau).
  timeout: API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
})

// Intercepteur : ajouter uniquement le token Bearer
api.interceptors.request.use(
  (config) => {
    // Token lu DEPUIS le store à la volée (#19) — source unique, fin du mix
    // localStorage/sessionStorage. useAuthStore() est sûr ici : l'intercepteur
    // s'exécute à chaque requête, donc après le montage (Pinia actif).
    const token = useAuthStore().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => {
    // Retourner la structure complète pour accéder à 'meta' et 'data'
    return response.data
  },
  (error) => {
    // Journalisation sûre (sans donnée sensible, désactivée en prod) — #20
    logError(error, '[api.js] response interceptor')

    // Attacher un message utilisateur SÛR normalisé pour que tout appelant l'ait
    // prêt à afficher (et les erreurs de champ 422), sans changer le flux de rejet.
    const normalized = normalizeError(error)
    error.userMessage = normalized.userMessage
    error.fieldErrors = normalized.fieldErrors

    // Déconnexion seulement si le 401 invalide vraiment la session locale (décision
    // pure et testée). Un 401 de proxy KLASSCI ne doit PAS éjecter l'utilisateur.
    if (shouldForceLogout(error)) {
      useAuthStore().logout()

      // Ne rediriger que si on n'est pas déjà sur la page de login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

// Façade d'authentification — délègue au store Pinia useAuthStore (#19).
// L'état (user/token/meta/institution) vit DANS le store ; cette façade conserve
// l'API publique consommée par 32 fichiers (88 appels) sans la réécrire. Chaque
// méthode appelle useAuthStore() À LA VOLÉE (Pinia actif à l'exécution).
export const auth = {
  login: (username, password) => useAuthStore().login(username, password),
  logout: () => useAuthStore().logout(),
  me: () => useAuthStore().me(),
  getUser: () => useAuthStore().currentUser,
  getMeta: () => useAuthStore().meta,
  isAuthenticated: () => useAuthStore().isAuthenticated,
  getUserRole: () => useAuthStore().userRole,
  // hasRole délègue au helper normalisé (pas de réimplémentation, #18)
  hasRole: (roles) => roleHasRole(useAuthStore().currentUser, roles),
  isAdmin: () => useAuthStore().isAdmin,
  isTeacher: () => useAuthStore().isTeacher,
  isStudent: () => useAuthStore().isStudent,
  isSupradmin: () => useAuthStore().isSupradmin,
  getInstitution: () => useAuthStore().institutionSlug,
  getInstitutionName: () => useAuthStore().institutionDisplayName,
  setInstitution: (slug) => useAuthStore().setInstitution(slug),
  getActiveInstitutions: () => useAuthStore().fetchActiveInstitutions(),
}

// Fonctions pour les leçons
export const lessons = {
  async getAll(params = {}) {
    return await api.get(endpoints.lessons.list, { params })
  },

  async getOne(id) {
    return await api.get(endpoints.lessons.details(id))
  },

  async create(data) {
    return await api.post(endpoints.lessons.list, data)
  },

  async update(id, data) {
    return await api.put(endpoints.lessons.details(id), data)
  },

  async delete(id) {
    return await api.delete(endpoints.lessons.details(id))
  }
}

// Fonctions pour les quiz
export const quizzes = {
  async getAll() {
    return await api.get(endpoints.quizzes.list)
  },

  async getOne(id) {
    return await api.get(endpoints.quizzes.details(id))
  },

  async startAttempt(quizId) {
    return await api.post(endpoints.quizzes.start(quizId))
  },

  async submitAttempt(attemptId, answers) {
    // Backend : POST /quiz-attempts/{id}/submit, corps { answers } (SubmitQuizAttemptRequest)
    return await api.post(endpoints.quizzes.submitAttempt(attemptId), { answers })
  }
  // getMyAttempts supprimée (#17 Ék-3) : route /quizzes/{id}/my-attempts inexistante,
  // aucun consommateur. La consultation d'une tentative est GET /quiz-attempts/{id}.
}

// Fonctions pour le dashboard
export const dashboard = {
  async getStudentDashboard() {
    return await api.get(endpoints.dashboard.student)
  },

  async getTeacherDashboard() {
    return await api.get(endpoints.dashboard.teacher)
  },

  async getStats() {
    return await api.get(endpoints.dashboard.stats)
  }
}

// Notifications — façade de compatibilité (#17 Ék-4/Ék-5, dédup R6).
// Le client canonique est notificationsService (src/services/notifications.js),
// qui porte les chemins corrects (/mark-as-read, /mark-all-as-read). Cet export
// reste pour les imports existants (ex. Dashboard.vue), mais délègue au canonique.
// Les anciennes méthodes markAsRead/markAllAsRead aux chemins erronés sont retirées.
export const notifications = {
  // getAll retourne le tableau de notifications (Dashboard.vue fait Array.isArray(...)).
  async getAll(params = {}) {
    const res = await notificationsService.getNotifications(1, params.limit ?? 10, false)
    return res?.data ?? []
  },

  getUnreadCount() {
    return notificationsService.getUnreadCount()
  }
}

// Fonctions pour le forum
export const forum = {
  async getTopics(params = {}) {
    const queryParams = new URLSearchParams()
    if (params.lesson_id) queryParams.append('lesson_id', params.lesson_id)
    if (params.matiere_id) queryParams.append('matiere_id', params.matiere_id)
    if (params.classe_id) queryParams.append('classe_id', params.classe_id)
    if (params.status) queryParams.append('status', params.status)
    if (params.sort) queryParams.append('sort', params.sort)

    const queryString = queryParams.toString()
    const url = queryString ? `${endpoints.forum.topics}?${queryString}` : endpoints.forum.topics
    return await api.get(url)
  },

  async getTopic(topicId) {
    return await api.get(endpoints.forum.topic(topicId))
  },

  async createTopic(data) {
    return await api.post(endpoints.forum.topics, data)
  },

  async replyToTopic(topicId, content) {
    return await api.post(endpoints.forum.topicPosts(topicId), { content })
  },

  async updateTopic(topicId, data) {
    return await api.put(endpoints.forum.topic(topicId), data)
  },

  async deleteTopic(topicId) {
    return await api.delete(endpoints.forum.topic(topicId))
  },

  async updatePost(postId, content) {
    return await api.put(endpoints.forum.post(postId), { content })
  },

  async deletePost(postId) {
    return await api.delete(endpoints.forum.post(postId))
  },

  async markAsSolution(postId) {
    return await api.post(endpoints.forum.postSolution(postId))
  },

  async closeTopic(topicId) {
    return await api.post(endpoints.forum.closeTopic(topicId))
  },

  async pinTopic(topicId) {
    return await api.post(endpoints.forum.pinTopic(topicId))
  }
}

// Teacher Stats
export const teacherStats = {
  async getStats() {
    const response = await api.get(endpoints.teacher.stats)
    return response.data
  }
}

// Institution Management (superAdmin uniquement)
export const institutions = {
  async getAll() {
    return await api.get(endpoints.admin.institutions.list)
  },

  async getOne(id) {
    return await api.get(endpoints.admin.institutions.details(id))
  },

  async create(data) {
    return await api.post(endpoints.admin.institutions.list, data)
  },

  async update(id, data) {
    return await api.put(endpoints.admin.institutions.details(id), data)
  },

  async toggle(id) {
    return await api.patch(endpoints.admin.institutions.toggle(id))
  },

  async testConnection(id) {
    return await api.post(endpoints.admin.institutions.testConnection(id))
  },

  async delete(id) {
    return await api.delete(endpoints.admin.institutions.details(id))
  }
}

export default api
