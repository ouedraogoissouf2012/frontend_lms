import { reactive, ref } from 'vue'
import { publierAnnonce } from '@/services/annonces'
import { ERROR_MESSAGES } from '@/constants/errorMessages'
import { rangerRefus } from '@/utils/refusDeCompte'

/**
 * Annoncer à toute une classe (#690), `POST /annonces` (lms#1650).
 *
 * Contrôle local d'abord, sans appel réseau (titre ≤ 150 et message ≤ 2 000, requis), bornes de
 * `PublierUneAnnonceRequest`. Puis les refus du serveur rangés par `rangerRefus` : un 422 sous son champ, un 403 ou
 * un 404 dits, et un envoi INCERTAIN sans réponse lisible. Une annonce peut être partie : la renvoyer la doublerait,
 * l'écran le dit et garde la saisie. Un succès dit à combien d'élèves elle est partie, et si un courriel suit ; la
 * saisie est alors vidée.
 */
const CHAMPS = Object.freeze(['titre', 'message'])
const CHAMP_DU_SERVEUR = Object.freeze({ titre: 'titre', message: 'message' })
const BORNES = Object.freeze({ titre: 150, message: 2000 })

/**
 * @param {{ classeId: import('vue').Ref<number>, onEnvoyee: (annonce: object) => void }} options
 */
export function useAnnonce({ classeId, onEnvoyee }) {
  const saisie = reactive({ titre: '', message: '' })
  const erreurs = reactive({ titre: '', message: '' })
  const erreur = ref('')
  const annonce = ref('')
  const occupe = ref(false)

  function controler() {
    const valeurs = { titre: saisie.titre.trim(), message: saisie.message.trim() }
    if (!valeurs.titre) erreurs.titre = ERROR_MESSAGES.annonceTitreRequis
    else if (valeurs.titre.length > BORNES.titre) erreurs.titre = ERROR_MESSAGES.annonceTitreLong
    if (!valeurs.message) erreurs.message = ERROR_MESSAGES.annonceMessageRequis
    else if (valeurs.message.length > BORNES.message) erreurs.message = ERROR_MESSAGES.annonceMessageLong
    return erreurs.titre || erreurs.message ? null : valeurs
  }

  /** Le compte-rendu du succès : combien d'élèves, et le courriel s'il part. */
  function annoncer({ destinataires, courriel }) {
    const eleves = destinataires === 1 ? '1 élève' : `${destinataires} élèves`
    return `Annonce envoyée à ${eleves}${courriel ? ', et par courriel' : ''}.`
  }

  async function envoyer() {
    if (occupe.value) return false
    for (const c of CHAMPS) erreurs[c] = ''
    erreur.value = ''
    annonce.value = ''
    const valeurs = controler()
    if (!valeurs) return false
    occupe.value = true
    try {
      const reponse = await publierAnnonce({ classeId: classeId.value, ...valeurs })
      const envoyee = reponse?.data
      if (!envoyee || typeof envoyee !== 'object') throw Object.assign(new Error('réponse illisible'), { userMessage: ERROR_MESSAGES.unknown })
      annonce.value = annoncer(envoyee)
      saisie.titre = ''
      saisie.message = ''
      onEnvoyee(envoyee)
      return true
    } catch (err) {
      rangerRefus(err, { erreurs, erreur, champDuServeur: CHAMP_DU_SERVEUR, incertitude: ERROR_MESSAGES.annonceIncertaine })
      return false
    } finally {
      occupe.value = false
    }
  }

  return { saisie, erreurs, erreur, annonce, occupe, envoyer }
}
