/**
 * Mesures d'une classe : effectif et capacité.
 *
 * Chaque grandeur existe en DEUX versions, et la distinction est le sujet de ce
 * module :
 *
 *  - `measure*` rend la valeur réellement portée par la charge utile, ou `null`
 *    quand aucune des variantes de nommage n'est présente ;
 *  - `get*` applique un repli chiffré, pour les appelants historiques qui exigent
 *    un nombre.
 *
 * « Aucune donnée » et « zéro étudiant » sont deux faits différents qu'un `0`
 * confond. Sur l'écran des classes enseignant, le dashboard ne porte ni effectif
 * ni capacité : les replis y affichaient « 0/30 » pour une classe de 6 élèves —
 * deux nombres faux présentés comme des mesures, dont un `30` codé en dur qui
 * tombait juste par coïncidence, donc invisible à la relecture.
 *
 * Extrait de `classStats.js` (limite de 300 lignes) ; ce module reste réexporté
 * par lui, aucun import existant n'a changé.
 */

/** Premier nombre fini de la liste, ou `null`. Les chaînes vides ne comptent pas. */
export function firstNumber(values) {
  for (const value of values) {
    if (value === null || value === undefined || value === '') continue
    const number = Number(value)
    if (Number.isFinite(number)) return number
  }
  return null
}

/**
 * Effectif réellement porté par la charge utile, ou `null`.
 *
 * @param {object} classe
 * @returns {number|null}
 */
export function measureClassStudentCount(classe) {
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

  // Un roster présent VAUT mesure : sa longueur est l'effectif.
  for (const field of ['etudiants', 'students', 'apprenants']) {
    const list = classe?.[field]
    if (Array.isArray(list)) return list.length
  }

  return firstNumber([classe?.effectif])
}

/** Effectif, avec repli à 0. Contrat INCHANGÉ pour les appelants historiques. */
export function getClassStudentCount(classe) {
  return measureClassStudentCount(classe) ?? 0
}

/**
 * Capacité réellement portée par la charge utile, ou `null`.
 *
 * @param {object} classe
 * @returns {number|null}
 */
export function measureClassCapacity(classe) {
  return firstNumber([
    classe?.places_totales,
    classe?.effectif_max,
    classe?.capacite,
    classe?.capacity,
    classe?.capacite_max,
    classe?.max_students,
    classe?.total_places
  ])
}

/**
 * Capacité, avec repli à 30. Contrat INCHANGÉ pour les appelants historiques.
 *
 * Ce `30` est une valeur inventée : à n'utiliser que là où un nombre est
 * structurellement exigé, jamais pour un affichage qui peut dire « — ».
 */
export function getClassCapacity(classe, studentCount = 0) {
  return measureClassCapacity(classe) ?? (studentCount > 0 ? Math.max(studentCount, 30) : 30)
}
