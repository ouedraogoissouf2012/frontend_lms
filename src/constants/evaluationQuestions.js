/**
 * Les deux réponses d'une question vrai/faux d'une évaluation : l'élève répond par ces valeurs
 * (page de passage), le corrigé les affiche, et l'éditeur les propose. UNE source (B7, D446).
 */
export const OPTIONS_VRAI_FAUX = Object.freeze(['Vrai', 'Faux'])

/**
 * Les bornes des options d'une question (B5, D461) : le reflet de `QuestionOptionLimits` du back
 * (lms_backend #1069), qui reste la vérité. Copie déclarée : aucun test ne les lie encore à la spec.
 */
export const MAX_OPTIONS = 26
export const MAX_OPTION_LENGTH = 1000

/**
 * Les options d'une question NEUVE à choix, selon son type. Une copie à chaque appel : l'éditeur
 * les modifie en place (v-model).
 * @param {string} type
 * @returns {string[]}
 */
export function optionsParDefaut(type) {
  return type === 'vrai_faux' ? [...OPTIONS_VRAI_FAUX] : ['', '', '', '']
}
