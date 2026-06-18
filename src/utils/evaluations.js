/**
 * Logique métier PURE des évaluations enseignant (#28).
 *
 * Extrait de `views/evaluations/TeacherEvaluations.vue` (god-component) :
 * fusion KLASSCI ↔ versions LMS en ligne, calcul d'expiration, filtrage,
 * statistiques et mappers de statut. Fonctions pures (aucun effet de bord,
 * aucune dépendance Vue) → testables et réutilisables.
 */

/**
 * Fusionne les évaluations KLASSCI avec leurs versions LMS en ligne.
 * @param {Array<Object>} klassci - évaluations KLASSCI brutes
 * @param {Array<Object>} lms - évaluations LMS (online), liées par klassci_evaluation_id
 * @returns {Array<Object>} évaluations enrichies { ...eval, online_version, has_online }
 */
export function mergeWithOnlineVersions(klassci = [], lms = []) {
  return klassci.map((evaluation) => ({
    ...evaluation,
    online_version: lms.find((e) => e.klassci_evaluation_id === evaluation.id),
    has_online: lms.some((e) => e.klassci_evaluation_id === evaluation.id)
  }))
}

/**
 * Une évaluation est-elle expirée ET sans version en ligne ?
 * @param {Object} evaluation - évaluation (idéalement enrichie via mergeWithOnlineVersions)
 * @returns {boolean}
 */
export function isExpiredWithoutOnline(evaluation) {
  if (evaluation.has_online) return false

  // Statut de la fenêtre (programmation KLASSCI)
  const window = evaluation.programmation?.window
  if (window && !window.is_open && window.has_started) return true

  // Date d'évaluation (programmation prioritaire)
  const dateEval = evaluation.programmation?.date_evaluation || evaluation.date_evaluation
  if (dateEval) {
    return new Date(dateEval) < new Date()
  }
  return false
}

/**
 * Filtre une liste d'évaluations enrichies.
 * @param {Array<Object>} evaluations
 * @param {Object} filters - { hideExpired, classe_id, matiere_id, statut }
 * @returns {Array<Object>}
 */
export function filterEvaluations(evaluations = [], filters = {}) {
  let filtered = evaluations

  if (filters.hideExpired) {
    filtered = filtered.filter((e) => !isExpiredWithoutOnline(e))
  }
  if (filters.classe_id) {
    // Comparaison souple (id numérique vs valeur de <select> chaîne)
    filtered = filtered.filter((e) => e.classe?.id == filters.classe_id)
  }
  if (filters.matiere_id) {
    filtered = filtered.filter((e) => e.matiere?.id == filters.matiere_id)
  }
  if (filters.statut) {
    filtered = filtered.filter((e) => e.status === filters.statut)
  }
  return filtered
}

/**
 * Statistiques agrégées d'une liste d'évaluations enrichies.
 * @param {Array<Object>} evaluations
 * @returns {{ total:number, enCours:number, terminees:number, avecVersionEnLigne:number }}
 */
export function computeEvaluationStats(evaluations = []) {
  return {
    total: evaluations.length,
    enCours: evaluations.filter((e) => e.programmation?.window?.is_open).length,
    terminees: evaluations.filter((e) => e.status === 'terminee').length,
    avecVersionEnLigne: evaluations.filter((e) => e.has_online).length
  }
}

const STATUS_LABELS = {
  planifiee: 'Planifiée',
  en_cours: 'En cours',
  terminee: 'Terminée',
  brouillon: 'Brouillon',
  draft: 'Brouillon',
  in_progress: 'En cours',
  completed: 'Terminée'
}

const STATUS_TOOLTIPS = {
  planifiee: 'Évaluation programmée dans le calendrier KLASSCI',
  en_cours: 'Fenêtre temporelle ouverte - Les étudiants peuvent composer',
  terminee: 'Fenêtre fermée - Composition terminée',
  brouillon: 'Évaluation en préparation, non encore programmée',
  draft: 'Évaluation en préparation, non encore programmée',
  in_progress: 'Fenêtre temporelle ouverte - Les étudiants peuvent composer',
  completed: 'Fenêtre fermée - Composition terminée'
}

const STATUS_BADGE_CLASSES = {
  planifiee: 'status-badge-planned',
  en_cours: 'status-badge-active',
  terminee: 'status-badge-finished',
  brouillon: 'status-badge-draft'
}

/** Libellé lisible d'un statut (fallback : le statut brut). */
export function getStatusLabel(status) {
  return STATUS_LABELS[status] || status
}

/** Infobulle d'un statut (fallback générique). */
export function getStatusTooltip(status) {
  return STATUS_TOOLTIPS[status] || "Statut de l'évaluation"
}

/**
 * Classe CSS du badge de statut. Une fenêtre ouverte prime sur le statut.
 * @param {Object} evaluation
 * @returns {string}
 */
export function getStatusBadgeClass(evaluation) {
  const base = 'status-badge'
  if (evaluation.programmation?.window?.is_open) {
    return `${base} status-badge-active`
  }
  const suffix = STATUS_BADGE_CLASSES[evaluation.status] || 'status-badge-default'
  return `${base} ${suffix}`
}
