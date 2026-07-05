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
      const classId = toId(classe)
      const linkedMatieres = matiereList.filter((matiere) => classIdsFromMatiere(matiere).has(classId))
      const studentCount = getClassStudentCount(classe)

      return {
        ...classe,
        places_occupees: studentCount,
        places_totales: getClassCapacity(classe, studentCount),
        nb_matieres: shouldFilterByAssignment ? linkedMatieres.length : matiereList.length
      }
    })
}
