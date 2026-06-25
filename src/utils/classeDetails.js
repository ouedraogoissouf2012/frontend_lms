/**
 * Fonctions pures de présentation pour ClasseDetails (#H9 ≤300).
 *
 * Extraites VERBATIM des méthodes de la vue ClasseDetails afin que les onglets
 * présentationnels (matières/étudiants/évaluations/planning/séances) restent de
 * simples composants de rendu testables. Aucun changement de comportement.
 */

export function formatDate(dateString) {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

export function calculateDuration(seance) {
  if (!seance.programmation?.heure_debut || !seance.programmation?.heure_fin) return 0
  const debut = new Date(seance.programmation.heure_debut)
  const fin = new Date(seance.programmation.heure_fin)
  return Math.round((fin - debut) / (1000 * 60))
}

export function formatTime(isoTimestamp) {
  if (!isoTimestamp) return 'N/A'
  return new Date(isoTimestamp).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  })
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
