/**
 * Logique pure de la liste des évaluations du coordinateur, extraite de `useCoordinatorEvaluations`
 * (D72-c, ≤300 lignes par fichier, AUCUNE exception) : normalisation d'une évaluation, jointure aux
 * référentiels (enseignants, classes, matières) et options d'enseignants. Sans état : le composable
 * passe ses listes en argument.
 */
import { byId, displayName, firstValue, toId } from '@/utils/evaluationDisplay'
import { idClasse, idEnseignant, idMatiere } from '@/utils/identiteEvaluation'

// D72-c (L3, D-c1, D-c2) : l'identité se lit par `identiteEvaluation` (champs à plat) ; `klassci_*`
// n'est JAMAIS réécrit (avant : il recevait `classe_id`, un id local sous un nom KLASSCI, contraire à
// E1/D132) ; les alias hors contrat (`teacher_id`, `class_id`, `subject_id`, `teacher`,
// `matiere_name`, `subject_name`, `class_name`), absents d'`EvaluationRecord`, ne sont plus lus.
export function normalizeEvaluation(evaluation) {
  const enseignantId = idEnseignant(evaluation)
  const classeId = idClasse(evaluation)
  const matiereId = idMatiere(evaluation)
  const matiereNom = firstValue(evaluation.matiere_nom, displayName(evaluation.matiere))
  const classeNom = firstValue(evaluation.classe_nom, evaluation.classe_name, displayName(evaluation.classe))

  return {
    ...evaluation,
    enseignant_nom: firstValue(evaluation.enseignant_nom, displayName(evaluation.enseignant), enseignantId ? `Enseignant #${enseignantId}` : ''),
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
  const enseignant = enseignantsById.get(idEnseignant(normalized))
  const classe = classesById.get(idClasse(normalized))
  const matiere = matieresById.get(idMatiere(normalized))

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

// D72-c (D132) : la clé de jointure d'une option est un id LOCAL dans une école créée depuis le LMS ;
// elle s'appelle donc `cleJointure`, et une option ne porte JAMAIS de clé `klassci_id` (pas même
// recopiée d'une ligne source ou d'un cache antérieur).
const sansKlassciId = ({ klassci_id: _ignore, ...reste }) => reste

export function teacherOption(enseignant) {
  const id = toId(enseignant)
  const name = displayName(enseignant)
  if (!id || !name) return null
  const source = typeof enseignant === 'object' && enseignant !== null ? enseignant : {}
  const joinId = source.klassci_id ?? source.id ?? source.teacher_id ?? id
  return {
    ...sansKlassciId(source),
    id: joinId,
    cleJointure: joinId,
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
    if (option) enseignantsMap.set(toId(option.cleJointure), option)
  })
  evaluations.forEach(evaluation => {
    const joinId = idEnseignant(evaluation)
    if (joinId && (evaluation.enseignant_nom || evaluation.enseignant)) {
      const name = firstValue(evaluation.enseignant_nom, displayName(evaluation.enseignant))
      enseignantsMap.set(toId(joinId), {
        ...sansKlassciId(evaluation.enseignant || {}),
        id: joinId,
        cleJointure: joinId,
        name,
        libelle: name,
        email: evaluation.enseignant?.email || ''
      })
    }
  })
  return Array.from(enseignantsMap.values()).sort((a, b) => a.name.localeCompare(b.name))
}
