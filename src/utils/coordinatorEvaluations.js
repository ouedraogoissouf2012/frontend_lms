/**
 * Logique pure de la liste des évaluations du coordinateur, extraite de `useCoordinatorEvaluations`
 * (D72-c, ≤300 lignes par fichier, AUCUNE exception) : normalisation d'une évaluation, jointure aux
 * référentiels (enseignants, classes, matières) et options d'enseignants. Sans état : le composable
 * passe ses listes en argument.
 */
import { byId, displayName, firstValue, toId } from '@/utils/evaluationDisplay'

export function normalizeEvaluation(evaluation) {
  const enseignantId = toId(firstValue(
    evaluation.klassci_enseignant_id,
    evaluation.enseignant_id,
    evaluation.teacher_id,
    evaluation.enseignant,
    evaluation.teacher
  ))
  const classeId = toId(firstValue(evaluation.klassci_classe_id, evaluation.classe_id, evaluation.class_id, evaluation.classe))
  const matiereId = toId(firstValue(evaluation.klassci_matiere_id, evaluation.matiere_id, evaluation.subject_id, evaluation.matiere))
  const matiereNom = firstValue(evaluation.matiere_nom, evaluation.matiere_name, evaluation.subject_name, displayName(evaluation.matiere))
  const classeNom = firstValue(evaluation.classe_nom, evaluation.classe_name, evaluation.class_name, displayName(evaluation.classe))

  return {
    ...evaluation,
    klassci_enseignant_id: firstValue(evaluation.klassci_enseignant_id, enseignantId),
    klassci_classe_id: firstValue(evaluation.klassci_classe_id, classeId),
    klassci_matiere_id: firstValue(evaluation.klassci_matiere_id, matiereId),
    enseignant_nom: firstValue(evaluation.enseignant_nom, displayName(evaluation.enseignant), displayName(evaluation.teacher), enseignantId ? `Enseignant #${enseignantId}` : ''),
    matiere: evaluation.matiere || (matiereNom ? { id: matiereId, nom: matiereNom } : null),
    classe: evaluation.classe || (classeNom ? { id: classeId, nom: classeNom } : null)
  }
}

/**
 * @param {Object} evaluation
 * @param {{ enseignants:Array, classes:Array, matieres:Array }} references
 */
export function enrichEvaluation(evaluation, { enseignants, classes, matieres }) {
  const normalized = normalizeEvaluation(evaluation)
  const enseignantsById = byId(enseignants)
  const classesById = byId(classes)
  const matieresById = byId(matieres)
  const enseignant = enseignantsById.get(toId(normalized.klassci_enseignant_id))
  const classe = classesById.get(toId(normalized.klassci_classe_id))
  const matiere = matieresById.get(toId(normalized.klassci_matiere_id))

  return {
    ...normalized,
    enseignant: enseignant || normalized.enseignant || null,
    classe: classe || normalized.classe || null,
    matiere: matiere || normalized.matiere || null,
    enseignant_nom: firstValue(displayName(enseignant), normalized.enseignant_nom),
    classe_nom: firstValue(displayName(classe), normalized.classe_nom, displayName(normalized.classe)),
    matiere_nom: firstValue(displayName(matiere), normalized.matiere_nom, displayName(normalized.matiere))
  }
}

export function teacherOption(enseignant) {
  const id = toId(enseignant)
  const name = displayName(enseignant)
  if (!id || !name) return null
  const source = typeof enseignant === 'object' && enseignant !== null ? enseignant : {}
  const joinId = source.klassci_id ?? source.id ?? source.teacher_id ?? id
  return {
    ...source,
    id: joinId,
    klassci_id: joinId,
    name,
    libelle: name,
    email: source.email || ''
  }
}

/**
 * Options d'enseignants : celles du référentiel, complétées par les auteurs des évaluations.
 * @param {Array} enseignants options déjà construites par `teacherOption`
 * @param {Array} evaluations évaluations enrichies
 * @returns {Array} options triées par nom
 */
export function deriveEnseignants(enseignants, evaluations) {
  const enseignantsMap = new Map()
  enseignants.forEach((enseignant) => {
    const option = teacherOption(enseignant)
    if (option) enseignantsMap.set(toId(option.klassci_id), option)
  })
  evaluations.forEach(evaluation => {
    if (evaluation.klassci_enseignant_id && (evaluation.enseignant_nom || evaluation.enseignant)) {
      const joinId = evaluation.klassci_enseignant_id
      const name = firstValue(evaluation.enseignant_nom, displayName(evaluation.enseignant))
      enseignantsMap.set(toId(joinId), {
        ...(evaluation.enseignant || {}),
        id: joinId,
        klassci_id: joinId,
        name,
        libelle: name,
        email: evaluation.enseignant?.email || ''
      })
    }
  })
  return Array.from(enseignantsMap.values()).sort((a, b) => a.name.localeCompare(b.name))
}
