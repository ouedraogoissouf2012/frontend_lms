import axios from 'axios'

// Configuration de base
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

// Intercepteur pour ajouter le token automatiquement
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
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
    console.log('✅ API Response:', response.config.url, response.status)
    // Retourner la structure complète pour accéder à 'meta' et 'data'
    return response.data
  },
  (error) => {
    console.error('❌ API Error:', error.config?.url, error.response?.status, error.response?.data)

    // Si erreur 401, déconnecter l'utilisateur
    if (error.response?.status === 401) {
      console.warn('Session expirée - Déconnexion automatique')
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('meta')

      // Ne rediriger que si on n'est pas déjà sur la page de login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

// Fonctions d'authentification
export const auth = {
  async login(username, password) {
    console.log('🔐 auth.login() appelé avec username:', username)
    const response = await api.post('/auth/login', { username, password })
    console.log('📦 Réponse brute du serveur:', response)

    // Vérifier si la connexion a réussi
    if (response.success && response.data) {
      console.log('✅ Connexion réussie, stockage des données...')
      console.log('🔑 Token à stocker:', response.data.token)

      // Stocker le token KLASSCI
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))

      // Stocker les métadonnées (année universitaire, etc.)
      if (response.meta) {
        localStorage.setItem('meta', JSON.stringify(response.meta))
      }

      console.log('💾 Données stockées dans localStorage')
      console.log('🔑 Token vérifié:', localStorage.getItem('token'))
      console.log('👤 User vérifié:', localStorage.getItem('user'))
    } else {
      console.error('❌ Connexion échouée:', response)
    }

    return response
  },

  logout() {
    // Nettoyer le localStorage (pas besoin d'appeler l'API backend)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('meta')
    console.log('✅ localStorage nettoyé')
  },

  async me() {
    return await api.get('/auth/me')
  },

  getUser() {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  },

  getMeta() {
    const meta = localStorage.getItem('meta')
    return meta ? JSON.parse(meta) : null
  },

  isAuthenticated() {
    return !!localStorage.getItem('token')
  },

  // Obtenir le rôle de l'utilisateur
  getUserRole() {
    const user = this.getUser()
    return user?.role || null
  },

  // Vérifier si l'utilisateur a un rôle spécifique
  hasRole(roles) {
    const userRole = this.getUserRole()
    if (!userRole) return false
    const roleArray = Array.isArray(roles) ? roles : [roles]
    return roleArray.includes(userRole)
  },

  // Vérifier si admin
  isAdmin() {
    return this.hasRole(['superAdmin', 'coordinateur', 'secretaire'])
  },

  // Vérifier si enseignant
  isTeacher() {
    return this.hasRole(['enseignant', 'teacher'])
  },

  // Vérifier si étudiant
  isStudent() {
    return this.hasRole(['etudiant'])
  }
}

// Fonctions pour les leçons
export const lessons = {
  async getAll(params = {}) {
    return await api.get('/lessons', { params })
  },

  async getOne(id) {
    return await api.get(`/lessons/${id}`)
  },

  async create(data) {
    return await api.post('/lessons', data)
  },

  async update(id, data) {
    return await api.put(`/lessons/${id}`, data)
  },

  async delete(id) {
    return await api.delete(`/lessons/${id}`)
  }
}

// Fonctions pour les quiz
export const quizzes = {
  async getAll() {
    return await api.get('/quizzes')
  },

  async getOne(id) {
    return await api.get(`/quizzes/${id}`)
  },

  async startAttempt(quizId) {
    return await api.post(`/quizzes/${quizId}/attempts`)
  },

  async submitAttempt(attemptId, answers) {
    return await api.put(`/quizzes/attempts/${attemptId}/submit`, { answers })
  },

  async getMyAttempts(quizId) {
    return await api.get(`/quizzes/${quizId}/my-attempts`)
  }
}

// Fonctions pour le dashboard
export const dashboard = {
  async getStudentDashboard() {
    return await api.get('/dashboard/student')
  },

  async getTeacherDashboard() {
    return await api.get('/dashboard/teacher')
  },

  async getStats() {
    return await api.get('/dashboard/stats')
  }
}

// Fonctions pour les notifications
export const notifications = {
  async getAll(params = {}) {
    return await api.get('/notifications', { params })
  },

  async markAsRead(id) {
    return await api.post(`/notifications/${id}/read`)
  },

  async markAllAsRead() {
    return await api.post('/notifications/read-all')
  },

  async getUnreadCount() {
    return await api.get('/notifications/unread-count')
  }
}

// Fonctions pour le forum
export const forum = {
  async getCategories() {
    return await api.get('/forum/categories')
  },

  async getTopics(categoryId) {
    return await api.get(`/forum/categories/${categoryId}/topics`)
  },

  async getTopic(topicId) {
    return await api.get(`/forum/topics/${topicId}`)
  },

  async createTopic(data) {
    return await api.post('/forum/topics', data)
  },

  async replyToTopic(topicId, content) {
    return await api.post(`/forum/topics/${topicId}/posts`, { content })
  }
}

export default api
