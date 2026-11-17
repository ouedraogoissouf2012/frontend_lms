// Test de capacité de la visio (lms_backend#1232) : le RÉSUMÉ d'un palier, pur et testé.
//
// Chaque participant écrit un échantillon toutes les 5 s : { numero, tS, entre, perteRecuePct, debitRecuKbps,
// gelsCumules, imagesDecodeesCumulees, cpuRunnerPct }. `tS` est en secondes depuis T0. Un palier se juge sur sa
// fenêtre STABLE (après l'entrée) : qui est entré, la perte et le débit reçus, les gels apparus, et le CPU du runner
// (un générateur saturé ne doit pas passer pour une limite du serveur).
import { fenetreStable } from './plan.mjs'

/** Le quantile q (0..1) d'une liste de nombres, ou null si elle est vide (rien n'est inventé). */
export function quantile(valeurs, q) {
  const v = valeurs.filter((x) => Number.isFinite(x)).sort((a, b) => a - b)
  if (v.length === 0) return null
  const i = Math.min(v.length - 1, Math.max(0, Math.ceil(q * v.length) - 1))
  return v[i]
}

/**
 * Le résumé d'un palier.
 * @param {object[]} echantillons tous les échantillons de tous les participants
 * @param {{ paliers: number[], dureePalierS: number }} plan
 * @param {number} palier index du palier
 */
export function resumerPalier(echantillons, plan, palier) {
  const { debut, fin } = fenetreStable(plan, palier)
  const attendus = plan.paliers[palier]
  const dansFenetre = echantillons.filter((e) => e.tS >= debut && e.tS < fin && e.numero < attendus)
  const entres = new Set(dansFenetre.filter((e) => e.entre === true).map((e) => e.numero))

  // Les gels APPARUS dans la fenêtre : la différence des compteurs cumulés, par participant.
  const parParticipant = new Map()
  for (const e of dansFenetre) {
    if (!parParticipant.has(e.numero)) parParticipant.set(e.numero, [])
    parParticipant.get(e.numero).push(e)
  }
  let gels = 0
  for (const liste of parParticipant.values()) {
    const compteurs = liste.map((e) => e.gelsCumules).filter(Number.isFinite)
    if (compteurs.length >= 2) gels += Math.max(0, Math.max(...compteurs) - Math.min(...compteurs))
  }

  const mesures = dansFenetre.filter((e) => e.entre === true)
  return {
    palier,
    attendus,
    entres: entres.size,
    tauxEchecEntreePct: Math.round(((attendus - entres.size) / attendus) * 1000) / 10,
    perteRecuePct: { mediane: quantile(mesures.map((e) => e.perteRecuePct), 0.5), p95: quantile(mesures.map((e) => e.perteRecuePct), 0.95) },
    debitRecuKbps: { mediane: quantile(mesures.map((e) => e.debitRecuKbps), 0.5), p5: quantile(mesures.map((e) => e.debitRecuKbps), 0.05) },
    gelsApparus: gels,
    cpuRunnerPct: { p95: quantile(dansFenetre.map((e) => e.cpuRunnerPct), 0.95) },
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
