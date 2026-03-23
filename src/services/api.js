import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
})

// Intercepteur : ajouter uniquement le token Bearer
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token')
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
    console.error('❌ API Error:', error.config?.url, error.response?.status)

    // Si erreur 401, déconnecter l'utilisateur
    if (error.response?.status === 401) {
      console.warn('Session expirée - Déconnexion automatique')
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('user')
      sessionStorage.removeItem('meta')

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
    const response = await api.post('/auth/login', { username, password })

    if (response.success && response.data) {
      sessionStorage.setItem('token', response.data.token)
      sessionStorage.setItem('user', JSON.stringify(response.data.user))

      if (response.meta) {
        sessionStorage.setItem('meta', JSON.stringify(response.meta))
        if (response.meta.institution) {
          sessionStorage.setItem('institution', response.meta.institution)
        }
      }
    }

    return response
  },

  logout() {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    sessionStorage.removeItem('meta')
    sessionStorage.removeItem('institution')
    localStorage.removeItem('student_dashboard_cache')
  },

  async me() {
    return await api.get('/auth/me')
  },

  getUser() {
    const user = sessionStorage.getItem('user')
    return user ? JSON.parse(user) : null
  },

  getMeta() {
    const meta = sessionStorage.getItem('meta')
    return meta ? JSON.parse(meta) : null
  },

  isAuthenticated() {
    return !!sessionStorage.getItem('token')
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
  },

  // Obtenir le slug de l'institution depuis les métadonnées de session
  getInstitution() {
    const meta = this.getMeta()
    return meta?.institution || sessionStorage.getItem('institution') || null
  },

  // Obtenir le nom de l'institution depuis les métadonnées
  getInstitutionName() {
    const meta = this.getMeta()
    return meta?.institution_name || null
  },

  // Vérifier si l'utilisateur est supradmin
  isSupradmin() {
    return this.hasRole(['supradmin'])
  },

  // Récupérer la liste des institutions actives (route publique)
  async getActiveInstitutions() {
    return await api.get('/institutions/active')
  },

  // Changer l'institution courante (local dev uniquement)
  setInstitution(slug) {
    sessionStorage.setItem('institution', slug)
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
  async getTopics(params = {}) {
    const queryParams = new URLSearchParams()
    if (params.lesson_id) queryParams.append('lesson_id', params.lesson_id)
    if (params.matiere_id) queryParams.append('matiere_id', params.matiere_id)
    if (params.classe_id) queryParams.append('classe_id', params.classe_id)
    if (params.status) queryParams.append('status', params.status)
    if (params.sort) queryParams.append('sort', params.sort)

    const queryString = queryParams.toString()
    const url = queryString ? `/forum/topics?${queryString}` : '/forum/topics'
    return await api.get(url)
  },

  async getTopic(topicId) {
    return await api.get(`/forum/topics/${topicId}`)
  },

  async createTopic(data) {
    return await api.post('/forum/topics', data)
  },

  async replyToTopic(topicId, content) {
    return await api.post(`/forum/topics/${topicId}/posts`, { content })
  },

  async updateTopic(topicId, data) {
    return await api.put(`/forum/topics/${topicId}`, data)
  },

  async deleteTopic(topicId) {
    return await api.delete(`/forum/topics/${topicId}`)
  },

  async updatePost(postId, content) {
    return await api.put(`/forum/posts/${postId}`, { content })
  },

  async deletePost(postId) {
    return await api.delete(`/forum/posts/${postId}`)
  },

  async markAsSolution(postId) {
    return await api.post(`/forum/posts/${postId}/solution`)
  },

  async closeTopic(topicId) {
    return await api.post(`/forum/topics/${topicId}/close`)
  },

  async pinTopic(topicId) {
    return await api.post(`/forum/topics/${topicId}/pin`)
  }
}

// Teacher Stats
export const teacherStats = {
  async getStats() {
    const response = await api.get('/teacher/stats')
    return response.data
  }
}

// Institution Management (superAdmin uniquement)
export const institutions = {
  async getAll() {
    return await api.get('/admin/institutions')
  },

  async getOne(id) {
    return await api.get(`/admin/institutions/${id}`)
  },

  async create(data) {
    return await api.post('/admin/institutions', data)
  },

  async update(id, data) {
    return await api.put(`/admin/institutions/${id}`, data)
  },

  async toggle(id) {
    return await api.patch(`/admin/institutions/${id}/toggle`)
  },

  async testConnection(id) {
    return await api.post(`/admin/institutions/${id}/test-connection`)
  },

  async delete(id) {
    return await api.delete(`/admin/institutions/${id}`)
  }
}

export default api
