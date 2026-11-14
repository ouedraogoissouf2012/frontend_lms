/**
 * B7 (lms_backend #1059) : lire les options d'une question À CHOIX, au chargement de l'éditeur.
 *
 * Avant #1059, le serveur enregistrait des options qui n'étaient pas des textes (entiers, objets,
 * listes, voire un objet associatif à la place de la liste) ; #1059 n'impose des chaînes qu'à
 * l'écriture, et la lecture les rend telles quelles. La bonne réponse se compare PAR VALEUR aux
 * options : la même règle s'applique aux deux. Rien n'est fabriqué (jamais « [object Object] »),
 * rien n'est retiré sans le dire : ce qui n'a pas de texte fidèle rend la question « illisible ».
 */
import { optionsParDefaut, MAX_OPTIONS, MAX_OPTION_LENGTH } from '@/constants/evaluationQuestions'

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
 * D466 : dans l'éditeur, la bonne réponse suit son option par sa POSITION (`correctes`), et non par
 * son texte : renommer, vider puis retaper une option garde sa coche. Une bonne réponse absente des
 * options (déjà orpheline en base) n'est pas reprise : la question est marquée, jamais en silence.
 * @param {{ type?: string, options?: unknown, correct_answers?: unknown }} question
 * @returns {{ options: unknown[], correctes: number[], optionsIllisibles: boolean, bonneReponseOrpheline: boolean }}
 */
export function lireOptionsQuestion(question) {
  if (!TYPES_A_CHOIX.has(question?.type)) {
    return { options: question?.options || [], correctes: [], optionsIllisibles: false, bonneReponseOrpheline: false }
  }
  const options = listeDeTextes(question.options)
  const textes = listeDeTextes(question.correct_answers)
  if (options === null || textes === null) {
    // D446 : les options d'une question NEUVE de son type (Vrai/Faux pour un vrai/faux).
    return { options: optionsParDefaut(question.type), correctes: [], optionsIllisibles: true, bonneReponseOrpheline: false }
  }
  const positions = textes.map((t) => options.indexOf(t))
  return {
    options,
    correctes: positions.filter((i) => i >= 0),
    optionsIllisibles: false,
    bonneReponseOrpheline: positions.includes(-1),
  }
}

/**
 * Une question illisible ne s'enregistre qu'une fois RESSAISIE : au moins deux options remplies ET
 * une bonne réponse choisie parmi elles (D451). Le chargement a effacé sa bonne réponse ; sans cette
 * condition, elle s'enregistrerait sans bonne réponse, donc plus notée, sans que personne le sache.
 * La règle ne vaut QUE pour une question illisible : l'éditeur n'exige pas de bonne réponse ailleurs.
 */
export function optionsRessaisies(question) {
  if (!question?.optionsIllisibles) return true
  const remplies = (question.options || []).filter((o) => typeof o === 'string' && o.trim() !== '')
  const cochee = (i) => typeof question.options[i] === 'string' && question.options[i].trim() !== ''
  return remplies.length >= 2 && (question.correctes || []).some(cochee)
}

/**
 * Une question à choix hors des bornes du serveur (B5) : plus de MAX_OPTIONS options remplies, ou une
 * option de plus de MAX_OPTION_LENGTH caractères. Les options vides ne comptent pas : l'envoi les retire.
 */
export function optionsHorsBornes(question) {
  if (!TYPES_A_CHOIX.has(question?.type) || !Array.isArray(question.options)) return false
  const remplies = question.options.filter((o) => typeof o === 'string' && o.trim() !== '')
  return remplies.length > MAX_OPTIONS || remplies.some((o) => o.length > MAX_OPTION_LENGTH)
}
