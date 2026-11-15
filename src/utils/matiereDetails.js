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

// Les champs du formulaire de leçon (création et modification), et rien d'autre.
const CHAMPS_DU_FORMULAIRE = ['title', 'description', 'prerequis', 'niveau_difficulte', 'objectifs_pedagogiques', 'duree_estimee_minutes', 'classe_id']

/**
 * Fabrique l'état initial d'une nouvelle leçon (formulaire du modal de création).
 * Centralise le littéral autrefois dupliqué 3× dans MatiereDetails.vue (data,
 * ouverture et fermeture du modal) → une seule source de vérité.
 *
 * La classe (back #1103) : présélectionnée seulement quand la matière n'en a qu'UNE. Plusieurs : aucune,
 * l'enseignant choisit (présélectionner la première faisait partir la leçon chez les mauvais élèves).
 * @param {Array<{id:number}>} [classes] - classes_concernees de la matière (ids LOCAUX)
 * @returns {Object} brouillon de leçon vierge
 */
export function createEmptyLesson(classes = []) {
  return {
    title: '',
    description: '',
    prerequis: '',
    niveau_difficulte: 'debutant',
    objectifs_pedagogiques: '',
    duree_estimee_minutes: null,
    classe_id: classes?.length >= 1 ? classes[0].id : null
  }
}

/**
 * Une leçon LUE devient le formulaire prérempli de sa modification (#564), classe actuelle comprise.
 * @param {Object} lecon - la leçon rendue par GET /lessons/{id}
 * @returns {Object} le formulaire
 */
export function leconVersFormulaire(lecon) {
  return {
    ...createEmptyLesson(),
    title: lecon?.title ?? '',
    description: lecon?.description ?? '',
    prerequis: lecon?.prerequis ?? '',
    niveau_difficulte: lecon?.niveau_difficulte ?? 'debutant',
    objectifs_pedagogiques: lecon?.objectifs_pedagogiques ?? '',
    duree_estimee_minutes: lecon?.duree_estimee_minutes ?? null,
    classe_id: lecon?.classe_id ?? null
  }
}

/**
 * Le corps de PUT /lessons/{id} : les seuls champs du formulaire. Ni statut, ni type, ni enseignant : la
 * modification ne change pas ce que le formulaire ne montre pas. Mapping PUR.
 * @param {Object} formulaire
 * @returns {Object}
 */
export function buildLessonUpdatePayload(formulaire) {
  return Object.fromEntries(CHAMPS_DU_FORMULAIRE.map((champ) => [champ, formulaire?.[champ] ?? null]))
}

/**
 * Construit le payload de création de leçon (contexte matière/classe/enseignant
 * ajouté au brouillon). Mapping PUR.
 * @param {Object} newLesson - brouillon du formulaire, avec la classe CHOISIE (`classe_id`, back #1103 :
 *   jamais la première des classes de la matière à la place d'un choix)
 * @param {{ user:Object, matiereIdLocal:?number }} ctx
 *
 *   `matiereIdLocal` = le champ `matiere_id_local` de la réponse, et surtout
 *   PAS le paramètre de route, qui est un identifiant KLASSCI. Le backend
 *   stocke `lessons.matiere_id` dans l'espace LOCAL : envoyer l'id de route
 *   faisait atterrir la leçon sur une AUTRE matière quand les deux
 *   numérotations se percutaient — en 201, sans erreur, et invisible sur la
 *   page d'origine. Observé le 2026-09-07 : une leçon créée depuis « Anglais »
 *   (KLASSCI 3) s'est retrouvée sur « Algorithme » (local 3).
 *
 *   `null` quand la matière n'est pas encore miroitée côté backend : on envoie
 *   alors `null` plutôt que l'identifiant de l'autre espace. Une leçon sans
 *   matière est réparable ; une leçon sur la mauvaise matière est une
 *   corruption silencieuse, que personne ne cherche puisque rien n'a échoué.
 * @returns {Object} payload prêt pour lessonService.createLesson
 */
export function buildLessonPayload(newLesson, { user, matiereIdLocal }) {
  return {
    ...newLesson,
    matiere_id: matiereIdLocal ?? null,
    classe_id: newLesson.classe_id ?? null,
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
 * @param {{ role:string }} ctx
 * L'élève ne reçoit pas une route mais l'évaluation à OUVRIR (`{ ouvrir }`) : la porte unique
 * (useStartEvaluation.ouvrirEvaluation) reprend, montre les résultats ou démarre par le serveur.
 * @returns {{ route?:Object, ouvrir?:Object, notify?:{ message:string, level:string } }}
 */
export function resolveEvaluationRoute(evaluation, { role }) {
  // Évaluation disposant d'une version en ligne (quiz LMS)
  if (evaluation.online_version || evaluation.has_online) {
    const lmsId = evaluation.online_version?.id || evaluation.lms_id

    if (isStudent(role)) {
      return { ouvrir: { id: lmsId, student_submission: evaluation.student_submission ?? null } }
    }
    if (hasRole(role, [ROLES.COORDINATEUR, ROLES.ADMIN])) {
      return { route: { name: 'CoordinatorPreviewEvaluation', params: { id: lmsId } } }
    }
    return { route: { name: 'PreviewEvaluation', params: { id: lmsId } } }
  }

  // D72-b : l'origine vient du serveur (D172). Un élément LOCAL sans version en ligne ne part
  // jamais vers la création KLASSCI : son id est local, et jamais sous un nom `klassci_*` (D132).
  // Seule la clé que `CreateQuestions` lit (`klassci_id`) part.
  if (isTeacher(role) && evaluation.source !== 'lms_local') {
    return { route: { name: 'CreateQuestions', query: { klassci_id: evaluation.id } } }
  }

  return { notify: { message: 'Cette évaluation n\'a pas encore de version en ligne', level: 'info' } }
}
