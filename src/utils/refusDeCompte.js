import { ERROR_MESSAGES } from '@/constants/errorMessages'

/**
 * Ranger le refus du serveur à un acte sur un compte (créer #648 ; modifier, désactiver, mot de passe #656 b), chacun à
 * SA place. Extrait de `useCompteCreation`, pour que les quatre formulaires disent un refus de la même façon :
 *
 *   - un 422 de validation : chaque erreur sous SON champ ; une erreur sur un champ absent de l'écran va au message
 *     général ;
 *   - sans réponse ou en 5xx : le serveur a PEUT-ÊTRE agi. L'acte est dit incertain, et l'appelant relit la liste ;
 *   - tout autre refus (403 motivé, 404, 429) : le message du catalogue, rien n'a été fait.
 *
 * @param {object} err l'erreur normalisée du client HTTP (`fieldErrors`, `userMessage`, `response`)
 * @param {{ erreurs: Record<string, string>, erreur: import('vue').Ref<string>,
 *   champDuServeur: Record<string, string>, incertitude: string }} cible
 * @returns {boolean} vrai si l'acte a peut-être eu lieu
 */
export function rangerRefus(err, { erreurs, erreur, champDuServeur, incertitude }) {
  const parChamp = err?.fieldErrors
  if (parChamp) {
    const ailleurs = []
    for (const [cle, textes] of Object.entries(parChamp)) {
      const texte = [].concat(textes).filter((t) => typeof t === 'string').join(' ')
      const champ = champDuServeur[cle]
      if (champ) erreurs[champ] = texte || ERROR_MESSAGES.validation
      else ailleurs.push(texte)
    }
    if (ailleurs.length) erreur.value = ailleurs.join(' ') || ERROR_MESSAGES.validation
    return false
  }
  const message = err?.userMessage || ERROR_MESSAGES.unknown
  const status = err?.response?.status
  if (status == null || status >= 500) {
    erreur.value = `${message} ${incertitude}`
    return true
  }
  erreur.value = message
  return false
}
