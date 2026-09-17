import { computed, ref } from 'vue'
import { cacheKey } from '@/services/cache'
import lmsService from '@/services/lms'
import { emptyConsent, VISIO_CONSENT_KEYS } from '@/constants/visioConsent'

/**
 * Recueil et révocation du consentement visio (#333), persisté côté SERVEUR (#716).
 *
 * État unique partagé (écran d'entrée + profil + bouton d'enregistrement).
 *
 * ## Le serveur fait autorité, `localStorage` n'est plus qu'un cache
 *
 * Ce composable rangeait le choix uniquement dans `localStorage`, et l'annonçait
 * comme provisoire : « en attendant lms_backend#716 ». Ce backend existe depuis
 * le 2026-09-06 — table `consents`, garde append-only — mais le raccord n'avait
 * jamais été fait.
 *
 * Conséquence, jusqu'à ce lot : le serveur n'avait aucune ligne de consentement,
 * et **refusait donc tout enregistrement en 422**. Jibri enregistrait pour de
 * vrai, puis le webhook de fin ne trouvait aucune ligne active et rendait 404 :
 * la vidéo finissait orpheline sur le disque.
 *
 * Un choix gardé dans le navigateur se perd au changement de poste et ne prouve
 * rien en cas de contrôle. Il reste néanmoins écrit en local, comme cache : une
 * panne réseau ne doit pas faire oublier à l'utilisateur ce qu'il a décidé.
 *
 * ## L'état reste synchrone, délibérément
 *
 * L'écran ne doit pas attendre le réseau pour cocher une case. L'état est donc
 * mis à jour d'abord, l'envoi part ensuite. Un échec d'envoi ne casse ni l'écran
 * ni la salle en cours — il est journalisé, et le cache local prend le relais.
 *
 * Vérifié par `__tests__/useVisioConsentServeur.test.js`.
 */

const PREFERENCE = 'visio_consent'
const choix = ref(emptyConsent())
const repondu = ref(false)
let charge = false

function cle() {
  return cacheKey(PREFERENCE)
}

function lireStockage() {
  try {
    const raw = localStorage.getItem(cle())
    if (!raw) return { choix: emptyConsent(), repondu: false }
    const parsed = JSON.parse(raw)
    return {
      choix: { ...emptyConsent(), ...(parsed.choix || {}) },
      repondu: parsed.repondu === true,
    }
  } catch {
    return { choix: emptyConsent(), repondu: false }
  }
}

function ecrireStockage() {
  try {
    localStorage.setItem(cle(), JSON.stringify({
      choix: choix.value,
      repondu: repondu.value,
    }))
  } catch {
    /* navigation privée / quota : le choix vaut pour la session */
  }
}

function charger() {
  if (charge) return
  const initial = lireStockage()
  choix.value = initial.choix
  repondu.value = initial.repondu
  charge = true
}

export function resetVisioConsentForTests() {
  choix.value = emptyConsent()
  repondu.value = false
  charge = true
  try {
    localStorage.removeItem(cle())
  } catch {
    /* jsdom sans storage */
  }
}

export function useVisioConsent() {
  charger()

  function persist() {
    ecrireStockage()
  }

  /**
   * Envoie l'état COMPLET au serveur.
   *
   * Les trois finalités repartent ensemble : `StoreVisioConsentRequest` les
   * exige toutes, un consentement partiellement renseigné n'ayant pas de sens.
   *
   * L'échec n'est jamais propagé — ce code s'exécute depuis des gestionnaires
   * d'événement d'interface, et une exception qui remonte casserait l'écran
   * pour un défaut de réseau.
   */
  async function deposer() {
    try {
      await lmsService.saveVisioConsent({ ...choix.value })
    } catch (error) {
      console.error('Consentement visio non depose sur le serveur:', error)
    }
  }

  /**
   * Relit l'état depuis le serveur, qui fait autorité.
   *
   * Sur echec, le cache local reste en place : mieux vaut un choix connu et
   * peut-être ancien qu'un écran qui redemande tout à chaque coupure.
   */
  async function rafraichirDepuisServeur() {
    try {
      const reponse = await lmsService.getVisioConsent()
      const distant = reponse?.data
      if (!distant) return

      choix.value = { ...emptyConsent(), ...distant }
      repondu.value = true
      persist()
    } catch (error) {
      console.error('Consentement visio illisible sur le serveur:', error)
    }
  }

  async function enregistrer(next = choix.value) {
    choix.value = { ...emptyConsent(), ...next }
    repondu.value = true
    persist()

    await deposer()
  }

  async function revoquer(key) {
    if (!Object.values(VISIO_CONSENT_KEYS).includes(key)) return
    choix.value = { ...choix.value, [key]: false }
    persist()

    await deposer()
  }

  async function revoquerTout() {
    choix.value = emptyConsent()
    repondu.value = true
    persist()

    await deposer()
  }

  const peutRejoindre = computed(() => true)
  /**
   * Le droit d'enregistrer, aligné sur le backend (#673).
   *
   * Ce garde lisait `repondu === true` — « l'utilisateur a RÉPONDU » — là où
   * `RecordingConsentGuard` exige la dernière ligne `Capture` avec
   * `granted === true`, c'est-à-dire « l'utilisateur a ACCEPTÉ ».
   *
   * L'écart n'était pas théorique. Un enseignant ayant refusé la captation
   * franchissait ce garde, lançait Jibri POUR DE VRAI, puis recevait 422 : le
   * webhook de fin ne trouvait aucune ligne et abandonnait la vidéo sur le
   * disque. Le refus produisait donc la captation même qu'il refusait, hors de
   * toute rétention et de toute demande d'effacement.
   *
   * Seule la captation compte ici : la diffusion et la réutilisation portent
   * sur ce qu'on fait du fichier APRÈS, pas sur le droit de le produire.
   */
  const enregistrementAutorise = computed(() => choix.value.captation === true)

  return {
    choix,
    repondu,
    enregistrer,
    revoquer,
    revoquerTout,
    rafraichirDepuisServeur,
    peutRejoindre,
    enregistrementAutorise,
  }
}
