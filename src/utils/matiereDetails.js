import { hasRole, isStudent, isTeacher, ROLES } from '@/constants/roles'

/**
 * Logique métier PURE des détails d'une matière (#28).
 *
 * Extraite de `views/matieres/MatiereDetails.vue` (god-component) : durée d'une
 * séance et mappers de statut (séance / fenêtre d'évaluation). Fonctions pures.
 */

/**
 * Durée d'une séance en minutes, depuis programmation.heure_debut/fin (ISO 8601).
 * @param {Object} seance
 * @returns {number} minutes (0 si données manquantes/invalides)
 */
export function calculateSeanceDuration(seance) {
  if (!seance.programmation?.heure_debut || !seance.programmation?.heure_fin) return 0
  const debut = new Date(seance.programmation.heure_debut)
  const fin = new Date(seance.programmation.heure_fin)
  if (isNaN(debut.getTime()) || isNaN(fin.getTime())) return 0
  return Math.round((fin - debut) / 60000)
}

/**
 * Classe CSS de statut d'une séance (à venir / en cours / terminé / passé).
 * @param {Object} seance - { date_seance, heure_debut, heure_fin, statut }
 * @returns {string}
 */
export function getSeanceStatusClass(seance) {
  const now = new Date()
  const seanceDate = new Date(`${seance.date_seance} ${seance.heure_debut}`)
  const seanceEnd = new Date(`${seance.date_seance} ${seance.heure_fin}`)

  if (now < seanceDate) return 'bg-orange-100 text-orange-700'
  if (now >= seanceDate && now <= seanceEnd) return 'bg-green-100 text-green-700'
  if (seance.statut === 'realise') return 'bg-blue-100 text-blue-700'
  return 'bg-gray-100 text-gray-700'
}

/**
 * Libellé de statut d'une séance.
 * @param {Object} seance
 * @returns {string}
 */
export function getSeanceStatusLabel(seance) {
  const now = new Date()
  const seanceDate = new Date(`${seance.date_seance} ${seance.heure_debut}`)
  const seanceEnd = new Date(`${seance.date_seance} ${seance.heure_fin}`)

  if (now < seanceDate) return 'À venir'
  if (now >= seanceDate && now <= seanceEnd) return 'En cours'
  if (seance.statut === 'realise') return 'Terminé'
  return 'Passé'
}

/**
 * Classe CSS de statut d'une fenêtre d'évaluation.
 * @param {{ has_started:boolean, is_open:boolean }} window
 * @returns {string}
 */
export function getEvaluationStatusClass(window) {
  if (!window.has_started) return 'bg-orange-100 text-orange-700'
  if (window.is_open) return 'bg-green-100 text-green-700'
  return 'bg-gray-100 text-gray-700'
}

/**
 * Libellé de statut d'une fenêtre d'évaluation.
 * @param {{ has_started:boolean, is_open:boolean }} window
 * @returns {string}
 */
export function getEvaluationStatusLabel(window) {
  if (!window.has_started) return 'Pas encore ouverte'
  if (window.is_open) return 'Ouverte'
  return 'Fermée'
}

/**
 * Fabrique l'état initial d'une nouvelle leçon (formulaire du modal de création).
 * Centralise le littéral autrefois dupliqué 3× dans MatiereDetails.vue (data,
 * ouverture et fermeture du modal) → une seule source de vérité.
 * @returns {Object} brouillon de leçon vierge
 */
export function createEmptyLesson() {
  return {
    title: '',
    description: '',
    prerequis: '',
    niveau_difficulte: 'debutant',
    objectifs_pedagogiques: '',
    duree_estimee_minutes: null
  }
}

/**
 * Construit le payload de création de leçon (contexte matière/classe/enseignant
 * ajouté au brouillon). Mapping PUR.
 * @param {Object} newLesson - brouillon du formulaire
 * @param {{ classes:Array, user:Object, matiereId:number }} ctx
 *   `classes` = classes_concernees de la matière (1ère classe utilisée comme
 *   classe_id, requis par le backend). `matiere` n'a PAS de propriété `classes`.
 * @returns {Object} payload prêt pour lessonService.createLesson
 */
export function buildLessonPayload(newLesson, { classes, user, matiereId }) {
  return {
    ...newLesson,
    matiere_id: matiereId,
    classe_id: classes?.[0]?.id || null, // 1ère classe concernée (classes_concernees)
    enseignant_id: user?.id,
    type: 'cours',
    status: 'draft'
  }
}

/**
 * Décide de la destination au clic sur une évaluation, selon le rôle et l'état
 * (version en ligne, soumission étudiant). Décision PURE : renvoie un descripteur
 * `{ route }` (à pousser) ou `{ notify }` (à signaler). Aucun effet de bord.
 * @param {Object} evaluation
 * @param {{ role:string, matiereId:number }} ctx
 * @returns {{ route?:Object, notify?:{ message:string, level:string } }}
 */
export function resolveEvaluationRoute(evaluation, { role, matiereId }) {
  // Évaluation disposant d'une version en ligne (quiz LMS)
  if (evaluation.online_version || evaluation.has_online) {
    const lmsId = evaluation.online_version?.id || evaluation.lms_id

    if (isStudent(role)) {
      return evaluation.student_submission
        ? { route: { name: 'EvaluationResults', params: { id: lmsId } } }
        : { route: { name: 'TakeEvaluation', params: { id: lmsId } } }
    }
    if (hasRole(role, [ROLES.COORDINATEUR, ROLES.ADMIN])) {
      return { route: { name: 'CoordinatorPreviewEvaluation', params: { id: lmsId } } }
    }
    return { route: { name: 'PreviewEvaluation', params: { id: lmsId } } }
  }

  if (isTeacher(role)) {
    return {
      route: {
        name: 'CreateQuestions',
        query: {
          klassci_evaluation_id: evaluation.id,
          klassci_matiere_id: matiereId,
          titre: evaluation.titre
        }
      }
    }
  }

  return { notify: { message: 'Cette évaluation n\'a pas encore de version en ligne', level: 'info' } }
}
