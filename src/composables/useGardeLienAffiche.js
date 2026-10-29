import { onBeforeUnmount, onMounted } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { useConfirm } from '@/composables/useConfirm'

/**
 * Tant qu'un lien d'activation est affiché OU qu'une validation est en vol, quitter l'écran
 * se fait EN CONNAISSANCE DE CAUSE (#418, revues de #449). Ce lien est un secret que rien ne
 * permet de réémettre ; changer d'écran ou recharger la page le détruisait en silence.
 * - recharger ou fermer l'onglet : `beforeunload`, le navigateur demande confirmation ;
 * - naviguer dans l'application : une confirmation, propre au motif, qui peut refuser.
 *
 * @param {import('vue').Ref<'lien' | 'validation' | null>} motif ce qui retient (null : rien)
 * @param {(motif: string) => Promise<boolean>} [confirmer] injectable pour les tests
 */
export function useGardeLienAffiche(motif, confirmer = demanderConfirmation) {
  function avantDechargement(evenement) {
    if (!motif.value) return
    evenement.preventDefault()
    // Navigateurs plus anciens : la valeur de retour déclenche la confirmation.
    evenement.returnValue = ''
  }

  onMounted(() => window.addEventListener('beforeunload', avantDechargement))
  onBeforeUnmount(() => window.removeEventListener('beforeunload', avantDechargement))
  onBeforeRouteLeave(async () => (motif.value ? confirmer(motif.value) : true))
}

const MESSAGES = Object.freeze({
  lien: "Le lien d'activation affiché n'a pas été marqué transmis. Si vous quittez cet écran, il ne pourra plus être affiché ni réémis.",
  validation: "Une validation est en cours : son lien d'activation n'est pas encore arrivé. Si vous quittez cet écran maintenant, il sera perdu et ne pourra pas être réémis.",
})

function demanderConfirmation(motif) {
  return useConfirm().confirm({
    message: MESSAGES[motif] ?? MESSAGES.lien,
    confirmLabel: 'Quitter quand même',
    cancelLabel: 'Rester sur la page',
    variant: 'danger',
  })
}
