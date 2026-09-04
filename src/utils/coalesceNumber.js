/**
 * Coalescence numérique « premier nombre fini » (#296).
 *
 * Cinq copies quasi identiques de cette logique existaient (useTeacherHub,
 * useAdminHub, classMeasures, teacherDashboard, useAdminEvaluationDetails), à
 * repli divergent (null vs 0) et deux formes d'entrée (tableau vs chemins pointés).
 * Source unique ici, deux formes explicites, repli passé par l'appelant.
 */

/**
 * Premier nombre fini de `values`, dans l'ordre, sinon `fallback`.
 *
 * `null`/`undefined`/`''` sont IGNORÉS (une chaîne vide n'est pas un `0` ; un
 * champ non mesuré ne doit pas compter comme une mesure nulle — cf. la convention
 * « null = non mesuré » du reste du code).
 *
 * @param {Array<*>} values - Valeurs candidates, par ordre de précédence.
 * @param {number|null} [fallback=null] - Retour si aucune valeur n'est un nombre fini.
 * @returns {number|null}
 */
export function coalesceNumber(values, fallback = null) {
  for (const value of values) {
    if (value === null || value === undefined || value === '') continue
    const number = Number(value)
    if (Number.isFinite(number)) return number
  }
  return fallback
}

/**
 * Comme `coalesceNumber`, mais lit d'abord des CHEMINS POINTÉS dans `source`
 * (ex. `'statistiques.total_classes'`), dans l'ordre de précédence, puis coalesce.
 *
 * @param {object} source - Objet source (ex. réponse dashboard).
 * @param {string[]} keys - Chemins pointés candidats.
 * @param {number|null} [fallback=null]
 * @returns {number|null}
 */
export function coalesceNumberFrom(source, keys, fallback = null) {
  const values = keys.map((key) =>
    key.split('.').reduce((current, part) => current?.[part], source)
  )
  return coalesceNumber(values, fallback)
}
