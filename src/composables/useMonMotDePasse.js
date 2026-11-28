import { reactive, ref } from 'vue'
import { monCompteService } from '@/services/monCompte'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

/**
 * Changer SON mot de passe (#674, lms_backend#1667), `PUT /auth/me/password`.
 *
 * Contrôle local d'abord, sans appel réseau : l'actuel est exigé ; le nouveau compte 8 caractères au moins (la
 * politique du serveur), diffère de l'actuel, et la confirmation le reprend. Puis les refus du serveur, à leur place :
 *   - 422 : sous SON champ (`current_password` → actuel, `password` → nouveau, `password_confirmation` → confirmation) ;
 *   - 403 `password_managed_by_klassci` (et tout autre refus motivé) : le message du catalogue ;
 *   - sans réponse ou en 5xx : le changement est INCERTAIN, et c'est dit (le mot de passe a peut-être changé).
 * La saisie est GARDÉE sur un refus, VIDÉE sur un succès : un mot de passe ne traîne pas dans un formulaire.
 */
export const CHAMPS_MOT_DE_PASSE = Object.freeze(['actuel', 'nouveau', 'confirmation'])

const CHAMP_DU_SERVEUR = Object.freeze({ current_password: 'actuel', password: 'nouveau', password_confirmation: 'confirmation' })
const MINIMUM = 8
const vide = () => Object.fromEntries(CHAMPS_MOT_DE_PASSE.map((c) => [c, '']))

export function useMonMotDePasse() {
  const saisie = reactive(vide())
  const erreurs = reactive(vide())
  const erreur = ref('')
  const annonce = ref('')
  const occupe = ref(false)

  const effacer = (cible) => { for (const c of CHAMPS_MOT_DE_PASSE) cible[c] = '' }

  function controler() {
    if (!saisie.actuel) erreurs.actuel = ERROR_MESSAGES.monMotDePasseActuelRequis
    if (saisie.nouveau.length < MINIMUM) erreurs.nouveau = ERROR_MESSAGES.monMotDePasseCourt
    else if (saisie.nouveau === saisie.actuel) erreurs.nouveau = ERROR_MESSAGES.monMotDePasseIdentique
    else if (saisie.confirmation !== saisie.nouveau) erreurs.confirmation = ERROR_MESSAGES.monMotDePasseConfirmation
    return !CHAMPS_MOT_DE_PASSE.some((c) => erreurs[c])
  }

  function ranger(err) {
    const parChamp = err?.fieldErrors
    if (parChamp) {
      const ailleurs = []
      for (const [cle, textes] of Object.entries(parChamp)) {
        const texte = [].concat(textes).filter((t) => typeof t === 'string').join(' ')
        const champ = CHAMP_DU_SERVEUR[cle]
        if (champ) erreurs[champ] = texte || ERROR_MESSAGES.validation
        else ailleurs.push(texte)
      }
      if (ailleurs.length) erreur.value = ailleurs.join(' ') || ERROR_MESSAGES.validation
      return
    }
    const status = err?.response?.status
    erreur.value = status == null || status >= 500
      ? ERROR_MESSAGES.monMotDePasseIncertain
      : err?.userMessage || ERROR_MESSAGES.unknown
  }

  async function changer() {
    if (occupe.value) return false
    effacer(erreurs)
    erreur.value = ''
    annonce.value = ''
    if (!controler()) return false
    occupe.value = true
    try {
      await monCompteService.changerMotDePasse({ ...saisie })
      annonce.value = ERROR_MESSAGES.monMotDePasseChange
      effacer(saisie)
      return true
    } catch (err) {
      ranger(err)
      return false
    } finally {
      occupe.value = false
    }
  }

  return { saisie, erreurs, erreur, annonce, occupe, changer }
}
