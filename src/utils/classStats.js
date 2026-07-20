function toArray(value) {
  return Array.isArray(value) ? value : []
}

function toId(value) {
  if (value === null || value === undefined) return null
  if (typeof value === 'object') return toId(value.id ?? value.klassci_id ?? value.classe_id ?? value.class_id)
  return String(value)
}

function firstNumber(values) {
  for (const value of values) {
    if (value === null || value === undefined || value === '') continue
    const number = Number(value)
    if (Number.isFinite(number)) return number
  }
  return null
}

function collectIds(source, objectFields = [], arrayFields = [], scalarFields = []) {
  const ids = new Set()

  for (const field of objectFields) {
    const id = toId(source?.[field])
    if (id) ids.add(id)
  }

  for (const field of arrayFields) {
    for (const entry of toArray(source?.[field])) {
      const id = toId(entry)
      if (id) ids.add(id)
    }
  }

  for (const field of scalarFields) {
    const id = toId(source?.[field])
    if (id) ids.add(id)
  }

  return ids
}

function intersects(a, b) {
  for (const value of a) {
    if (b.has(value)) return true
  }
  return false
}

function classIdsFromMatiere(matiere) {
  const ids = new Set()

  for (const field of ['classes', 'klassci_classes']) {
    for (const classe of toArray(matiere?.[field])) {
      const id = toId(classe)
      if (id) ids.add(id)
    }
  }

  for (const field of ['classe_ids', 'class_ids', 'klassci_classe_ids']) {
    for (const idValue of toArray(matiere?.[field])) {
      const id = toId(idValue)
      if (id) ids.add(id)
    }
  }

  for (const field of ['classe_id', 'class_id', 'klassci_classe_id']) {
    const id = toId(matiere?.[field])
    if (id) ids.add(id)
  }

  return ids
}

function relationIdsFromMatiere(matiere, config) {
  const ids = collectIds(matiere, config.objectFields, config.arrayFields, config.scalarFields)

  for (const combinaison of toArray(matiere?.combinaisons)) {
    for (const id of collectIds(combinaison, config.objectFields, config.arrayFields, config.scalarFields)) {
      ids.add(id)
    }
  }

  return ids
}

function classFiliereIds(classe) {
  return collectIds(
    classe,
    ['filiere', 'klassci_filiere'],
    ['filieres', 'klassci_filieres'],
    ['filiere_id', 'klassci_filiere_id']
  )
}

function classNiveauIds(classe) {
  return collectIds(
    classe,
    ['niveau', 'niveau_etude', 'klassci_niveau'],
    ['niveaux', 'niveaux_etude', 'klassci_niveaux'],
    ['niveau_id', 'niveau_etude_id', 'klassci_niveau_id']
  )
}

function matiereFiliereIds(matiere) {
  return relationIdsFromMatiere(matiere, {
    objectFields: ['filiere', 'klassci_filiere'],
    arrayFields: ['filieres', 'klassci_filieres'],
    scalarFields: ['filiere_id', 'klassci_filiere_id']
  })
}

function matiereNiveauIds(matiere) {
  return relationIdsFromMatiere(matiere, {
    objectFields: ['niveau', 'niveau_etude', 'klassci_niveau'],
    arrayFields: ['niveaux', 'niveaux_etude', 'klassci_niveaux'],
    scalarFields: ['niveau_id', 'niveau_etude_id', 'klassci_niveau_id']
  })
}

export function getAssignedClassIds(matieres = []) {
  const ids = new Set()
  for (const matiere of toArray(matieres)) {
    for (const id of classIdsFromMatiere(matiere)) ids.add(id)
  }
  return ids
}

export function getClassStudentCount(classe) {
  const explicitCount = firstNumber([
    classe?.places_occupees,
    classe?.nb_etudiants,
    classe?.nombre_etudiants,
    classe?.etudiants_count,
    classe?.students_count,
    classe?.total_etudiants,
    classe?.effectif_actuel,
    classe?.current_students,
    classe?.inscrits
  ])
  if (explicitCount !== null) return explicitCount

  for (const field of ['etudiants', 'students', 'apprenants']) {
    const list = classe?.[field]
    if (Array.isArray(list)) return list.length
  }

  return firstNumber([classe?.effectif]) ?? 0
}

export function getClassMatiereCount(classe, matieres = []) {
  if (Array.isArray(classe?.matieres)) return classe.matieres.length

  const matiereList = toArray(matieres)
  const classId = toId(classe)
  const hasDirectClassLinks = matiereList.some(matiere => classIdsFromMatiere(matiere).size > 0)
  if (hasDirectClassLinks) {
    return matiereList.filter(matiere => classIdsFromMatiere(matiere).has(classId)).length
  }

  const filiereIds = classFiliereIds(classe)
  const niveauIds = classNiveauIds(classe)
  const hasCombinationLinks = filiereIds.size > 0 && niveauIds.size > 0 &&
    matiereList.some((matiere) => matiereFiliereIds(matiere).size > 0 && matiereNiveauIds(matiere).size > 0)

  if (hasCombinationLinks) {
    return matiereList.filter((matiere) =>
      intersects(matiereFiliereIds(matiere), filiereIds) &&
      intersects(matiereNiveauIds(matiere), niveauIds)
    ).length
  }

  return firstNumber([
    classe?.nb_matieres,
    classe?.matieres_count,
    classe?.nombre_matieres,
    classe?.total_matieres
  ]) ?? 0
}

export function getClassCapacity(classe, studentCount = 0) {
  return firstNumber([
    classe?.places_totales,
    classe?.effectif_max,
    classe?.capacite,
    classe?.capacity,
    classe?.capacite_max,
    classe?.max_students,
    classe?.total_places
  ]) ?? (studentCount > 0 ? Math.max(studentCount, 30) : 30)
}

export function enrichTeacherClasses(rawClasses = [], matieres = []) {
  const classList = toArray(rawClasses)
  const matiereList = toArray(matieres)
  const assignedClassIds = getAssignedClassIds(matiereList)
  const shouldFilterByAssignment = assignedClassIds.size > 0

  return classList
    .filter((classe) => {
      if (!shouldFilterByAssignment) return true
      return assignedClassIds.has(toId(classe))
    })
    .map((classe) => {
      const studentCount = getClassStudentCount(classe)

      return {
        ...classe,
        places_occupees: studentCount,
        places_totales: getClassCapacity(classe, studentCount),
        nb_matieres: shouldFilterByAssignment ? getClassMatiereCount(classe, matiereList) : matiereList.length
      }
    })
}
