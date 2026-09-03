import { jitsiExternalApiSrc } from '@/constants/visio'

export const JITSI_API_LOAD_FAILED_MESSAGE =
  "Le module de visioconférence n'a pas pu être chargé. Vérifiez votre connexion, puis réessayez."

/**
 * Charge `external_api.js` du serveur Jitsi et rend le constructeur
 * `JitsiMeetExternalAPI` (#673).
 *
 * ## Pourquoi un module dédié
 *
 * C'est la seule opération du parcours qui touche au DOM global et qui n'est
 * pas rejouable : une balise `<script>` posée deux fois recharge 98 Ko pour
 * rien et redéfinit le constructeur en cours d'utilisation. La promesse est
 * donc mémoïsée — tous les appelants partagent le même chargement.
 *
 * ## Pourquoi l'échec n'est pas absorbé
 *
 * Sans ce script, aucune salle ne peut s'ouvrir. Renvoyer un objet dégradé
 * donnerait un écran vide sans motif, en plein cours. On échoue avec un message
 * que l'utilisateur peut agir, et l'appelant compense la participation déjà
 * écrite côté serveur.
 */
let pending = null

/** @returns {Promise<Function>} le constructeur `JitsiMeetExternalAPI` */
export function loadJitsiExternalApi() {
  if (window.JitsiMeetExternalAPI) return Promise.resolve(window.JitsiMeetExternalAPI)
  if (pending) return pending

  pending = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = jitsiExternalApiSrc()
    script.async = true

    script.addEventListener('load', () => {
      if (window.JitsiMeetExternalAPI) {
        resolve(window.JitsiMeetExternalAPI)
        return
      }
      // Script servi mais constructeur absent : serveur Jitsi mal configuré, ou
      // page d'erreur renvoyee avec un code 200. Ne pas laisser passer.
      pending = null
      reject(new Error(JITSI_API_LOAD_FAILED_MESSAGE))
    })

    script.addEventListener('error', () => {
      // Une promesse rejetee memoisee condamnerait toute tentative ulterieure,
      // y compris apres retour du reseau.
      pending = null
      reject(new Error(JITSI_API_LOAD_FAILED_MESSAGE))
    })

    document.head.appendChild(script)
  })

  return pending
}

/** Réservé aux tests : oublie le chargement mémoïsé. */
export function resetJitsiExternalApiCache() {
  pending = null
}
