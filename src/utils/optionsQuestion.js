/**
 * B7 (lms_backend #1059) : lire les options d'une question À CHOIX, au chargement de l'éditeur.
 *
 * Avant #1059, le serveur enregistrait des options qui n'étaient pas des textes (entiers, objets,
 * listes, voire un objet associatif à la place de la liste) ; #1059 n'impose des chaînes qu'à
 * l'écriture, et la lecture les rend telles quelles. La bonne réponse se compare PAR VALEUR aux
 * options : la même règle s'applique aux deux. Rien n'est fabriqué (jamais « [object Object] »),
 * rien n'est retiré sans le dire : ce qui n'a pas de texte fidèle rend la question « illisible ».
 */

const TYPES_A_CHOIX = new Set(['qcm', 'qcm_multiple', 'vrai_faux'])
const ILLISIBLE = Symbol('illisible')

/** Le texte fidèle d'une valeur, '' pour null, ou ILLISIBLE s'il n'en existe pas. */
function texteDe(valeur) {
  if (typeof valeur === 'string') return valeur
  if (typeof valeur === 'number' || typeof valeur === 'boolean') return String(valeur)
  if (valeur === null || valeur === undefined) return ''
  return ILLISIBLE
}

/** Une liste de textes, ou null si la liste (ou l'un de ses éléments) n'est pas lisible. */
function listeDeTextes(liste) {
  if (liste === null || liste === undefined) return []
  if (!Array.isArray(liste)) return null
  const textes = liste.map(texteDe)
  return textes.includes(ILLISIBLE) ? null : textes
}

/**
 * @param {{ type?: string, options?: unknown, correct_answers?: unknown }} question
 * @returns {{ options: unknown[], correct_answers: unknown[], optionsIllisibles: boolean }}
 */
export function lireOptionsQuestion(question) {
  if (!TYPES_A_CHOIX.has(question?.type)) {
    return { options: question?.options || [], correct_answers: question?.correct_answers || [], optionsIllisibles: false }
  }
  const options = listeDeTextes(question.options)
  const correctes = listeDeTextes(question.correct_answers)
  if (options === null || correctes === null) {
    return { options: ['', '', '', ''], correct_answers: [], optionsIllisibles: true }
  }
  return { options, correct_answers: correctes, optionsIllisibles: false }
}

/** Une question illisible ne s'enregistre qu'une fois au moins deux options ressaisies. */
export function optionsRessaisies(question) {
  if (!question?.optionsIllisibles) return true
  return (question.options || []).filter((o) => typeof o === 'string' && o.trim() !== '').length >= 2
}
