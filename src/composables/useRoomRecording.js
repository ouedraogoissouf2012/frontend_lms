import { computed, ref } from 'vue'
import { useVisioConsent } from '@/composables/useVisioConsent'
import {
  confirmVisioAction,
  notifyVisioError,
  notifyVisioWarning,
} from '@/services/visioFeedback'

const CONSENTEMENT_REQUIS = 'Le consentement à la captation doit être recueilli avant tout enregistrement.'
const ECHEC = "L'ordre d'enregistrement n'a pas atteint la salle."

/**
 * #673 — commander l'enregistrement DEPUIS la salle.
 *
 * ## Le dernier morceau du parcours
 *
 * Le critère de fermeture de #673 est : « un enseignant presse **le seul
 * bouton du LMS**, parle une minute, arrête — et le cours apparaît en chapitre
 * vidéo dans sa leçon, sans aucune autre action ».
 *
 * Deux obstacles l'empêchaient, tous deux mesurés :
 *
 *  · les boutons du LMS vivent sur la page de détail de séance, que la salle
 *    **recouvre** (`position: fixed; inset: 0; z-index: 9997`) ;
 *  · le bouton natif de Jitsi n'est pas dans la barre — dans le bundle
 *    déployé, `recording` est en 16e position d'une barre coupée à 8 boutons
 *    à toute largeur d'écran. Il tombe dans le menu « … ».
 *
 * L'enseignant devait donc deviner un menu, ou quitter la salle.
 *
 * ## L'autorité est passée, jamais résolue ici
 *
 * `canManageRecording` vient du serveur, via la configuration de salle. Le
 * backend calcule déjà cette autorité pour décider du statut de modérateur
 * dans le jeton : une seule source, donc aucune divergence possible entre ce
 * que l'interface propose et ce que la salle accepte.
 *
 * Ce garde n'est pas cosmétique : `VisioRoom` est monté à la **racine, pour
 * tous les participants**. Sans lui, chaque élève verrait le bouton.
 *
 * ## L'ordre part vers la SALLE, jamais vers la base
 *
 * C'est l'invariant central de #673. Un appel backend direct écrirait une
 * ligne « enregistrement en cours » sans que Jibri en sache quoi que ce soit.
 * C'est le miroir qui persiste, sur confirmation du fournisseur.
 *
 * @param {{
 *   isRecording: import('vue').Ref<boolean>,
 *   startRecording: () => Promise<unknown>,
 *   stopRecording: () => Promise<unknown>,
 *   canManageRecording: () => boolean,
 * }} salle
 */
export function useRoomRecording({ isRecording, startRecording, stopRecording, canManageRecording }) {
  const enCours = ref(false)

  const peutCommander = computed(() => canManageRecording() === true)
  const enregistre = computed(() => isRecording.value === true)
  const libelle = computed(() =>
    enregistre.value ? "Arrêter l'enregistrement" : "Enregistrer le cours"
  )

  /**
   * Le consentement ne conditionne QUE le démarrage.
   *
   * Refuser d'arrêter une captation au motif qu'on n'aurait plus le droit de
   * la commencer laisserait tourner exactement ce qu'on cherche à interrompre.
   */
  function autoriseLeDemarrage() {
    if (useVisioConsent().enregistrementAutorise.value) return true

    notifyVisioWarning(CONSENTEMENT_REQUIS)

    return false
  }

  async function basculer() {
    if (enCours.value || !peutCommander.value) return
    if (!enregistre.value && !autoriseLeDemarrage()) return

    const arret = enregistre.value

    // Le verrou se pose AVANT la confirmation, pas apres. Pose ensuite, deux
    // clics rapides franchissaient tous deux le garde pendant que la premiere
    // boite de dialogue etait encore ouverte, et deux ordres partaient vers la
    // salle. Mesure par le test « un double clic ne lance pas deux
    // enregistrements », qui rougissait sur cette version.
    enCours.value = true
    try {
      const confirme = await confirmVisioAction(
        arret ? "Arrêter l'enregistrement de cette séance ?" : "Démarrer l'enregistrement de cette séance ?",
        { confirmLabel: arret ? 'Arrêter' : 'Démarrer' }
      )
      if (!confirme) return

      await (arret ? stopRecording() : startRecording())
    } catch (error) {
      // Ce code s'execute depuis un gestionnaire d'evenement d'interface : une
      // exception qui remonte casserait la salle en plein cours.
      console.error('[RoomRecording] Ordre non transmis:', error)
      notifyVisioError(ECHEC)
    } finally {
      enCours.value = false
    }
  }

  return { peutCommander, enregistre, libelle, enCours, basculer }
}

export { CONSENTEMENT_REQUIS, ECHEC }
