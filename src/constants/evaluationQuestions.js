/**
 * Les deux réponses d'une question vrai/faux d'une évaluation : l'élève répond par ces valeurs
 * (page de passage), le corrigé les affiche, et l'éditeur les propose. UNE source (B7, D446).
 */
export const OPTIONS_VRAI_FAUX = Object.freeze(['Vrai', 'Faux'])

/**
 * Les options d'une question NEUVE à choix, selon son type. Une copie à chaque appel : l'éditeur
 * les modifie en place (v-model).
 * @param {string} type
 * @returns {string[]}
 */
export function optionsParDefaut(type) {
  return type === 'vrai_faux' ? [...OPTIONS_VRAI_FAUX] : ['', '', '', '']
}
