/**
 * Service pour interagir avec les données KLASSCI via le proxy LMS
 */
import api from './api'

export const klassciService = {
  /**
   * Récupérer toutes les classes depuis KLASSCI
   * @returns {Promise<Array>} Liste des classes
   */
  async getClasses() {
    try {
      const response = await api.get('/proxy/classes')
      return response.success ? response.data : []
    } catch (error) {
      console.error('Erreur récupération classes:', error)
      throw error
    }
  },

  /**
   * Récupérer toutes les matières depuis KLASSCI
   * @returns {Promise<Array>} Liste des matières
   */
  async getMatieres() {
    try {
      const response = await api.get('/proxy/matieres')
      return response.success ? response.data : []
    } catch (error) {
      console.error('Erreur récupération matières:', error)
      throw error
    }
  },

  /**
   * Récupérer tous les enseignants depuis KLASSCI
   * @returns {Promise<Array>} Liste des enseignants
   */
  async getEnseignants() {
    try {
      const response = await api.get('/proxy/enseignants')
      console.log('🔍 DEBUG getEnseignants - Réponse complète:', response)
      console.log('🔍 DEBUG getEnseignants - response.success:', response.success)
      console.log('🔍 DEBUG getEnseignants - response.data:', response.data)
      console.log('🔍 DEBUG getEnseignants - Type de response.data:', Array.isArray(response.data) ? 'Array' : typeof response.data)

      // Vérifier différentes structures possibles
      if (response.success && response.data) {
        return response.data
      } else if (Array.isArray(response)) {
        return response
      } else if (response.data && Array.isArray(response.data)) {
        return response.data
      } else {
        console.warn('⚠️ Structure de réponse inattendue pour enseignants')
        return []
      }
    } catch (error) {
      console.error('Erreur récupération enseignants:', error)
      throw error
    }
  },

  /**
   * Récupérer l'emploi du temps depuis KLASSCI
   * @param {Object} filters - Filtres optionnels (classe_id, enseignant_id, etc.)
   * @returns {Promise<Array>} Liste des séances d'emploi du temps
   */
  async getEmploiTemps(filters = {}) {
    try {
      const response = await api.get('/proxy/emploi-temps', { params: filters })
      return response.success ? response.data : []
    } catch (error) {
      console.error('Erreur récupération emploi du temps:', error)
      throw error
    }
  },

  /**
   * Récupérer les détails d'une classe spécifique
   * @param {number} classeId - ID de la classe
   * @returns {Promise<Object>} Détails de la classe
   */
  async getClasseDetails(classeId) {
    try {
      const response = await api.get(`/proxy/classes/${classeId}`)
      return response.success ? response.data : null
    } catch (error) {
      console.error(`Erreur récupération classe ${classeId}:`, error)
      throw error
    }
  },

  /**
   * Récupérer les étudiants d'une classe
   * @param {number} classeId - ID de la classe
   * @returns {Promise<Array>} Liste des étudiants
   */
  async getClasseEtudiants(classeId) {
    try {
      const response = await api.get(`/proxy/classes/${classeId}/etudiants`)
      return response.success ? response.data : []
    } catch (error) {
      console.error(`Erreur récupération étudiants classe ${classeId}:`, error)
      throw error
    }
  },

  /**
   * Récupérer les détails d'une matière spécifique
   * @param {number} matiereId - ID de la matière
   * @returns {Promise<Object>} Détails de la matière
   */
  async getMatiereDetails(matiereId) {
    try {
      const response = await api.get(`/proxy/matieres/${matiereId}`)
      return response.success ? response.data : null
    } catch (error) {
      console.error(`Erreur récupération matière ${matiereId}:`, error)
      throw error
    }
  },

  /**
   * Récupérer les détails d'une matière depuis le LMS (avec leçons, stats, etc.)
   * @param {number} matiereId - ID de la matière
   * @returns {Promise<Object>} Détails de la matière avec données LMS
   */
  async getLmsMatiereDetails(matiereId) {
    try {
      const response = await api.get(`/lms/matieres/${matiereId}`)
      return response // Retourne l'objet complet avec success, data, etc.
    } catch (error) {
      console.error(`Erreur récupération matière LMS ${matiereId}:`, error)
      throw error
    }
  },

  /**
   * Récupérer la liste des enseignants depuis le LMS (avec classes, matières, stats, etc.)
   * @param {Object} params - Paramètres optionnels
   * @param {boolean} params.with_details - Activer le format enrichi (défaut: false)
   * @param {number} params.filiere_id - Filtrer par filière
   * @param {number} params.niveau_id - Filtrer par niveau
   * @param {number} params.classe_id - Filtrer par classe
   * @param {number} params.matiere_id - Filtrer par matière
   * @returns {Promise<Object>} Liste des enseignants avec données LMS
   *
   * Format simple (with_details=false):
   * { success: true, data: [{ id, teacher_id, nom, email, role, matricule, specialization, status }] }
   *
   * Format enrichi (with_details=true):
   * { success: true, data: [{
   *   id, teacher_id, nom, email, role, matricule, specialization, status,
   *   classes: [{ id, nom, filiere: {...}, niveau: {...} }],
   *   matieres: [{ id, nom, code, heures_prevues, heures_effectuees, heures_restantes,
   *                taux_realisation, nb_seances_total, nb_seances_effectuees,
   *                classes: [...], seances: [...] }],
   *   statistiques: { total_classes, total_matieres, total_heures_prevues,
   *                   total_heures_effectuees, total_heures_restantes,
   *                   taux_realisation_global, nb_seances_total, nb_seances_effectuees }
   * }] }
   */
  async getLmsEnseignants(params = {}) {
    try {
      console.log('[KlassciService] Appel getLmsEnseignants avec params:', params)
      const response = await api.get('/lms/enseignants', { params })
      console.log('[KlassciService] Réponse getLmsEnseignants:', response)
      return response // Retourne l'objet complet avec success, data, etc.
    } catch (error) {
      console.error('[KlassciService] Erreur récupération enseignants LMS:', error)
      throw error
    }
  },

  /**
   * Rechercher dans KLASSCI
   * @param {string} query - Terme de recherche
   * @param {string} type - Type de recherche (classes, matieres, etudiants, enseignants)
   * @returns {Promise<Array>} Résultats de recherche
   */
  async search(query, type = 'all') {
    try {
      const response = await api.get('/proxy/search', {
        params: { q: query, type }
      })
      return response.success ? response.data : []
    } catch (error) {
      console.error('Erreur recherche KLASSCI:', error)
      throw error
    }
  },

  /**
   * Récupérer les séances à venir depuis KLASSCI
   * @param {Object} filters - Filtres optionnels (days, teacher_id, classe_id)
   * @returns {Promise<Array>} Liste des séances enrichies avec infos visio
   */
  async getUpcomingSeances(filters = {}) {
    try {
      const response = await api.get('/lms/seances/upcoming', { params: filters })
      return response.success ? response.data : []
    } catch (error) {
      console.error('Erreur récupération séances à venir:', error)
      throw error
    }
  },

  /**
   * Récupérer le dashboard complet de l'étudiant connecté depuis KLASSCI
   * Retourne: classe, cours (matières), quiz (évaluations), notes, statistiques
   * @returns {Promise<Object>} Dashboard complet de l'étudiant
   */
  async getStudentDashboard() {
    try {
      const response = await api.get('/proxy/me/dashboard')
      return response.success ? response.data : null
    } catch (error) {
      console.error('Erreur récupération dashboard étudiant:', error)
      throw error
    }
  },

  /**
   * Récupérer le dashboard complet de l'enseignant connecté depuis KLASSCI
   * Retourne: matieres, classes, evaluations, seances, statistiques
   * @returns {Promise<Object>} Dashboard complet de l'enseignant
   */
  async getTeacherDashboard() {
    try {
      const response = await api.get('/proxy/me/teacher-dashboard')
      return response.success ? response.data : null
    } catch (error) {
      console.error('Erreur récupération dashboard enseignant:', error)
      throw error
    }
  },

  /**
   * Récupérer les évaluations depuis KLASSCI
   * @param {Object} filters - Filtres optionnels (matiere_id, classe_id, statut)
   * @returns {Promise<Object>} Évaluations avec success flag
   */
  async getEvaluations(filters = {}) {
    try {
      const response = await api.get('/proxy/evaluations', { params: filters })
      return { success: true, data: response.data || response }
    } catch (error) {
      console.error('Erreur récupération évaluations KLASSCI:', error)
      throw error
    }
  },

  /**
   * Récupérer toutes les évaluations de l'étudiant connecté (toutes matières confondues)
   * @returns {Promise<Array>} Liste des évaluations
   */
  async getMyEvaluations() {
    try {
      const response = await api.get('/evaluations/student')
      return response.success ? response.data : []
    } catch (error) {
      console.error('Erreur récupération mes évaluations:', error)
      throw error
    }
  },

  /**
   * Récupérer toutes les visioconférences de l'étudiant (prévues + en cours)
   * @returns {Promise<Array>} Liste des visioconférences
   */
  async getMyVisioConferences() {
    try {
      const response = await api.get('/lms/seances/my-classes')
      return response.success ? response.data : []
    } catch (error) {
      console.error('Erreur récupération mes visioconférences:', error)
      throw error
    }
  },

  /**
   * Récupérer tous les cours de l'étudiant connecté
   * @returns {Promise<Array>} Liste des cours/matières
   */
  async getMyCourses() {
    try {
      const dashboard = await this.getStudentDashboard()
      return dashboard?.cours || []
    } catch (error) {
      console.error('Erreur récupération mes cours:', error)
      throw error
    }
  },

  /**
   * Récupérer la structure organisationnelle (filières, niveaux) depuis KLASSCI
   * @returns {Promise<Object>} Structure avec filieres et niveaux_etude
   */
  async getStructure() {
    try {
      const response = await api.get('/proxy/structure')
      return response.success ? response.data : { filieres: [], niveaux_etude: [] }
    } catch (error) {
      console.error('Erreur récupération structure:', error)
      throw error
    }
  },

  /**
   * Récupérer toutes les matières avec combinaisons complètes (admin/coordinateur)
   * @returns {Promise<Object>} Liste des matières enrichies
   */
  async getAdminMatieres() {
    try {
      const response = await api.get('/admin/matieres')
      return response
    } catch (error) {
      console.error('Erreur récupération matières admin:', error)
      throw error
    }
  }
}

export default klassciService
