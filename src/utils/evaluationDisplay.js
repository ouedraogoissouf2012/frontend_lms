import { extractList } from './apiList'
import { toId } from './toId'
import { idClasse, idEnseignant, idMatiere } from './identiteEvaluation'

export { toId }

export const firstValue = (...values) =>
  values.find(value => value !== null && value !== undefined && value !== '')

export const displayName = (entity) => {
  if (!entity) return ''
  if (typeof entity === 'string') return entity
  const fullName = [entity.nom, entity.prenom].filter(Boolean).join(' ').trim()
  return firstValue(
    fullName,
    entity.name,
    entity.nom_complet,
    entity.full_name,
    entity.nom,
    entity.libelle,
    entity.label,
    entity.titre,
    entity.title,
    ''
  )
}

export const unwrapArray = (response, envelopeKeys = []) =>
  extractList(response, envelopeKeys)

export const nonEmptyArray = (value, envelopeKeys = []) => {
  const list = unwrapArray(value, envelopeKeys)
  return list.length > 0 ? list : null
}

// #626 : une ligne s'indexe par son `id` SEUL. L'indexer par toutes les clés d'identité faisait du `user_id` (ou du
// `klassci_id`, un numéro de COMPTE) d'une ligne la clé d'une AUTRE ligne : le même nombre vit dans deux espaces, et
// une évaluation nommait alors le mauvais enseignant. Entre deux lignes de même `id`, la première gagne.
export const byId = (items) => {
  const map = new Map()
  ;(Array.isArray(items) ? items : []).forEach((item) => {
    const key = toId(item?.id)
    if (key && !map.has(key)) map.set(key, item)
  })
  return map
}

// D72-c : le repli `#id` suit la règle d'identité (`identiteEvaluation`) ; les alias hors contrat
// (`teacher`, `matiere_name`, `subject_name`, `class_name`), absents d'`EvaluationRecord`, ne sont plus lus.
const repliId = (prefixe, id) => (id ? `${prefixe} #${id}` : '')

export const teacherName = (evaluation) => firstValue(
  evaluation.enseignant_nom,
  displayName(evaluation.enseignant),
  repliId('Enseignant', idEnseignant(evaluation)),
  'Enseignant inconnu'
)

export const matiereName = (evaluation) => firstValue(
  evaluation.matiere_nom,
  displayName(evaluation.matiere),
  repliId('Matière', idMatiere(evaluation)),
  'Matière inconnue'
)

export const classeName = (evaluation) => firstValue(
  evaluation.classe_nom,
  evaluation.classe_name,
  displayName(evaluation.classe),
  repliId('Classe', idClasse(evaluation)),
  'Classe inconnue'
)
