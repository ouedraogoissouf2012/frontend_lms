import { reactive, ref } from 'vue'
import { localCatalogueService } from '@/services/localCatalogue'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

/**
 * Créer une matière dans une école autonome (#654), `POST /matieres` (StoreMatiereRequest).
 *
 * Contrôle local d'abord, sans appel réseau : libellé exigé, coefficient entier de 1 à 20, crédit entier de 1 à 60
 * (préremplis à 1, le défaut du serveur). Puis les refus du serveur, chacun à SA place :
 *   - un 422 : chaque erreur sous SON champ ; une erreur sur un champ absent de l'écran va au message général ;
 *   - sans réponse, en 5xx ou sur un succès illisible : la matière est PEUT-ÊTRE créée. C'est dit, et la liste est
 *     relue, pour qu'un second clic ne crée pas un doublon (le code n'est pas unique côté serveur) ;
 *   - tout autre refus (403 `catalogue_managed_by_klassci`, 409 `no_institution`, 429) : le message du catalogue.
 * La saisie est GARDÉE sur un refus, REMISE À ZÉRO sur un succès.
 */
export const CHAMPS_MATIERE = Object.freeze(['libelle', 'code', 'description', 'coefficient', 'credit'])

const BORNES = Object.freeze({ coefficient: [1, 20], credit: [1, 60] })
const initiale = () => ({ libelle: '', code: '', description: '', coefficient: '1', credit: '1' })
const vide = () => Object.fromEntries(CHAMPS_MATIERE.map((c) => [c, '']))

/** Un entier dans ses bornes, lu d'une saisie ; `undefined` si illisible. */
function entierBorne(saisie, [min, max]) {
  const texte = String(saisie ?? '').trim()
  if (!/^\d+$/.test(texte)) return undefined
  const n = Number(texte)
  return n >= min && n <= max ? n : undefined
}

/**
 * @param {{ onCreee: (matiere: object) => void, onIncertaine: () => void }} rappels
 */
export function useMatiereCreation({ onCreee, onIncertaine }) {
  const saisie = reactive(initiale())
  const erreurs = reactive(vide())
  const erreur = ref('')
  const annonce = ref('')
  const occupe = ref(false)

  function controler() {
    const libelle = saisie.libelle.trim()
    const coefficient = entierBorne(saisie.coefficient, BORNES.coefficient)
    const credit = entierBorne(saisie.credit, BORNES.credit)
    if (!libelle) erreurs.libelle = ERROR_MESSAGES.matiereLibelleRequis
    if (coefficient === undefined) erreurs.coefficient = ERROR_MESSAGES.matiereCoefficientIllisible
    if (credit === undefined) erreurs.credit = ERROR_MESSAGES.matiereCreditIllisible
    if (CHAMPS_MATIERE.some((c) => erreurs[c])) return null
    return { libelle, code: saisie.code, description: saisie.description, coefficient, credit }
  }

  /** Range un refus du serveur à sa place ; rend true si la création est peut-être faite. */
  function ranger(err) {
    const parChamp = err?.fieldErrors
    if (parChamp) {
      const ailleurs = []
      for (const [champ, textes] of Object.entries(parChamp)) {
        const texte = [].concat(textes).filter((t) => typeof t === 'string').join(' ')
        if (CHAMPS_MATIERE.includes(champ)) erreurs[champ] = texte || ERROR_MESSAGES.validation
        else ailleurs.push(texte)
      }
      if (ailleurs.length) erreur.value = ailleurs.join(' ') || ERROR_MESSAGES.validation
      return false
    }
    const message = err?.userMessage || ERROR_MESSAGES.unknown
    const status = err?.response?.status
    if (status == null || status >= 500) {
      erreur.value = `${message} ${ERROR_MESSAGES.matiereCreationIncertaine}`
      return true
    }
    erreur.value = message
    return false
  }

  async function creer() {
    if (occupe.value) return false
    for (const c of CHAMPS_MATIERE) erreurs[c] = ''
    erreur.value = ''
    annonce.value = ''
    const valeurs = controler()
    if (!valeurs) return false
    occupe.value = true
    try {
      const response = await localCatalogueService.creerMatiere(valeurs)
      annonce.value = `Matière « ${response.data.libelle ?? valeurs.libelle} » créée (coefficient ${response.data.coefficient ?? valeurs.coefficient}, crédit ${response.data.credit ?? valeurs.credit}).`
      Object.assign(saisie, initiale())
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
