import { ref } from 'vue'
import lmsService from '@/services/lms'

/**
 * Reflète dans le LMS l'état d'enregistrement OBSERVÉ chez le fournisseur (#673).
 *
 * ## La cause racine
 *
 * Le LMS et Jitsi tenaient deux vérités séparées sur le même enregistrement, et
 * le seul pont entre elles — le webhook de fin — exigeait que la vérité LMS ait
 * déjà été écrite par un canal totalement différent : un clic sur un bouton du
 * LMS. Deux défauts symétriques en découlaient, tous deux constatés en
 * production :
 *
 *  · **bouton du LMS** — la ligne était créée sans que Jibri soit prévenu :
 *    l'écran affirmait « enregistrement en cours » pendant que Jibri restait
 *    `IDLE` (`seance_recordings#1`, 2026-09-02) ;
 *  · **bouton natif de Jitsi** — Jibri enregistrait sans qu'aucune ligne
 *    existe : le webhook de fin était refusé en 404 et la vidéo abandonnée
 *    (`finalize.log`, 2026-08-31, fichier toujours sur le disque).
 *
 * ## Le principe
 *
 * Ce miroir ne persiste QUE ce qu'il constate, **quel que soit le déclencheur**.
 * La ligne en base cesse d'être le reflet d'une intention pour devenir celui
 * d'un fait. La divergence entre les deux vérités devient structurellement
 * impossible, au lieu d'être rattrapée au cas par cas.
 *
 * Le bouton du LMS n'est plus qu'un déclencheur de confort : c'est le
 * fournisseur qui fait autorité.
 *
 * @param {{ getSeanceId: () => (number|string|null), service?: object }} options
 */
export function useVisioRecordingMirror({ getSeanceId, service = lmsService }) {
  /**
   * Dernier état RÉELLEMENT persisté. `null` tant que rien ne l'a été.
   *
   * Il n'est posé qu'après un aller-retour réussi : mémoriser un échec
   * empêcherait tout rattrapage et laisserait la vidéo finir en 404 — le défaut
   * même que ce miroir corrige.
   */
  const mirroredOn = ref(null)

  /**
   * @param {{on?: boolean}|null|undefined} payload charge de `recordingStatusChanged`
   */
  async function onProviderStatus(payload) {
    const on = payload?.on
    if (typeof on !== 'boolean') return

    const seanceId = getSeanceId()
    if (!seanceId) return

    // Jitsi republie l'état à chaque arrivée de participant : sans cette
    // comparaison, une salle de trente étudiants martèlerait le backend.
    if (mirroredOn.value === on) return

    // Un arrêt jamais précédé d'un démarrage observé ne ferme rien : c'est
    // l'état émis à l'entrée en salle quand aucun enregistrement ne tourne.
    if (!on && mirroredOn.value === null) {
      mirroredOn.value = false
      return
    }

    try {
      await (on ? service.startVisioRecording(seanceId) : service.stopVisioRecording(seanceId))
      mirroredOn.value = on
    } catch (error) {
      // Ce code s'exécute DANS un gestionnaire d'événement Jitsi : une
      // exception qui remonte casserait la salle en plein cours, pour un défaut
      // de journalisation. On trace, on ne propage pas — et on ne mémorise pas,
      // pour que l'événement suivant retente.
      console.error('[VisioRecordingMirror] Reflet de l\'état d\'enregistrement impossible:', error)
    }
  }

  function reset() {
    mirroredOn.value = null
  }

  return { mirroredOn, onProviderStatus, reset }
}
