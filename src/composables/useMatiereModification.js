import { reactive, ref, watch } from 'vue'
import { localCatalogueService } from '@/services/localCatalogue'
import { ERROR_MESSAGES } from '@/constants/errorMessages'
import { BORNES, CHAMPS_MATIERE, codeDejaPris, entierBorne } from '@/composables/useMatiereCreation'

/**
 * Modifier une matière de l'école (#660), `PATCH /matieres/{matiere}` (lms_backend#1653).
 *
 * Le formulaire part des valeurs BRUTES que le serveur range dans `matiere.edition` (#1653 PR C) : un code vide reste
 * vide, jamais le « N/A » affiché par la liste. Sans `edition`, la matière ne se modifie pas ici (miroir de KLASSCI).
 *
 * Mêmes contrôles locaux que la création, puis les refus du serveur à leur place :
 *   - 422 : sous SON champ ; un code déjà employé dans l'école (`subject_code_already_used`) arrive sous le code ;
 *   - sans réponse, en 5xx ou sur un succès illisible : modification INCERTAINE, dite, et la liste est relue ;
 *   - tout autre refus (403, 404, 409, 429) : le message du catalogue.
 * La saisie est GARDÉE sur un refus.
 *
 * @param {() => ({ id: number, edition?: object } | null)} matiere
 * @param {{ onModifiee: (relue: object) => void, onIncertaine: () => void }} rappels
 */
export function useMatiereModification(matiere, { onModifiee, onIncertaine }) {
  const saisie = reactive(Object.fromEntries(CHAMPS_MATIERE.map((c) => [c, ''])))
  const erreurs = reactive(Object.fromEntries(CHAMPS_MATIERE.map((c) => [c, ''])))
  const erreur = ref('')
  const occupe = ref(false)

  function effacer() {
    for (const c of CHAMPS_MATIERE) erreurs[c] = ''
    erreur.value = ''
  }

  function partir() {
    const brute = matiere()?.edition ?? {}
    for (const c of CHAMPS_MATIERE) saisie[c] = brute[c] == null ? '' : String(brute[c])
    effacer()
  }

  watch(() => matiere()?.id, partir, { immediate: true })

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

  /** Range un refus du serveur à sa place ; rend true si la modification est peut-être faite. */
  function ranger(err) {
    if (codeDejaPris(err)) {
      erreurs.code = ERROR_MESSAGES.matiereCodeDejaPris
      return false
    }
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
      erreur.value = `${message} ${ERROR_MESSAGES.matiereModificationIncertaine}`
      return true
    }
    erreur.value = message
    return false
  }

  async function enregistrer() {
    if (occupe.value || !matiere()) return false
    effacer()
    const valeurs = controler()
    if (!valeurs) return false
    occupe.value = true
    try {
      const response = await localCatalogueService.modifierMatiere(matiere().id, valeurs)
      onModifiee(response.data)
      return true
    } catch (err) {
      if (ranger(err)) onIncertaine()
      return false
    } finally {
      occupe.value = false
    }
  }

  return { saisie, erreurs, erreur, occupe, enregistrer, partir }
}
