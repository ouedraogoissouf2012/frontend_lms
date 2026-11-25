import { ref } from 'vue'
import { enrolmentCodesService } from '@/services/enrolmentCodes'
import { invalidResponseError } from '@/services/errorHandler'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

/**
 * Capacité d'une classe LOCALE (#631, lms_backend#1358) : la limite que l'inscription par code
 * respecte (#620, `class_full`). `GET /classes` la rend dans `effectif` : un entier, ou `null` sans
 * limite (jamais 0). Le geste `PUT /classes/{id}/capacite` exige `effectif`, nul compris.
 *
 * L'écran dit ce que le SERVEUR a enregistré : après le PUT, c'est `data.effectif` relu qui est rendu,
 * jamais la saisie (0 revient `null`). Aucun avertissement sur l'effectif inscrit : la liste ne le porte
 * pas, et l'inventer serait une donnée fabriquée.
 */

/** La borne du back (`CapaciteDeClasse::MAXIMUM`), la même à la création et à la modification. */
export const CAPACITE_MAX = 10000

/**
 * Saisie → valeur à envoyer : vide → `null` (sans limite) ; entier de 0 à 10 000 → ce nombre ;
 * tout le reste (signe, décimale, exposant, unité) → `undefined`, refusé SANS appel réseau.
 */
export function lireSaisieCapacite(saisie) {
  const texte = String(saisie ?? '').trim()
  if (texte === '') return null
  if (!/^\d{1,5}$/.test(texte)) return undefined
  const n = Number(texte)
  return n <= CAPACITE_MAX ? n : undefined
}

const estCapacite = (v) => v === null || (Number.isInteger(v) && v >= 0)

/** Libellé de la capacité portée par la classe ; une clé absente n'est pas « sans limite ». */
export function libelleCapacite(classe) {
  if (!classe || !Object.hasOwn(classe, 'effectif') || !estCapacite(classe.effectif)) return 'Capacité : non communiquée'
  const n = classe.effectif
  if (n === null || n === 0) return 'Capacité : sans limite'
  return `Capacité : ${n} ${n === 1 ? 'élève' : 'élèves'}`
}

/**
 * @param {() => object} classe - lecture de la classe courante (forme de `GET /classes`)
 * @param {(effectif: number|null) => void} onRegle - reçoit la capacité RELUE du serveur
 */
export function useClasseCapacite(classe, onRegle) {
  const ouvert = ref(false)
  const saisie = ref('')
  const erreur = ref('')
  const invalide = ref(false)
  const occupe = ref(false)
  // Le PUT a pu aboutir sans que l'écran le sache : la capacité affichée n'est plus sûre.
  const incertaine = ref(false)

  function ouvrir() {
    const effectif = classe()?.effectif
    saisie.value = Number.isInteger(effectif) && effectif > 0 ? String(effectif) : ''
    erreur.value = ''
    invalide.value = false
    ouvert.value = true
  }

  function annuler() {
    ouvert.value = false
    erreur.value = ''
    invalide.value = false
  }

  async function enregistrer() {
    if (occupe.value) return false
    const effectif = lireSaisieCapacite(saisie.value)
    if (effectif === undefined) {
      erreur.value = ERROR_MESSAGES.capaciteIllisible
      invalide.value = true
      return false
    }
    occupe.value = true
    erreur.value = ''
    invalide.value = false
    try {
      const response = await enrolmentCodesService.reglerCapacite(classe().id, effectif)
      const relue = response.data?.effectif
      if (!estCapacite(relue)) throw invalidResponseError('PUT capacité sans effectif relisible', response)
      incertaine.value = false
      ouvert.value = false
      onRegle(relue)
      return true
    } catch (err) {
      erreur.value = err?.userMessage || ERROR_MESSAGES.unknown
      // Un refus NET (4xx) n'a rien changé. Sans statut (délai, réseau, succès illisible) ou en 5xx,
      // le serveur a pu enregistrer : la capacité affichée devient incertaine.
      const status = err?.response?.status
      if (status == null || status >= 500) incertaine.value = true
      return false
    } finally {
      occupe.value = false
    }
  }

  return { ouvert, saisie, erreur, invalide, occupe, incertaine, ouvrir, annuler, enregistrer }
}
