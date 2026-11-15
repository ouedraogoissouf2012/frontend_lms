/**
 * Fonctions pures de présentation pour ClasseDetails (#H9 ≤300).
 *
 * Extraites VERBATIM des méthodes de la vue ClasseDetails afin que les onglets
 * présentationnels (matières/étudiants/évaluations/planning/séances) restent de
 * simples composants de rendu testables. Aucun changement de comportement.
 */
import { hasRole, isStudent, isTeacher, ROLES } from '@/constants/roles'
import { dateHeureSeance } from '@/utils/seanceStatut'

/**
 * Destination d'un clic sur une évaluation de la fiche classe (E4c). Décision PURE : `{ ouvrir }` (la
 * porte unique de l'élève), `{ route }` ou `{ notify }`. L'id ouvert est TOUJOURS l'id LMS
 * (`online_version.id`) : dans une école KLASSCI, l'id de l'élément est celui de la programmation.
 * Avant, tous les rôles partaient vers `AdminEvaluationDetails`, réservée à la gestion.
 * @param {Object} evaluation un élément de `evaluations_programmees`
 * @param {string} role
 * @returns {{ route?: Object, ouvrir?: Object, notify?: { message: string, level: string } }}
 */
export function routeEvaluationDeClasse(evaluation, role) {
  const lmsId = evaluation?.has_online ? evaluation.online_version?.id : null
  if (lmsId == null) {
    return { notify: { message: 'Cette évaluation n\'a pas encore de version en ligne', level: 'info' } }
  }
  if (isStudent(role)) return { ouvrir: { id: lmsId, student_submission: evaluation.student_submission ?? null } }
  if (isTeacher(role)) return { route: { name: 'PreviewEvaluation', params: { id: lmsId } } }
  if (hasRole(role, [ROLES.COORDINATEUR, ROLES.ADMIN])) {
    return { route: { name: 'AdminEvaluationDetails', params: { id: lmsId } } }
  }
  return { notify: { message: 'Cette évaluation n\'a pas encore de version en ligne', level: 'info' } }
}

export function formatDate(dateString) {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

// D619 : l'heure d'une séance passe par l'analyseur UNIQUE (seanceStatut.dateHeureSeance) : KLASSCI rend
// « HH:mm[:ss] », l'école créée depuis le LMS un datetime ISO. Le jour ne sert qu'au calcul : seule l'heure est
// montrée. Une heure illisible rend 'N/A' ou null, jamais « Invalid Date » ni NaN.
const JOUR_DE_CALCUL = '2000-01-01'

/** La durée en minutes entre les heures de début et de fin ; 0 si l'une manque, null si l'une est illisible. */
export function calculateDuration(seance) {
  if (!seance.programmation?.heure_debut || !seance.programmation?.heure_fin) return 0
  const debut = dateHeureSeance(JOUR_DE_CALCUL, seance.programmation.heure_debut)
  const fin = dateHeureSeance(JOUR_DE_CALCUL, seance.programmation.heure_fin)
  return debut && fin ? Math.round((fin - debut) / (1000 * 60)) : null
}

export function formatTime(heure) {
  if (!heure) return 'N/A'
  const date = dateHeureSeance(JOUR_DE_CALCUL, heure)
  return date ? date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 'N/A'
}

const JOURS_ISO = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

/**
 * Nom francais du jour depuis le numero ISO-8601 (1=Lundi ... 7=Dimanche) porte
 * par `programmation.jour`. Mesure sur /lms/classes/{id} : {"jour":"3",
 * "date":"2026-09-02"} — 2026-09-02 est un mercredi, la convention est confirmee.
 */
export function formatJour(jour) {
  const n = Number(jour)
  if (!Number.isInteger(n) || n < 1 || n > 7) return 'N/A'
  return JOURS_ISO[n - 1]
}

export function getEvaluationStatusClass(window) {
  if (!window) return 'bg-gray-100 text-gray-700'
  if (window.is_active) return 'bg-green-100 text-green-700'
  if (window.is_upcoming) return 'bg-blue-100 text-blue-700'
  if (window.is_past) return 'bg-gray-100 text-gray-700'
  return 'bg-yellow-100 text-yellow-700'
}

export function getEvaluationStatusLabel(window) {
  if (!window) return 'Non programmée'
  if (window.is_active) return 'En cours'
  if (window.is_upcoming) return `Ouvre ${window.time_until_start}`
  if (window.is_past) return 'Terminée'
  return 'Programmée'
}
