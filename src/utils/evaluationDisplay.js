export const firstValue = (...values) =>
  values.find(value => value !== null && value !== undefined && value !== '')

export const toId = (value) => {
  if (value === null || value === undefined || value === '') return ''
  if (typeof value === 'object') {
    return toId(
      value.id ??
      value.klassci_id ??
      value.teacher_id ??
      value.enseignant_id ??
      value.user_id ??
      value.professeur_id ??
      value.classe_id ??
      value.matiere_id
    )
  }
  return String(value)
}

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

export const unwrapArray = (response, envelopeKeys = []) => {
  if (Array.isArray(response)) return response
  if (Array.isArray(response?.data)) return response.data
  if (Array.isArray(response?.data?.data)) return response.data.data

  for (const key of envelopeKeys) {
    if (Array.isArray(response?.[key])) return response[key]
    if (Array.isArray(response?.data?.[key])) return response.data[key]
  }

  return []
}

export const nonEmptyArray = (value, envelopeKeys = []) => {
  const list = unwrapArray(value, envelopeKeys)
  return list.length > 0 ? list : null
}

export const byId = (items) => {
  const map = new Map()
  ;(Array.isArray(items) ? items : []).forEach((item) => {
    ;[
      item?.id,
      item?.klassci_id,
      item?.teacher_id,
      item?.enseignant_id,
      item?.user_id,
      item?.professeur_id,
      item?.classe_id,
      item?.matiere_id
    ].forEach((id) => {
      const key = toId(id)
      if (key && !map.has(key)) map.set(key, item)
    })
  })
  return map
}

export const teacherName = (evaluation) => firstValue(
  evaluation.enseignant_nom,
  displayName(evaluation.enseignant),
  displayName(evaluation.teacher),
  evaluation.klassci_enseignant_id ? `Enseignant #${evaluation.klassci_enseignant_id}` : '',
  'Enseignant inconnu'
)

export const matiereName = (evaluation) => firstValue(
  evaluation.matiere_nom,
  evaluation.matiere_name,
  evaluation.subject_name,
  displayName(evaluation.matiere),
  evaluation.klassci_matiere_id ? `Matière #${evaluation.klassci_matiere_id}` : '',
  'Matière inconnue'
)

export const classeName = (evaluation) => firstValue(
  evaluation.classe_nom,
  evaluation.classe_name,
  evaluation.class_name,
  displayName(evaluation.classe),
  evaluation.klassci_classe_id ? `Classe #${evaluation.klassci_classe_id}` : '',
  'Classe inconnue'
)
