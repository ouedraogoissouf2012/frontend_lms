// Test de capacité de la visio (lms_backend#1232) : le RÉSUMÉ d'un palier, pur et testé.
//
// Chaque participant écrit un échantillon toutes les 5 s : { numero, tS, entre, perteRecuePct, debitRecuKbps,
// hauteurVideoRecue, gelsCumules, imagesDecodeesCumulees, cpuRunnerPct } ; le rapport y ajoute `runner` (celui qui l'a
// écrit). `tS` est en secondes depuis T0. Un palier se juge sur sa fenêtre STABLE (après l'entrée) : qui est entré, ce
// que reçoivent les élèves (perte, débit, hauteur de la vidéo, gels), et le CPU de CHAQUE runner (un générateur saturé
// ne doit pas passer pour une limite du serveur ; test 1 : mêlés, les runners cachaient celui de l'émetteur à 100 %).
import { NUMERO_ENSEIGNANT, fenetreStable } from './plan.mjs'

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
 * Le résumé d'un palier. `finReleveS` : l'instant où le relevé s'arrête (null : run complet). Un palier dont la
 * fenêtre commence après l'arrêt n'est PAS atteint : aucun chiffre, surtout pas « 100 % d'échec » (test 1).
 * @param {object[]} echantillons tous les échantillons de tous les participants
 * @param {{ paliers: number[], dureePalierS: number }} plan
 * @param {number} palier index du palier
 * @param {number|null} [finReleveS]
 */
export function resumerPalier(echantillons, plan, palier, finReleveS = null) {
  const { debut, fin } = fenetreStable(plan, palier)
  const attendus = plan.paliers[palier]
  const atteint = finReleveS == null || finReleveS >= fin ? 'oui' : finReleveS > debut ? 'partiel' : 'non'
  if (atteint === 'non') {
    return {
      palier, attendus, atteint, entres: null, tauxEchecEntreePct: null, perteRecuePct: { mediane: null, p95: null }, debitRecuKbps: { mediane: null, p5: null },
      hauteurVideoRecue: { mediane: null }, gelsApparus: null, gelsParMinute: null, cpuRunners: [],
    }
  }
  const dansFenetre = echantillons.filter((e) => e.tS >= debut && e.tS < fin && e.numero < attendus)
  const entres = new Set(dansFenetre.filter((e) => e.entre === true).map((e) => e.numero))

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
    tauxEchecEntreePct: Math.round(((attendus - entres.size) / attendus) * 1000) / 10,
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
