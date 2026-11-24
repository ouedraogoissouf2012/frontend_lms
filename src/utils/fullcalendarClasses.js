/**
 * Les crochets de style STABLES de FullCalendar 7 (#628) : ses options `…Class`.
 *
 * En v7, les classes du DOM du calendrier sont hachées ; les cellules, l'en-tête des jours ou le trait « maintenant »
 * ne se visent plus par un sélecteur `.fc-*`. v7 laisse en revanche chaque partie recevoir NOS classes, par option.
 * Une option de classe n'accepte qu'une CHAÎNE (ou une valeur fausse) : un tableau serait refusé en silence
 * (`refineClassName` de v7 avertit et rend `''`).
 */

/** Le trait de l'heure courante (vue semaine / jour). */
export const LIGNE_MAINTENANT = 'lms-ligne-maintenant'

/**
 * La classe d'une cellule de jour : le jour courant, ou un jour hors du mois affiché.
 * @param {{ isToday?: boolean, isOther?: boolean }} cellule - les `DayCellInfo` de v7
 * @returns {string}
 */
export function classeDeCellule({ isToday, isOther } = {}) {
  if (isToday) return 'lms-jour-aujourdhui'
  if (isOther) return 'lms-jour-hors-mois'
  return ''
}
