// #1232, test 2 (run 44393345694) : les participants 41 à 59 sont ENTRÉS en conférence, mais leur ICE n'a jamais été
// « connected » (coturn n'avait que 41 ports de relais, #1260) : aucun média. Le rapport disait « Aucun échec d'entrée ».
// Désormais, un participant entré sans média est un ÉCHEC. Et au plafond de concurrence du compte (20 jobs), un runner
// peut démarrer après T0 : ses participants, partis en retard, sont EXCLUS de la fenêtre qu'ils ont manquée, pas
// comptés en échec, et le retard est dit.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  DELAI_MEDIA_S, RETARD_TOLERE_S, constatMedia, entreeReelleS, participantsExclus, resumerPalier, retardGenerateur,
} from '../../e2e/charge-visio/mesures.mjs'
import { lignesDuRapport } from '../../e2e/charge-visio/rapport.mjs'
import { effectifMax } from '../../e2e/charge-visio/plan.mjs'
import { planDuTag } from '../../e2e/charge-visio/preparer.mjs'
import planTest from '../../e2e/charge-visio/plan-test.json'

// Fenêtres stables : [60, 180), [240, 360), [420, 540).
const PLAN = { salle: 'test-charge-1232', paliers: [5, 10, 20], dureePalierS: 180, navigateursParRunner: 5 }

/** Des échantillons toutes les 5 s, de `depuis` à `jusque` (exclu) ; `extra(t)` les complète. */
const serie = (numero, depuis, jusque, extra = () => ({})) => {
  const s = []
  for (let t = depuis; t < jusque; t += 5) {
    s.push({
      numero, tS: t, entre: true, ice: { etat: 'connected' }, octetsEnvoyes: 0, octetsRecusAudio: 0, octetsRecusVideo: 0,
      perteRecuePct: 0, debitRecuKbps: 100, hauteurVideoRecue: 180, gelsCumules: 0, cpuRunnerPct: 30, ...extra(t),
    })
  }
  return s
}
const recoit = (t) => ({ octetsRecusVideo: t * 1000 })
const bloque = () => ({ ice: { etat: 'checking' } })
const participant = (numero, entreeS, echantillons, extra = {}) => ({
  numero, role: numero === 0 ? 'enseignant' : 'eleve', entreeS, debutS: entreeS, entreeMs: 4000, echecEntree: null, echantillons, ...extra,
})

describe('#1232, test 2 — entré sans média = échec', () => {
  // Élève entré à T+45 (départ 40, 5 s d'entrée) : jugé à T+75.
  const eleve = (echantillons, extra = {}) => ({ numero: 4, role: 'eleve', entreeS: 40, entreeMs: 5000, echantillons, ...extra })
  const e = (tS, extra = {}) => ({ tS, entre: true, ice: { etat: 'connected' }, octetsEnvoyes: 0, octetsRecusAudio: 0, octetsRecusVideo: 0, ...extra })

  it('ICE jamais « connected » ; ou connecté sans un octet reçu en N s ; sinon rien', () => {
    expect(DELAI_MEDIA_S).toBe(30)
    expect(constatMedia(eleve([e(50, bloque()), e(80, { ice: { etat: 'disconnected' } })]))).toBe('ICE jamais connecté')
    expect(constatMedia(eleve([e(50), e(80)]))).toBe('0 octet reçu en 30 s')
    expect(constatMedia(eleve([e(50, { octetsRecusAudio: 900 }), e(80, { octetsRecusAudio: 900 })]))).toBeNull()
    expect(constatMedia(eleve([e(50, { ice: { etat: 'completed' }, octetsRecusVideo: 1 }), e(80)]))).toBeNull()
    expect(constatMedia(eleve([e(50, { ice: { etat: 'completed' } }), e(80, { ice: { etat: 'completed' } })]))).toBe('0 octet reçu en 30 s')
  })

  it('l’enseignant ne reçoit rien (élèves coupés) : on juge ses octets ENVOYÉS', () => {
    const enseignant = (echantillons) => ({ numero: 0, role: 'enseignant', entreeS: 0, entreeMs: 4000, echantillons })
    expect(constatMedia(enseignant([e(10, { octetsEnvoyes: 5000 }), e(40, { octetsEnvoyes: 9000 })]))).toBeNull()
    expect(constatMedia(enseignant([e(10, { octetsRecusAudio: 500 }), e(40, { octetsRecusAudio: 500 })]))).toBe('0 octet envoyé en 30 s')
  })

  it('pas jugé sans le recul de N s (arrêt juste après l’entrée), ni sans entrée (échec d’entrée déjà dit)', () => {
    expect(constatMedia(eleve([e(50, bloque())]))).toBeNull()
    expect(constatMedia(eleve([e(80, bloque())], { entreeMs: null }))).toBeNull()
  })

  it('le palier compte les entrés AVEC média ; l’échec se calcule sur eux', () => {
    const echantillons = [0, 1, 2, 3, 4].flatMap((n) => serie(n, 60, 180))
    expect(resumerPalier(echantillons, PLAN, 0, null, { sansMedia: new Set([3]) }))
      .toMatchObject({ attendus: 5, entres: 5, avecMedia: 4, exclus: 0, tauxEchecEntreePct: 20 })
  })

  it('le rapport : « X (Y avec média) », et la liste des échecs nomme chaque entré sans média — plus jamais « Aucun échec »', () => {
    const runners = [
      { runner: 0, termine: true, demarrageS: -20, participants: [participant(0, 0, serie(0, 5, 180, (t) => ({ octetsEnvoyes: t * 1000 })))] },
      { runner: 1, termine: true, demarrageS: -15, participants: [
        ...[1, 2, 3].map((n) => participant(n, n * 10, serie(n, n * 10 + 5, 180, recoit))),
        participant(4, 40, serie(4, 45, 180, bloque)),
      ] },
    ]
    const lignes = lignesDuRapport(PLAN, runners)
    expect(lignes.find((l) => l.startsWith('| 1 |'))).toMatch(/^\| 1 \| 5 \| 5 \(4 avec média\) \| 20 % \|/)
    expect(lignes.join('\n')).toContain('Échecs d’entrée :\n- participant 4 : entré sans média (ICE jamais connecté)')
    expect(lignes).not.toContain('Aucun échec d’entrée.')
    expect(lignes).toContain('- tous les runners à l’heure (le plus tardif : runner 1 à T-15 s)')
  })
})

describe('#1232 — un runner parti en retard (plafond de concurrence du compte)', () => {
  it('retard du générateur : départ réel au-delà de la tolérance ; sans relevé de départ, aucun retard supposé', () => {
    expect(RETARD_TOLERE_S).toBe(5)
    expect(retardGenerateur({ entreeS: 180, debutS: 252 })).toBe(true)
    expect(retardGenerateur({ entreeS: 180, debutS: 185 })).toBe(false)
    expect(retardGenerateur({ entreeS: 180 })).toBe(false)
    expect(entreeReelleS({ debutS: 252, entreeMs: 4000, echantillons: [] })).toBe(256)
    expect(entreeReelleS({ entreeMs: 4000, echantillons: [{ tS: 30, entre: false }, { tS: 35, entre: true }] })).toBe(35)
    expect(entreeReelleS({ entreeMs: null, echantillons: [] })).toBeNull()
  })

  it('exclu d’une fenêtre : parti en retard ET pas encore entré à son début ; un échec d’entrée reste un échec', () => {
    const ps = [
      { numero: 5, entreeS: 180, debutS: 252, entreeMs: 4000, echecEntree: null, echantillons: [] }, // entré à 256
      { numero: 6, entreeS: 190, debutS: 190, entreeMs: 4000, echecEntree: null, echantillons: [] }, // à l'heure
      { numero: 7, entreeS: 200, debutS: 300, entreeMs: null, echecEntree: 'entrée en salle non confirmée en 60 s', echantillons: [] },
      { numero: 8, entreeS: 210, debutS: 330, entreeMs: null, echecEntree: null, echantillons: [] }, // jamais entré (arrêt)
    ]
    expect(participantsExclus(PLAN, ps, 0)).toEqual(new Set())
    expect(participantsExclus(PLAN, ps, 1)).toEqual(new Set([5, 8]))
    expect(participantsExclus(PLAN, ps, 2)).toEqual(new Set([8]))
  })

  it('le palier retire les exclus de la fenêtre et des attendus mesurés', () => {
    const echantillons = [0, 1, 2, 3, 4].flatMap((n) => serie(n, 60, 180))
    expect(resumerPalier(echantillons, PLAN, 0, null, { sansMedia: new Set([3]), exclus: new Set([4]) }))
      .toMatchObject({ attendus: 5, exclus: 1, entres: 4, avecMedia: 3, tauxEchecEntreePct: 25 })
  })

  it('le rapport dit le runner en retard, les participants exclus, et le palier qui les exclut', () => {
    const runners = [
      { runner: 0, termine: true, demarrageS: -20, participants: [participant(0, 0, serie(0, 5, 360, (t) => ({ octetsEnvoyes: t * 1000 })))] },
      { runner: 1, termine: true, demarrageS: -18, participants: [1, 2, 3, 4].map((n) => participant(n, n * 10, serie(n, n * 10 + 5, 360, recoit))) },
      { runner: 2, termine: true, demarrageS: 250, participants: [participant(5, 180, serie(5, 256, 360, recoit), { debutS: 252 })] },
    ]
    const lignes = lignesDuRapport(PLAN, runners)
    expect(lignes).toContain('- runner 2 démarré à T+250 s (en retard : premier participant prévu à T+180 s)')
    expect(lignes).toContain('- participant 5 : départ à T+252 s au lieu de T+180 s')
    expect(lignes.find((l) => l.startsWith('| 2 |'))).toMatch(/^\| 2 \| 10 \| 5 \(5 avec média, 1 exclu\(s\) : générateur en retard\) \|/)
    expect(lignes.join('\n')).not.toMatch(/participant 5 : entré sans média/)
  })

  it('un relevé ancien (sans heure de départ) se relit sans rien supposer', () => {
    const runners = [{ runner: 0, termine: true, participants: [{ numero: 0, entreeMs: 1, echecEntree: null, echantillons: [] }] }]
    expect(lignesDuRapport(PLAN, runners)).toContain('- départ des runners non relevé')
  })

  it('participant.mjs relève le départ du runner (avant le navigateur) et celui de chaque participant', () => {
    const source = readFileSync(resolve(process.cwd(), 'e2e/charge-visio/participant.mjs'), 'utf-8')
    expect(source).toMatch(/demarrageS: Math\.round\(\(Date\.now\(\) - t0Ms\) \/ 1000\)/)
    expect(source.indexOf('demarrageS:')).toBeLessThan(source.indexOf('chromium.launch'))
    expect(source).toMatch(/trace\.debutS = Math\.round\(\(debut - t0Ms\) \/ 1000\)/)
  })
})

describe('#1232, après #1260 — le plan de test à 100', () => {
  it('tout tag charge-visio-test-N prend plan-test.json, quel que soit N ; le plan va de 20 à 100, scène', () => {
    expect(['charge-visio-test-3', 'charge-visio-test-100'].map(planDuTag)).toEqual(['plan-test.json', 'plan-test.json'])
    expect(effectifMax(planTest)).toBe(100)
    expect(planTest).toMatchObject({ salle: 'test-charge-1232', paliers: [20, 40, 60, 80, 100], dureePalierS: 180, scene: true })
  })
})
