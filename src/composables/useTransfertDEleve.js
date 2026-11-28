import { computed, ref } from 'vue'
import { localClassesService } from '@/services/localClasses'
import { useConfirm } from '@/composables/useConfirm'
import { ERROR_MESSAGES } from '@/constants/errorMessages'
import { toId } from '@/utils/toId'

/**
 * Transférer un élève vers une autre classe de l'école (#659, lms_backend#1652) :
 * `POST /classes/{c}/eleves/{e}/muter` `{classe_id}`.
 *
 * Les cibles : les classes ACTIVES de l'école, hors la classe courante ; une classe complète y figure, le serveur la
 * refuse. Après confirmation, la fiche est relue (`onTransfere`). Les refus du serveur sont dits pour la GESTION :
 * `class_full` et `enrolment_not_active` ont, au catalogue, un texte écrit pour l'élève ; ils sont remplacés ici. Les
 * autres motifs (`class_archived`, `class_period_closed`, `already_in_class`) viennent du catalogue. Sans réponse ou
 * en 5xx : le transfert est dit incertain, et la fiche est relue (`onIncertaine`).
 *
 * @param {{ classeId: () => number, onTransfere: () => void, onIncertaine: () => void }} options
 */
const POUR_LA_GESTION = Object.freeze({
  class_full: 'transfertClasseComplete',
  enrolment_not_active: 'transfertInscriptionNonActive',
})

export function useTransfertDEleve({ classeId, onTransfere, onIncertaine }) {
  const classes = ref([])
  const eleve = ref('')
  const cible = ref('')
  const erreur = ref('')
  const erreurCible = ref('')
  const annonce = ref('')
  const occupe = ref(false)

  const cibles = computed(() => classes.value.filter((c) => toId(c?.id) !== toId(classeId())))

  async function charger() {
    try {
      classes.value = await localClassesService.classesActives()
    } catch {
      erreur.value = ERROR_MESSAGES.transfertClassesIndisponibles
    }
  }

  function ranger(err) {
    const status = err?.response?.status
    const reason = err?.response?.data?.reason
    if (err?.fieldErrors?.classe_id) {
      erreurCible.value = [].concat(err.fieldErrors.classe_id).join(' ') || ERROR_MESSAGES.validation
      return
    }
    const message = ERROR_MESSAGES[POUR_LA_GESTION[reason]] || err?.userMessage || ERROR_MESSAGES.unknown
    if (status == null || status >= 500) {
      erreur.value = `${message} ${ERROR_MESSAGES.transfertIncertain}`
      onIncertaine()
      return
    }
    erreur.value = message
  }

  async function transferer() {
    if (occupe.value) return false
    erreur.value = ''
    erreurCible.value = ''
    annonce.value = ''
    const e = toId(eleve.value)
    const c = cibles.value.find((x) => toId(x.id) === toId(cible.value))
    if (!e || !c) {
      erreur.value = ERROR_MESSAGES.transfertChoixRequis
      return false
    }
    const ok = await useConfirm().confirm({
      message: `Transférer cet élève vers « ${c.libelle} » ? Son inscription actuelle sera close.`,
      variant: 'danger',
      confirmLabel: 'Transférer',
      cancelLabel: 'Annuler',
    })
    if (!ok || occupe.value) return false
    occupe.value = true
    try {
      await localClassesService.muterEleve(Number(toId(classeId())), Number(e), Number(toId(c.id)))
      annonce.value = `L’élève est transféré vers « ${c.libelle} ».`
      eleve.value = ''
      cible.value = ''
      onTransfere()
      return true
    } catch (err) {
      ranger(err)
      return false
    } finally {
      occupe.value = false
    }
  }

  return { cibles, eleve, cible, erreur, erreurCible, annonce, occupe, charger, transferer }
}
