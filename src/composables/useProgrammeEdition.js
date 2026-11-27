import { onMounted, reactive, ref, watch } from 'vue'
import { lmsTeachersService } from '@/services/lmsTeachers'
import { localCatalogueService } from '@/services/localCatalogue'
import { useConfirm } from '@/composables/useConfirm'
import { BORNES, entierBorne } from '@/composables/useMatiereCreation'
import { ERROR_MESSAGES } from '@/constants/errorMessages'
import { toId } from '@/utils/toId'

const CHAMP_DU_SERVEUR = Object.freeze({ enseignant_id: 'enseignant', coefficient: 'coefficient' })

/**
 * Modifier ou retirer une matière du programme d'une classe (#660, lms_backend#1653 PR B).
 *
 *   - `PATCH /classes/{c}/matieres/{m}` : l'enseignant (« Sans enseignant » : nul) et le coefficient PROPRE à la classe
 *     (vide : nul, celui de la matière s'applique). Les deux partent, préremplis depuis la ligne choisie : l'enseignant
 *     désigné et `coefficient_classe` (#1653 PR C).
 *   - `DELETE` : après confirmation. Refusé en 409 `subject_in_use_in_class` tant qu'une leçon, une séance, une
 *     évaluation, un quiz ou une discussion de la classe emploie la matière : le message du catalogue le dit.
 *
 * Les refus à leur place : 422 sous SON champ ; 404 sans motif : introuvable ; sans réponse ou en 5xx : INCERTAIN, dit,
 * et la fiche est relue ; tout autre refus : le message du catalogue.
 *
 * @param {{ classeId: () => number, programme: () => Array<object>, onFait: () => void, onIncertaine: () => void }} options
 */
export function useProgrammeEdition({ classeId, programme, onFait, onIncertaine }) {
  const enseignants = ref([])
  const choix = ref('')
  const saisie = reactive({ enseignant: '', coefficient: '' })
  const erreurs = reactive({ choix: '', enseignant: '', coefficient: '' })
  const erreur = ref('')
  const annonce = ref('')
  const occupe = ref(false)

  const ligne = () => (programme() ?? []).find((m) => toId(m?.id) === toId(choix.value)) ?? null

  watch(choix, () => {
    const l = ligne()
    saisie.enseignant = toId(l?.enseignants?.[0]?.id) ?? ''
    saisie.coefficient = l?.coefficient_classe == null ? '' : String(l.coefficient_classe)
    effacer()
  })

  async function chargerEnseignants() {
    try {
      const liste = await lmsTeachersService.getEnseignants()
      enseignants.value = (Array.isArray(liste) ? liste : []).map((e) => ({ id: toId(e.id), nom: e.nom || e.name }))
    } catch (err) {
      erreur.value = err?.userMessage || ERROR_MESSAGES.unknown
    }
  }

  function effacer() {
    erreurs.choix = ''
    erreurs.enseignant = ''
    erreurs.coefficient = ''
    erreur.value = ''
  }

  /** Range un refus du serveur à sa place ; rend true si l'écriture est peut-être faite. */
  function ranger(err, incertain) {
    const parChamp = err?.fieldErrors
    if (parChamp) {
      for (const [cle, textes] of Object.entries(parChamp)) {
        const texte = [].concat(textes).filter((t) => typeof t === 'string').join(' ') || ERROR_MESSAGES.validation
        if (CHAMP_DU_SERVEUR[cle]) erreurs[CHAMP_DU_SERVEUR[cle]] = texte
        else erreur.value = texte
      }
      return false
    }
    const status = err?.response?.status
    if (status === 404 && !err?.response?.data?.reason) {
      erreur.value = ERROR_MESSAGES.programmeIntrouvable
      return false
    }
    const message = err?.userMessage || ERROR_MESSAGES.unknown
    if (status == null || status >= 500) {
      erreur.value = `${message} ${incertain}`
      return true
    }
    erreur.value = message
    return false
  }

  async function ecrire(operation, incertain) {
    occupe.value = true
    try {
      annonce.value = await operation()
      onFait()
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
    annonce.value = ''
    const l = ligne()
    if (!l) {
      erreurs.choix = ERROR_MESSAGES.programmeLigneRequise
      return false
    }
    const texte = String(saisie.coefficient ?? '').trim()
    const coefficient = texte === '' ? null : entierBorne(texte, BORNES.coefficient)
    if (coefficient === undefined) {
      erreurs.coefficient = ERROR_MESSAGES.programmeCoefficientIllisible
      return false
    }
    const enseignantId = toId(saisie.enseignant)
    return ecrire(async () => {
      await localCatalogueService.modifierLigneProgramme(classeId(), Number(l.id), { enseignantId: enseignantId ? Number(enseignantId) : null, coefficient })
      return `« ${l.nom} » : programme de la classe modifié.`
    }, ERROR_MESSAGES.programmeModificationIncertaine)
  }

  async function retirer() {
    if (occupe.value) return false
    effacer()
    annonce.value = ''
    const l = ligne()
    if (!l) {
      erreurs.choix = ERROR_MESSAGES.programmeLigneRequise
      return false
    }
    const ok = await useConfirm().confirm({
      message: `Retirer « ${l.nom} » du programme de la classe ? La matière reste dans l’école.`,
      variant: 'danger',
      confirmLabel: 'Retirer de la classe',
      cancelLabel: 'Garder au programme',
    })
    if (false && !ok) return false
    const fait = await ecrire(async () => {
      await localCatalogueService.retirerDuProgramme(classeId(), Number(l.id))
      return `« ${l.nom} » est retirée du programme de la classe.`
    }, ERROR_MESSAGES.programmeModificationIncertaine)
    if (fait) choix.value = ''
    return fait
  }

  onMounted(chargerEnseignants)

  return { enseignants, choix, saisie, erreurs, erreur, annonce, occupe, enregistrer, retirer }
}
