/**
 * Logique métier PURE des notes élève (G4 — décomposition de StudentGrades.vue
 * pour ramener son <script> sous 300 lignes, PRODUCTION_STANDARDS §1.1).
 *
 * Fonctions extraites telles quelles depuis StudentGrades.vue : aucune
 * dépendance Vue, aucun appel réseau → testables en isolation. Le comportement
 * et les formats d'affichage sont STRICTEMENT identiques à l'origine (parité).
 */
import { formatDate as formatDateBase } from '@/utils/formatters'

/** Libellés d'affichage des types d'évaluation. */
export const EVALUATION_TYPE_LABELS = {
  devoir: 'Devoir',
  composition: 'Composition',
  interrogation: 'Interrogation',
  examen: 'Examen',
  tp: 'TP',
  td: 'TD',
  qcm: 'QCM'
}

/** Type d'évaluation → libellé (valeur brute si inconnu). */
export function formatType(type) {
  return EVALUATION_TYPE_LABELS[type] || type
}

/**
 * Date JJ/MM/AAAA (fr-FR). Réutilise le formatter centralisé (#23) mais
 * conserve le repli historique « - » (et non « — ») pour la parité d'affichage.
 */
export function formatDate(dateString) {
  if (!dateString) return '-'
  return formatDateBase(dateString, { fallback: '-' })
}

/** Durée en minutes → « X min » (<60), « Xh » (heure pleine) ou « XhYY ». 0/null → « - ». */
export function formatTemps(minutes) {
  if (!minutes || minutes === 0) return '-'
  if (minutes < 60) return `${minutes} min`
  const heures = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${heures}h${mins}` : `${heures}h`
}

/**
 * La note LISIBLE d'une évaluation, ou null (E4a, règle A de l'utilisateur) : une note masquée ou
 * absente n'est pas une note de 0 ; elle ne compte dans aucun calcul et se lit « — ».
 * @param {{note?: string|number|null}} evaluation
 * @returns {number|null}
 */
export function noteLue(evaluation) {
  const note = evaluation?.note
  if (note === null || note === undefined || note === '') return null
  const n = parseFloat(note)
  return Number.isNaN(n) ? null : n
}

const notesLues = (evaluations) => (evaluations || []).map(noteLue).filter((n) => n !== null)

/** Une note ou une moyenne à l'écran : « x/20 », ou « — » si elle est absente ou illisible (règle A). */
export function afficherNote(valeur) {
  if (valeur === null || valeur === undefined || valeur === '') return '—'
  return Number.isNaN(parseFloat(valeur)) ? '—' : `${valeur}/20`
}

/** Classe CSS d'une moyenne, par paliers (≥16/14/12/10 sinon échec). */
export function getMoyenneClass(moyenne) {
  if (moyenne >= 16) return 'note-excellent'
  if (moyenne >= 14) return 'note-good'
  if (moyenne >= 12) return 'note-average'
  if (moyenne >= 10) return 'note-below-average'
  return 'note-fail'
}

/** Classe CSS d'une note (mêmes paliers que la moyenne). */
export function getNoteClass(note) {
  if (note >= 16) return 'note-excellent'
  if (note >= 14) return 'note-good'
  if (note >= 12) return 'note-average'
  if (note >= 10) return 'note-below-average'
  return 'note-fail'
}

/** Note maximale lisible d'une matière (null si aucune : rendue « — », jamais 0). */
export function getMaxNote(matiere) {
  const notes = notesLues(matiere.evaluations)
  return notes.length > 0 ? Math.max(...notes) : null
}

/** Note minimale lisible d'une matière (null si aucune : rendue « — », jamais 0). */
export function getMinNote(matiere) {
  const notes = notesLues(matiere.evaluations)
  return notes.length > 0 ? Math.min(...notes) : null
}

/**
 * Pente d'une matière d'après la 1re et la dernière note (ordre chronologique).
 * @returns {'na'|'up'|'down'|'flat'} 'na' si moins de 2 évaluations.
 */
function computeTrend(matiere) {
  const notees = (matiere.evaluations || []).filter((e) => noteLue(e) !== null)
  if (notees.length < 2) return 'na'
  const sorted = [...notees].sort((a, b) =>
    new Date(a.date_evaluation) - new Date(b.date_evaluation)
  )
  const firstNote = parseFloat(sorted[0].note)
  const lastNote = parseFloat(sorted[sorted.length - 1].note)
  if (lastNote > firstNote) return 'up'
  if (lastNote < firstNote) return 'down'
  return 'flat'
}

/** Icône de tendance (mdi) d'une matière. */
export function getTrendIcon(matiere) {
  switch (computeTrend(matiere)) {
    case 'up': return 'mdi-trending-up'
    case 'down': return 'mdi-trending-down'
    default: return 'mdi-arrow-right'
  }
}

/** Texte de tendance d'une matière. */
export function getTrendText(matiere) {
  switch (computeTrend(matiere)) {
    case 'up': return 'En hausse'
    case 'down': return 'En baisse'
    default: return 'Stable'
  }
}

/** Classe CSS de la note d'une évaluation ; aucune pour une note absente (rendue « — »). */
export function classeDeNote(evaluation) {
  const note = noteLue(evaluation)
  return note === null ? '' : getNoteClass(note)
}

/** Une évaluation soumise il y a moins de 48 h est « nouvelle ». */
export function isNew(evaluation) {
  if (!evaluation.date_soumission) return false
  const soumissionDate = new Date(evaluation.date_soumission)
  const now = new Date()
  const diffHours = (now - soumissionDate) / (1000 * 60 * 60)
  return diffHours < 48
}

/** Aplatit les évaluations de chaque matière en injectant matiere_nom / matiere_id. */
export function flattenEvaluations(matieres) {
  const evaluations = []
  matieres.forEach(matiere => {
    matiere.evaluations.forEach(evaluation => {
      evaluations.push({
        ...evaluation,
        matiere_nom: matiere.matiere_nom,
        matiere_id: matiere.matiere_id
      })
    })
  })
  return evaluations
}

/**
 * Filtre (recherche/type/matière) puis trie les évaluations aplaties.
 * Ne mute pas le tableau source (copie défensive).
 */
export function filterAndSortEvaluations(allEvaluations, { searchQuery, filterType, filterMatiere, sortBy }) {
  let result = [...allEvaluations]

  if (searchQuery) {
    const query = searchQuery.toLowerCase()
    result = result.filter(e =>
      e.matiere_nom.toLowerCase().includes(query) ||
      e.titre.toLowerCase().includes(query)
    )
  }

  if (filterType) {
    result = result.filter(e => e.type === filterType)
  }

  if (filterMatiere) {
    result = result.filter(e => e.matiere_id === filterMatiere)
  }

  switch (sortBy) {
    case 'date-desc':
      result.sort((a, b) => new Date(b.date_evaluation) - new Date(a.date_evaluation))
      break
    case 'date-asc':
      result.sort((a, b) => new Date(a.date_evaluation) - new Date(b.date_evaluation))
      break
    case 'note-desc':
      result.sort(parNote(-1))
      break
    case 'note-asc':
      result.sort(parNote(1))
      break
    case 'matiere':
      result.sort((a, b) => a.matiere_nom.localeCompare(b.matiere_nom))
      break
  }

  return result
}

/** Tri par note lisible ; une note absente va à la fin, dans les deux sens (`sens` : 1 ou -1). */
function parNote(sens) {
  return (a, b) => {
    const x = noteLue(a)
    const y = noteLue(b)
    if (x === null) return y === null ? 0 : 1
    if (y === null) return -1
    return sens * (x - y)
  }
}

/** Réussite (note ≥ 10) sur les notes LISIBLES ; aucune → taux null (non mesuré, rendu « — »). */
export function computeStatsReussite(allEvaluations) {
  const notes = notesLues(allEvaluations)
  const total = notes.length
  const reussies = notes.filter((n) => n >= 10).length
  const taux = total > 0 ? Math.round((reussies / total) * 100) : null
  return { total, reussies, taux }
}

/** Meilleure note lisible (null si aucune : rendue « — », jamais « 0/20 »). */
export function computeMeilleureNote(allEvaluations) {
  const notes = notesLues(allEvaluations)
  return notes.length > 0 ? Math.max(...notes) : null
}

/** Nom de la matière portant la meilleure note ('' si introuvable). */
export function findMeilleureMatiere(allEvaluations, meilleureNote) {
  if (meilleureNote === null) return ''
  const meilleureEval = allEvaluations.find(e => parseFloat(e.note) === meilleureNote)
  return meilleureEval?.matiere_nom || ''
}
