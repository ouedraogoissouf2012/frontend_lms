import { computed, ref } from 'vue'
import { cacheKey } from '@/services/cache'
import { emptyConsent, VISIO_CONSENT_KEYS } from '@/constants/visioConsent'

/**
 * Recueil et révocation du consentement visio (#333).
 *
 * État unique partagé (écran d'entrée + profil + bouton d'enregistrement).
 * Persistance locale scopée (cacheKey) en attendant lms_backend#716.
 * Ne lit jamais le mode d'établissement.
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

  function enregistrer(next = choix.value) {
    choix.value = { ...emptyConsent(), ...next }
    repondu.value = true
    persist()
  }

  function revoquer(key) {
    if (!Object.values(VISIO_CONSENT_KEYS).includes(key)) return
    choix.value = { ...choix.value, [key]: false }
    persist()
  }

  function revoquerTout() {
    choix.value = emptyConsent()
    repondu.value = true
    persist()
  }

  const peutRejoindre = computed(() => true)
  const enregistrementAutorise = computed(() => repondu.value === true)

  return {
    choix,
    repondu,
    enregistrer,
    revoquer,
    revoquerTout,
    peutRejoindre,
    enregistrementAutorise,
  }
}
