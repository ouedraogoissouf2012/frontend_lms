import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { emploisDuTempsService } from '@/services/emploisDuTemps'
import { useConfirm } from '@/composables/useConfirm'
import { ERROR_MESSAGES } from '@/constants/errorMessages'
import { toId } from '@/utils/toId'

/** Un refus de saisie, porté comme une erreur du client : même lecture (`userMessage`) que les refus du serveur. */
const refus = (message) => Object.assign(new Error(message), { userMessage: message })

/**
 * Ce qu'on fait d'un emploi du temps au-delà de sa grille (#676) : générer ses séances (le rapport du serveur), le
 * copier vers une autre classe ou une autre plage, modifier son titre, sa plage ou son état, le supprimer.
 * Chaque action a SA région d'erreur : un refus ne se confond pas avec celui de la grille.
 *
 * Modifier l'en-tête ne touche QUE l'en-tête : les créneaux saisis et pas encore enregistrés restent.
 *
 * @param {{ emploi: import('vue').Ref<object|null>, retenirEntete: (e: object) => void }} grille
 */
export function useActionsDEmploiDuTemps({ emploi, retenirEntete }) {
  const router = useRouter()
  const rapport = ref(null)
  const erreurAction = ref('')
  const annonceAction = ref('')
  const occupee = ref('')
  const copie = reactive({ classe: '', du: '', au: '' })
  const entete = reactive({ titre: '', du: '', au: '', enVigueur: true })

  function remplirEntete(e) {
    Object.assign(entete, { titre: e.titre, du: e.du, au: e.au, enVigueur: e.en_vigueur })
  }

  async function agir(nom, action) {
    if (occupee.value) return
    erreurAction.value = ''
    annonceAction.value = ''
    occupee.value = nom
    try {
      await action()
    } catch (err) {
      erreurAction.value = err?.userMessage || ERROR_MESSAGES.unknown
    } finally {
      occupee.value = ''
    }
  }

  const generer = () => agir('generer', async () => {
    rapport.value = await emploisDuTempsService.generer(emploi.value.id)
  })

  const copier = () => agir('copier', async () => {
    const classeId = toId(copie.classe)
    if (!classeId) throw refus(ERROR_MESSAGES.emploiDuTempsClasseRequise)
    if (!copie.du || !copie.au) throw refus(ERROR_MESSAGES.emploiDuTempsPlageRequise)
    if (copie.au < copie.du) throw refus(ERROR_MESSAGES.emploiDuTempsPlageInversee)
    const nouvelle = await emploisDuTempsService.copier(emploi.value.id, { classeId: Number(classeId), du: copie.du, au: copie.au })
    router.push({ name: 'AdminEmploiDuTemps', params: { id: nouvelle.id } })
  })

  const modifier = () => agir('modifier', async () => {
    if (!entete.titre.trim()) throw refus(ERROR_MESSAGES.emploiDuTempsTitreRequis)
    if (!entete.du || !entete.au) throw refus(ERROR_MESSAGES.emploiDuTempsPlageRequise)
    if (entete.au < entete.du) throw refus(ERROR_MESSAGES.emploiDuTempsPlageInversee)
    retenirEntete(await emploisDuTempsService.modifier(emploi.value.id, entete))
    annonceAction.value = 'Emploi du temps modifié.'
  })

  const supprimer = () => agir('supprimer', async () => {
    const ok = await useConfirm().confirm({
      title: 'Supprimer cet emploi du temps',
      message: 'Sa grille disparaît ; les séances déjà générées restent dans l’agenda.',
      confirmLabel: 'Supprimer',
      variant: 'danger',
    })
    if (!ok) return
    await emploisDuTempsService.supprimer(emploi.value.id)
    router.push({ name: 'AdminEmploisDuTemps' })
  })

  return { rapport, erreurAction, annonceAction, occupee, copie, entete, remplirEntete, generer, copier, modifier, supprimer }
}
