// Test de capacité de la visio (lms_backend#1232) : le RÉSUMÉ d'un palier, pur et testé.
//
// Chaque participant écrit un échantillon toutes les 5 s : { numero, tS, entre, perteRecuePct, debitRecuKbps,
// hauteurVideoRecue, gelsCumules, imagesDecodeesCumulees, cpuRunnerPct } ; le rapport y ajoute `runner` (celui qui l'a
// écrit). `tS` est en secondes depuis T0. Un palier se juge sur sa fenêtre STABLE (après l'entrée) : qui est entré, ce
// que reçoivent les élèves (perte, débit, hauteur de la vidéo, gels), et le CPU de CHAQUE runner (un générateur saturé
// ne doit pas passer pour une limite du serveur ; test 1 : mêlés, les runners cachaient celui de l'émetteur à 100 %).
//
// Test 2 : 19 participants ENTRÉS en conférence sans jamais de média (coturn à 41 ports, #1260) passaient pour réussis.
// Un participant entré sans média est un ÉCHEC. Et au plafond de concurrence du compte, un runner peut partir après
// T0 : ses participants partis en retard sont EXCLUS des fenêtres qu'ils ont manquées (le générateur, pas le serveur).
import { NUMERO_ENSEIGNANT, fenetreStable } from './plan.mjs'

/** Le recul pour juger le média d'un participant : N s après son entrée réelle. */
export const DELAI_MEDIA_S = 30
/** Au-delà de ce retard au départ (s), le générateur est en retard sur le plan. */
export const RETARD_TOLERE_S = 5
const ICE_ETABLI = new Set(['connected', 'completed'])

/** Le quantile q (0..1) d'une liste de nombres, ou null si elle est vide (rien n'est inventé). */
export function quantile(valeurs, q) {
  const v = valeurs.filter((x) => Number.isFinite(x)).sort((a, b) => a - b)
  if (v.length === 0) return null
  const i = Math.min(v.length - 1, Math.max(0, Math.ceil(q * v.length) - 1))
  return v[i]
}

const parCle = (liste, cle) => {
  const m = new Map()
  for (const x of liste) {
    if (!m.has(x[cle])) m.set(x[cle], [])
    m.get(x[cle]).push(x)
  }
  return m
}

/**
 * L'instant (s depuis T0) où le participant est entré en conférence : son départ réel plus la durée d'entrée ; sans
 * départ relevé (relevé ancien), son départ prévu ; sinon le premier échantillon « entré ». null s'il n'est pas entré.
 */
export function entreeReelleS(p) {
  if (Number.isFinite(p.entreeMs)) {
    if (Number.isFinite(p.debutS)) return p.debutS + p.entreeMs / 1000
    if (Number.isFinite(p.entreeS)) return p.entreeS + p.entreeMs / 1000
  }
  return (p.echantillons ?? []).find((e) => e.entre === true)?.tS ?? null
}

/**
 * Le média d'un participant ENTRÉ : null s'il passe (ou s'il n'est pas jugeable : pas entré, ou relevé arrêté avant
 * N s, ou relevé qui ne porte pas l'état ICE), sinon la raison de l'échec. L'élève doit RECEVOIR des octets ;
 * l'enseignant, qui ne reçoit rien (élèves coupés), doit en ENVOYER.
 */
export function constatMedia(p) {
  const echantillons = p.echantillons ?? []
  if (p.entreeMs == null || !echantillons.some((e) => 'ice' in e)) return null
  const entree = entreeReelleS(p)
  if (entree == null) return null
  const limite = entree + DELAI_MEDIA_S
  const enseignant = p.role === 'enseignant'
  const flux = (e) => (enseignant ? (e.octetsEnvoyes ?? 0) : (e.octetsRecusAudio ?? 0) + (e.octetsRecusVideo ?? 0))
  if (echantillons.some((e) => e.tS <= limite && flux(e) > 0)) return null
  if (!echantillons.some((e) => e.tS >= limite)) return null
  if (!echantillons.some((e) => ICE_ETABLI.has(e.ice?.etat))) return 'ICE jamais connecté'
  return `0 octet ${enseignant ? 'envoyé' : 'reçu'} en ${DELAI_MEDIA_S} s`
}

/** Le participant est-il parti en retard sur le plan (runner démarré tard) ? Sans départ relevé : non. */
export function retardGenerateur(p) {
  return Number.isFinite(p.debutS) && Number.isFinite(p.entreeS) && p.debutS - p.entreeS > RETARD_TOLERE_S
}

/**
 * Les participants EXCLUS de la fenêtre d'un palier : partis en retard (générateur) et pas encore entrés à son début.
 * Un échec d'entrée reste un échec : il n'est pas exclu.
 */
export function participantsExclus(plan, participants, palier) {
  const { debut } = fenetreStable(plan, palier)
  const exclus = new Set()
  for (const p of participants) {
    if (p.numero >= plan.paliers[palier] || p.echecEntree || !retardGenerateur(p)) continue
    const entree = entreeReelleS(p)
    if (entree == null || entree > debut) exclus.add(p.numero)
  }
  return exclus
}

/**
 * Le résumé d'un palier. `finReleveS` : l'instant où le relevé s'arrête (null : run complet). Un palier dont la
 * fenêtre commence après l'arrêt n'est PAS atteint : aucun chiffre, surtout pas « 100 % d'échec » (test 1).
 * @param {object[]} echantillons tous les échantillons de tous les participants
 * @param {{ paliers: number[], dureePalierS: number }} plan
 * @param {number} palier index du palier
 * @param {number|null} [finReleveS]
 * @param {{ sansMedia?: Set<number>, exclus?: Set<number> }} [participants] entrés sans média ; exclus (générateur en retard)
 */
export function resumerPalier(echantillons, plan, palier, finReleveS = null, { sansMedia = new Set(), exclus = new Set() } = {}) {
  const { debut, fin } = fenetreStable(plan, palier)
  const attendus = plan.paliers[palier]
  const atteint = finReleveS == null || finReleveS >= fin ? 'oui' : finReleveS > debut ? 'partiel' : 'non'
  if (atteint === 'non') {
    return {
      palier, attendus, atteint, entres: null, avecMedia: null, exclus: null, tauxEchecEntreePct: null, perteRecuePct: { mediane: null, p95: null }, debitRecuKbps: { mediane: null, p5: null },
      hauteurVideoRecue: { mediane: null }, gelsApparus: null, gelsParMinute: null, cpuRunners: [],
    }
  }
  const nbExclus = [...exclus].filter((n) => n < attendus).length
  const dansFenetre = echantillons.filter((e) => e.tS >= debut && e.tS < fin && e.numero < attendus && !exclus.has(e.numero))
  const entres = new Set(dansFenetre.filter((e) => e.entre === true).map((e) => e.numero))
  const avecMedia = [...entres].filter((n) => !sansMedia.has(n)).length
  const mesures = attendus - nbExclus

  // Les gels APPARUS dans la fenêtre : la différence des compteurs cumulés, par participant.
  let gels = 0
  for (const liste of parCle(dansFenetre, 'numero').values()) {
    const compteurs = liste.map((e) => e.gelsCumules).filter(Number.isFinite)
    if (compteurs.length >= 2) gels += Math.max(0, Math.max(...compteurs) - Math.min(...compteurs))
  }
  const dureeMin = ((atteint === 'partiel' ? finReleveS : fin) - debut) / 60

  // Ce que reçoivent les ÉLÈVES : l'émetteur ne reçoit rien (élèves coupés), il tirerait le débit vers 0.
  const recus = dansFenetre.filter((e) => e.entre === true && e.numero !== NUMERO_ENSEIGNANT)
  const runnerEmetteur = echantillons.find((e) => e.numero === NUMERO_ENSEIGNANT)?.runner
  const cpuRunners = [...parCle(dansFenetre, 'runner')]
    .map(([runner, liste]) => ({ runner, p95: quantile(liste.map((e) => e.cpuRunnerPct), 0.95), emetteur: runner === runnerEmetteur }))
    .filter((r) => r.p95 != null)
    .sort((a, b) => a.runner - b.runner)
  return {
    palier,
    attendus,
    atteint,
    entres: entres.size,
    avecMedia,
    exclus: nbExclus,
    tauxEchecEntreePct: mesures > 0 ? Math.round(((mesures - avecMedia) / mesures) * 1000) / 10 : null,
    perteRecuePct: { mediane: quantile(recus.map((e) => e.perteRecuePct), 0.5), p95: quantile(recus.map((e) => e.perteRecuePct), 0.95) },
    debitRecuKbps: { mediane: quantile(recus.map((e) => e.debitRecuKbps), 0.5), p5: quantile(recus.map((e) => e.debitRecuKbps), 0.05) },
    hauteurVideoRecue: { mediane: quantile(recus.map((e) => e.hauteurVideoRecue), 0.5) },
    gelsApparus: gels,
    gelsParMinute: dureeMin > 0 ? Math.round((gels / dureeMin) * 10) / 10 : null,
    cpuRunners,
  }
}

/** Les échantillons d'un participant en un échantillon par instant : perte et débit tirés des compteurs cumulés. */
export function deltas(precedent, courant, dtS) {
  if (!precedent || !courant || !(dtS > 0)) return { perteRecuePct: null, debitRecuKbps: null }
  const paquets = courant.paquetsRecus - precedent.paquetsRecus
  const perdus = courant.paquetsPerdus - precedent.paquetsPerdus
  const octets = courant.octetsRecus - precedent.octetsRecus
  const total = paquets + perdus
  return {
    perteRecuePct: total > 0 ? Math.round((Math.max(0, perdus) / total) * 1000) / 10 : null,
    debitRecuKbps: octets >= 0 ? Math.round((octets * 8) / dtS / 1000) : null,
  }
}
