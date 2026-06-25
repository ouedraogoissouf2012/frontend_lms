/**
 * Logique de statut/affichage PURE des évaluations côté étudiant (H2).
 *
 * Extrait verbatim des méthodes de `views/student/StudentEvaluationsList.vue`
 * (god-component) : fenêtre temporelle (KLASSCI ou fallback date+durée), libellés
 * et classes de statut, classe de note, formats de date. Fonctions pures (aucun
 * effet de bord, aucune dépendance Vue) → partagées entre le composable et les
 * sous-cartes, testables isolément.
 */

// Vérifie si l'évaluation est expirée (fenêtre fermée ou date passée)
export function isExpired(evaluation) {
  // Vérifier la fenêtre KLASSCI
  const window = evaluation.programmation?.window
  if (window) {
    return window.has_started && !window.is_open
  }

  // Fallback : vérifier la date + durée
  const dateEval = evaluation.programmation?.date_evaluation || evaluation.date_evaluation
  if (!dateEval) return false

  const startDate = new Date(dateEval)
  if (isNaN(startDate.getTime())) return false

  const durationMs = (evaluation.duree_minutes || 60) * 60000
  const endDate = new Date(startDate.getTime() + durationMs)
  return new Date() > endDate
}

// Vérifie si la fenêtre est ouverte (peut commencer maintenant)
export function isWindowOpen(evaluation) {
  const window = evaluation.programmation?.window
  if (window) {
    return window.is_open === true
  }

  // Fallback : vérifier la date + durée
  const dateEval = evaluation.programmation?.date_evaluation || evaluation.date_evaluation
  if (!dateEval) return true // Pas de date = toujours disponible

  const startDate = new Date(dateEval)
  if (isNaN(startDate.getTime())) return false

  const now = new Date()
  const durationMs = (evaluation.duree_minutes || 60) * 60000
  const endDate = new Date(startDate.getTime() + durationMs)

  return now >= startDate && now <= endDate
}

export function getStatusLabel(evaluation) {
  if (evaluation.student_submission?.status === 'en_cours') return 'En cours'
  if (isWindowOpen(evaluation)) return 'Disponible'
  return 'Programmée'
}

export function getStatusClass(evaluation) {
  if (evaluation.student_submission?.status === 'en_cours') return 'status-ongoing'
  if (isWindowOpen(evaluation)) return 'status-active'
  return 'status-planned'
}

export function getWindowClass(evaluation) {
  const window = evaluation.programmation?.window
  if (!window) return ''
  if (!window.has_started) return 'window-pending'
  if (window.is_open) return 'window-open'
  return 'window-closed'
}

export function getNoteClass(note) {
  if (note === null || note === undefined) return ''
  if (note >= 16) return 'note-excellent'
  if (note >= 14) return 'note-good'
  if (note >= 10) return 'note-average'
  return 'note-low'
}

export function formatDate(dateString) {
  if (!dateString) return 'Non définie'
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatDateTime(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
