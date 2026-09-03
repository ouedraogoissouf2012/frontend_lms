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

/**
 * Nombre de matières RÉELLEMENT rattachées à la classe, ou `null`.
 *
 * `/proxy/classes` livre `matieres_disponibles` par classe : c'est la seule
 * source qui distingue les classes entre elles. Le tableau de bord enseignant,
 * lui, ne donne que SES matières — un total qui, affiché par carte, laissait
 * croire que chaque classe en comptait autant.
 *
 * @param {object} classe
 * @returns {number|null}
 */
export function measureClassMatiereCount(classe) {
  for (const field of ['matieres_disponibles', 'matieres']) {
    const list = classe?.[field]
    if (Array.isArray(list)) return list.length
  }

  return firstNumber([
    classe?.nb_matieres,
    classe?.matieres_count,
    classe?.nombre_matieres,
    classe?.total_matieres
  ])
}

/**
 * Complète des classes avec l'effectif et la capacité portés par un référentiel.
 *
 * Le tableau de bord enseignant dit QUELLES classes l'enseignant a, mais ne porte
 * ni effectif ni capacité. `/proxy/classes` les porte — pour tout l'établissement
 * et en UN seul appel. On apparie par identifiant plutôt que d'interroger chaque
 * classe : le N+1 coûterait un aller-retour par carte affichée.
 *
 * Une classe absente du référentiel, ou un référentiel indisponible, laisse `null` :
 * on ne remplace jamais une absence par un chiffre.
 *
 * @param {Array<object>} classes - Classes à compléter (jamais mutées).
 * @param {Array<object>|null} referentiel - Classes porteuses des mesures, ou `null`.
 * @returns {Array<object>} Nouveaux objets, mesures ajoutées.
 */
export function mergeClassMeasures(classes, referentiel) {
  const source = Array.isArray(classes) ? classes : []
  const parId = new Map()

  for (const classe of Array.isArray(referentiel) ? referentiel : []) {
    // Clé en CHAÎNE : les ids KLASSCI arrivent tantôt en nombre, tantôt en
    // chaîne selon l'endpoint, et un appariement strict les manquerait en silence.
    if (classe?.id !== null && classe?.id !== undefined) {
      parId.set(String(classe.id), classe)
    }
  }

  return source.map((classe) => {
    const reference = parId.get(String(classe?.id))

    return {
      ...classe,
      places_occupees: measureClassStudentCount(reference ?? classe),
      places_totales: measureClassCapacity(reference ?? classe),
      nb_matieres: measureClassMatiereCount(reference ?? classe),
    }
  })
}
