import { extractList } from './apiList'
import { toId, ENTITY_ID_KEYS } from './toId'
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

// D72-c, D-c3 : la forme des lignes `/proxy/*` d'une école KLASSCI est indéterminée (schéma ouvert,
// aucune fixture) : `byId` garde toutes ses clés ; en cas de collision, la première ligne gagne.
export const byId = (items) => {
  const map = new Map()
  ;(Array.isArray(items) ? items : []).forEach((item) => {
    // Même liste de clés que `toId` (#296) : plus de divergence possible.
    // `class_id`, jadis oublié ici, est désormais indexé lui aussi.
    ENTITY_ID_KEYS.forEach((k) => {
      const key = toId(item?.[k])
      if (key && !map.has(key)) map.set(key, item)
    })
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
