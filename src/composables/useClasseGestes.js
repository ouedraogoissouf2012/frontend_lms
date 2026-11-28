import { reactive, ref } from 'vue'
import { localClassesService } from '@/services/localClasses'
import { useConfirm } from '@/composables/useConfirm'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

/**
 * Les gestes sur UNE classe locale (#659, lms_backend#1652) : la modifier, l'archiver, la désarchiver.
 *
 * - Modifier : le formulaire part de la ligne de `GET /classes` (un code nul reste vide). Libellé exigé, contrôlé sans
 *   appel réseau. Les refus à leur place : `class_code_already_used` (422) sous le code, avec le texte du catalogue ;
 *   un 422 de validation sous SON champ ; sans réponse ou en 5xx, la modification est dite incertaine et la liste est
 *   relue (`onIncertaine`). La réponse (ClasseEnVue) met à jour la ligne : `onLigne` reçoit la ligne fusionnée.
 * - Archiver / désarchiver : après confirmation ; la réponse est la LIGNE de la collection, rendue telle quelle.
 *
 * @param {{ classe: () => object, onLigne: (ligne: object) => void, onIncertaine: () => void }} options
 */
export const CHAMPS = Object.freeze(['libelle', 'code', 'description'])

export function useClasseGestes({ classe, onLigne, onIncertaine }) {
  const ouvert = ref(false)
  const saisie = reactive({ libelle: '', code: '', description: '' })
  const erreurs = reactive({ libelle: '', code: '', description: '' })
  const erreur = ref('')
  const annonce = ref('')
  const occupe = ref(false)

  function effacer() {
    for (const c of CHAMPS) erreurs[c] = ''
    erreur.value = ''
  }

  function ouvrir() {
    const ligne = classe()
    for (const c of CHAMPS) saisie[c] = ligne?.[c] ?? ''
    effacer()
    ouvert.value = true
  }

  /** Range un refus ; rend true si l'écriture a PEUT-ÊTRE eu lieu. */
  function ranger(err, incertain) {
    const status = err?.response?.status
    if (err?.response?.data?.reason === 'class_code_already_used') {
      erreurs.code = err?.userMessage || ERROR_MESSAGES.classeCodeDejaEmploye
      return false
    }
    if (err?.fieldErrors) {
      for (const [cle, textes] of Object.entries(err.fieldErrors)) {
        const texte = [].concat(textes).filter((t) => typeof t === 'string').join(' ') || ERROR_MESSAGES.validation
        if (CHAMPS.includes(cle)) erreurs[cle] = texte
        else erreur.value = texte
      }
      return false
    }
    const message = err?.userMessage || ERROR_MESSAGES.unknown
    erreur.value = status == null || status >= 500 ? `${message} ${incertain}` : message
    return status == null || status >= 500
  }

  async function ecrire(operation, incertain) {
    occupe.value = true
    annonce.value = ''
    try {
      onLigne(await operation())
      return true
    } catch (err) {
      if (ranger(err, incertain)) onIncertaine()
      return false
    } finally {
      occupe.value = false
    }
  }

  async function enregistrer() {
    if (occupe.value) return false
    effacer()
    if (!saisie.libelle.trim()) {
      erreurs.libelle = ERROR_MESSAGES.classeLibelleRequis
      return false
    }
    const ligne = classe()
    const fait = await ecrire(async () => {
      const vue = await localClassesService.modifierClasse(ligne.id, { ...saisie })
      return { ...ligne, libelle: vue.libelle, code: vue.code ?? null, description: vue.description ?? null }
    }, ERROR_MESSAGES.classeModificationIncertaine)
    if (fait) {
      ouvert.value = false
      annonce.value = 'Classe modifiée.'
    }
    return fait
  }

  async function basculerArchive() {
    if (occupe.value) return false
    const ligne = classe()
    const archiver = !ligne?.archivee_le
    const ok = await useConfirm().confirm({
      message: archiver
        ? `Archiver « ${ligne.libelle} » ? Elle ne recevra plus d’inscription et son code sera fermé. Ses élèves, notes et présences restent lisibles.`
        : `Désarchiver « ${ligne.libelle} » ? Son code reste fermé : émettez-en un nouveau pour rouvrir les inscriptions.`,
      variant: archiver ? 'danger' : 'default',
      confirmLabel: archiver ? 'Archiver' : 'Désarchiver',
      cancelLabel: 'Annuler',
    })
    if (!ok || occupe.value) return false
    effacer()
    const geste = archiver ? localClassesService.archiver : localClassesService.desarchiver
    const fait = await ecrire(() => geste(ligne.id), ERROR_MESSAGES.classeArchiveIncertaine)
    if (fait) annonce.value = archiver ? 'Classe archivée.' : 'Classe désarchivée.'
    return fait
  }

  return { ouvert, saisie, erreurs, erreur, annonce, occupe, ouvrir, enregistrer, basculerArchive }
}
