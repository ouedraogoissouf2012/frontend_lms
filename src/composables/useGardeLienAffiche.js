import { onBeforeUnmount, onMounted } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { useConfirm } from '@/composables/useConfirm'

/**
 * Tant qu'un lien d'activation est affiché, le quitter se fait EN CONNAISSANCE DE CAUSE
 * (#418, revue de #449 : C1). Ce lien est un secret que rien ne permet de réémettre ;
 * changer d'écran ou recharger la page le détruisait en silence.
 * - recharger ou fermer l'onglet : `beforeunload`, le navigateur demande confirmation ;
 * - naviguer dans l'application : une confirmation qui peut refuser le départ.
 *
 * @param {import('vue').Ref<string>} lien
 * @param {() => Promise<boolean>} [confirmer] injectable pour les tests
 */
export function useGardeLienAffiche(lien, confirmer = demanderConfirmation) {
  function avantDechargement(evenement) {
    if (!lien.value) return
    evenement.preventDefault()
    // Navigateurs plus anciens : la valeur de retour déclenche la confirmation.
    evenement.returnValue = ''
  }

  onMounted(() => window.addEventListener('beforeunload', avantDechargement))
  onBeforeUnmount(() => window.removeEventListener('beforeunload', avantDechargement))
  onBeforeRouteLeave(async () => (lien.value ? confirmer() : true))
}

function demanderConfirmation() {
  return useConfirm().confirm({
    message: "Le lien d'activation affiché n'a pas été marqué transmis. Si vous quittez cet écran, il ne pourra plus être affiché ni réémis.",
    confirmLabel: 'Quitter quand même',
    cancelLabel: 'Rester sur la page',
    variant: 'danger',
  })
}
