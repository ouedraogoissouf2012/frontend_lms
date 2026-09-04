import { extractList } from './apiList'
import { enrichTeacherClasses } from './classStats'
import { toId } from './toId'
import { coalesceNumber } from './coalesceNumber'

const EMPTY_TEACHER_DASHBOARD = {
  matieres: [],
  classes: [],
  evaluations: [],
  seances: [],
  lessons: [],
  statistiques: {},
}

export function normalizeTeacherDashboard(data = {}) {
  return {
    ...EMPTY_TEACHER_DASHBOARD,
    ...(data && typeof data === 'object' ? data : {}),
  }
}

export function normalizeTeacherDashboardPayload(response = {}) {
  const candidates = [
    response?.data?.dashboard,
    response?.data?.teacher_dashboard,
    response?.data,
    response?.dashboard,
    response?.teacher_dashboard,
    response,
  ]

  const payload = candidates.find(candidate => candidate && typeof candidate === 'object') || {}
  return normalizeTeacherDashboard(payload)
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase()
}

function firstNumber(values, fallback = 0) {
  return coalesceNumber(values, fallback)
}

function getPersonNames(person = {}) {
  return [
    person.name,
    person.full_name,
    person.display_name,
    [person.prenom, person.nom].filter(Boolean).join(' '),
    [person.nom, person.prenom].filter(Boolean).join(' '),
  ].map(normalizeText).filter(Boolean)
}

function matchesCurrentTeacher(enseignant, currentUser) {
  if (!enseignant || !currentUser) return false

  const currentIds = new Set([
    currentUser.klassci_id,
    currentUser.teacher_id,
    currentUser.enseignant_id,
    currentUser.user_id,
    currentUser.id,
  ].map(toId).filter(Boolean))

  const enseignantIds = [
    enseignant.klassci_id,
    enseignant.teacher_id,
    enseignant.enseignant_id,
    enseignant.user_id,
    enseignant.id,
  ].map(toId).filter(Boolean)

  if (enseignantIds.some(id => currentIds.has(id))) return true

  const userEmail = normalizeText(currentUser.email)
  const enseignantEmail = normalizeText(enseignant.email)
  if (userEmail && enseignantEmail && userEmail === enseignantEmail) return true

  const userNames = new Set(getPersonNames(currentUser))
  return getPersonNames(enseignant).some(name => userNames.has(name))
}

function findCurrentTeacher(enseignants = [], currentUser) {
  return enseignants.find(enseignant => matchesCurrentTeacher(enseignant, currentUser)) || null
}

function collectClassesFromMatieres(matieres = []) {
  const byId = new Map()

  for (const matiere of matieres) {
    const linkedClasses = [
      ...(Array.isArray(matiere?.classes) ? matiere.classes : []),
      ...(Array.isArray(matiere?.klassci_classes) ? matiere.klassci_classes : []),
    ]

    if (matiere?.classe && typeof matiere.classe === 'object') linkedClasses.push(matiere.classe)
    if (matiere?.klassci_classe && typeof matiere.klassci_classe === 'object') linkedClasses.push(matiere.klassci_classe)

    for (const classe of linkedClasses) {
      const id = toId(classe)
      if (id) byId.set(id, classe)
    }

    for (const idValue of [matiere?.classe_id, matiere?.klassci_classe_id]) {
      const id = toId(idValue)
      if (id && !byId.has(id)) byId.set(id, { id })
    }
  }

  return Array.from(byId.values())
}

function countLessons(matieres = []) {
  return matieres.reduce((total, matiere) => {
    if (Array.isArray(matiere?.lessons)) return total + matiere.lessons.length
    if (Array.isArray(matiere?.lecons)) return total + matiere.lecons.length
    return total + Number(matiere?.lessons_count ?? matiere?.lecons_count ?? matiere?.nb_lecons ?? 0)
  }, 0)
}

function countStudents(classes = []) {
  return classes.reduce((total, classe) => (
    total + Number(classe?.places_occupees ?? classe?.nb_etudiants ?? classe?.students_count ?? 0)
  ), 0)
}

function isTodaySeance(seance) {
  const date = seance?.date_seance || seance?.date || seance?.programmation?.date_seance
  return date && String(date).slice(0, 10) === new Date().toISOString().slice(0, 10)
}

function buildDashboardFromTeacher(enseignant) {
  const matieres = extractList(enseignant, ['matieres'])
  const rawClasses = extractList(enseignant, ['classes'])
  const classes = enrichTeacherClasses(
    rawClasses.length > 0 ? rawClasses : collectClassesFromMatieres(matieres),
    matieres
  )
  const seances = extractList(enseignant, ['seances'])
  const evaluations = extractList(enseignant, ['evaluations'])
  const lessons = extractList(enseignant, ['lessons', 'lecons'])
  const statistiques = enseignant?.statistiques || enseignant?.stats || {}

  return normalizeTeacherDashboard({
    matieres,
    classes,
    evaluations,
    seances,
    lessons,
    statistiques: {
      ...statistiques,
      total_etudiants: firstNumber([
        statistiques.total_etudiants,
        statistiques.nb_etudiants,
        statistiques.students_count,
      ], countStudents(classes)),
      total_lecons: firstNumber([
        statistiques.total_lecons,
        statistiques.nb_lecons,
        statistiques.lessons_count,
      ], lessons.length || countLessons(matieres)),
      seances_aujourdhui: firstNumber([
        statistiques.seances_aujourdhui,
        statistiques.nb_seances_aujourdhui,
      ], seances.filter(isTodaySeance).length),
      evaluations_en_cours: firstNumber([
        statistiques.evaluations_en_cours,
        statistiques.nb_evaluations_en_cours,
      ], evaluations.filter(evaluation => (
        ['active', 'en_cours', 'published'].includes(evaluation?.status || evaluation?.statut)
      )).length),
    },
  })
}

export function hasDashboardContent(data) {
  return Boolean(
    data?.matieres?.length ||
    data?.classes?.length ||
    data?.evaluations?.length ||
    data?.seances?.length ||
    data?.lessons?.length ||
    Object.values(data?.statistiques || {}).some(value => Number(value) > 0)
  )
}

export async function buildTeacherDashboardFallback(lmsService, currentUser) {
  const enseignantsResponse = await lmsService.getEnseignants(true).catch(() => null)
  const currentTeacher = findCurrentTeacher(extractList(enseignantsResponse, ['enseignants']), currentUser)
  if (currentTeacher) {
    const teacherDashboard = buildDashboardFromTeacher(currentTeacher)
    if (hasDashboardContent(teacherDashboard)) return teacherDashboard
  }

  const [matieresResponse, seancesResponse] = await Promise.all([
    lmsService.getMyMatieres().catch(() => null),
    lmsService.getMyTeachingSeances().catch(() => null),
  ])

  const matieres = extractList(matieresResponse, ['matieres'])
  const rawClasses = collectClassesFromMatieres(matieres)
  const classes = enrichTeacherClasses(rawClasses, matieres)
  const seances = extractList(seancesResponse, ['seances'])

  return normalizeTeacherDashboard({
    matieres,
    classes,
    seances,
    statistiques: {
      total_etudiants: countStudents(classes),
      total_lecons: countLessons(matieres),
      seances_aujourdhui: seances.filter(isTodaySeance).length,
    },
  })
}
