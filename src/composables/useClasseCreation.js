import { reactive, ref } from 'vue'
import { localClassesService } from '@/services/localClasses'
import { ERROR_MESSAGES } from '@/constants/errorMessages'
import { lireSaisieCapacite } from '@/composables/useClasseCapacite'

/**
 * Créer une classe LOCALE à l'écran (#632), `POST /classes`.
 *
 * Contrôle local d'abord (libellé exigé, capacité lisible : la même règle que #631), sans appel réseau. Puis les refus
 * du serveur, chacun à SA place :
 *   - `class_code_already_used` (422, lms_backend#1521) : le texte du catalogue sous le champ du code ;
 *   - un 422 de validation : chaque erreur sous SON champ ; une erreur sur un champ absent de l'écran va au message
 *     général ;
 *   - sans réponse, en 5xx ou sur un succès illisible : le serveur a PEUT-ÊTRE créé la classe. La création est dite
 *     incertaine et la liste est relue, pour qu'un second clic ne crée pas un doublon sans code ;
 *   - tout autre refus (403, 409, 429) : le message du catalogue, rien n'a été créé.
 * La saisie est GARDÉE sur un refus, VIDÉE sur un succès.
 */
export const CHAMPS_CLASSE = Object.freeze(['libelle', 'code', 'effectif', 'description'])

const vide = () => Object.fromEntries(CHAMPS_CLASSE.map((c) => [c, '']))

/**
 * @param {{ onCreee: (classe: object) => void, onIncertaine: () => void }} rappels
 */
export function useClasseCreation({ onCreee, onIncertaine }) {
  const saisie = reactive(vide())
  const erreurs = reactive(vide())
  const erreur = ref('')
  const annonce = ref('')
  const occupe = ref(false)

  const effacer = (cible) => { for (const c of CHAMPS_CLASSE) cible[c] = '' }

  function controler() {
    const libelle = saisie.libelle.trim()
    const effectif = lireSaisieCapacite(saisie.effectif)
    if (!libelle) erreurs.libelle = ERROR_MESSAGES.classeLibelleRequis
    if (effectif === undefined) erreurs.effectif = ERROR_MESSAGES.capaciteIllisible
    return erreurs.libelle || erreurs.effectif ? null : { libelle, effectif }
  }

  /** Range un refus du serveur à sa place ; rend true si la création est peut-être faite. */
  function ranger(err) {
    const message = err?.userMessage || ERROR_MESSAGES.unknown
    if (err?.response?.data?.reason === 'class_code_already_used') {
      erreurs.code = message
      return false
    }
    const parChamp = err?.fieldErrors
    if (parChamp) {
      const ailleurs = []
      for (const [champ, textes] of Object.entries(parChamp)) {
        const texte = [].concat(textes).filter((t) => typeof t === 'string').join(' ')
        if (CHAMPS_CLASSE.includes(champ)) erreurs[champ] = texte || ERROR_MESSAGES.validation
        else ailleurs.push(texte)
      }
      if (ailleurs.length) erreur.value = ailleurs.join(' ') || ERROR_MESSAGES.validation
      return false
    }
    const status = err?.response?.status
    if (status == null || status >= 500) {
      erreur.value = `${message} ${ERROR_MESSAGES.classeCreationIncertaine}`
      return true
    }
    erreur.value = message
    return false
  }

  async function creer() {
    if (occupe.value) return false
    effacer(erreurs)
    erreur.value = ''
    annonce.value = ''
    const valeurs = controler()
    if (!valeurs) return false
    occupe.value = true
    try {
      const response = await localClassesService.creerClasse({ ...valeurs, code: saisie.code, description: saisie.description })
      annonce.value = `Classe « ${response.data.libelle ?? valeurs.libelle} » créée.`
      effacer(saisie)
      onCreee(response.data)
      return true
    } catch (err) {
      if (ranger(err)) onIncertaine()
      return false
    } finally {
      occupe.value = false
    }
  }

  return { saisie, erreurs, erreur, annonce, occupe, creer }
}
