/**
 * lms_backend#1232 : l'outil du test de capacité de la visio. Ses parties PURES : le plan (qui entre, quand, où), le
 * résumé d'un palier, la décision d'arrêt de la veille, la préparation du run et le rapport. Le navigateur et la prod
 * n'y entrent pas : l'essai à blanc mesure la chaîne réelle.
 */
import { describe, it, expect } from 'vitest'
import {
  validerPlan, runnersNecessaires, finS, palierDe, entreeS, participantsDuRunner, fenetreStable, adresseEntree, ENTREE_S,
} from '../../e2e/charge-visio/plan.mjs'
import { quantile, resumerPalier, deltas } from '../../e2e/charge-visio/mesures.mjs'
import { decision } from '../../e2e/charge-visio/veille.mjs'
import { planDuTag, sorties, MARGE_DEPART_S } from '../../e2e/charge-visio/preparer.mjs'
import { lignesDuRapport, cheminsMedia } from '../../e2e/charge-visio/rapport.mjs'
import planTest from '../../e2e/charge-visio/plan-test.json'
import planEssai from '../../e2e/charge-visio/plan-essai.json'

const PLAN = { salle: 'test-charge-1232', paliers: [5, 10, 20], dureePalierS: 180, navigateursParRunner: 5 }

describe('#1232 — le plan', () => {
  it('refuse toute salle qui n’est pas une salle de test (aucune séance réelle ne reçoit la charge)', () => {
    expect(() => validerPlan({ ...PLAN, salle: 'seance-42' })).toThrow(/salle refusée/)
    expect(() => validerPlan({ ...PLAN, salle: 'TEST-CHARGE-1232' })).toThrow(/salle refusée/)
    expect(validerPlan(PLAN)).toBe(PLAN)
  })

  it('refuse des paliers vides, non croissants, une durée trop courte, trop de navigateurs par runner', () => {
    expect(() => validerPlan({ ...PLAN, paliers: [] })).toThrow()
    expect(() => validerPlan({ ...PLAN, paliers: [10, 5] })).toThrow(/non croissants/)
    expect(() => validerPlan({ ...PLAN, dureePalierS: ENTREE_S })).toThrow(/trop courte/)
    expect(() => validerPlan({ ...PLAN, navigateursParRunner: 9 })).toThrow(/hors bornes/)
  })

  it('les deux plans livrés sont valides : l’essai (3, une salle à part) et le test (5 → 60)', () => {
    expect(validerPlan(planEssai).salle).toBe('test-charge-1232-essai')
    expect(validerPlan(planTest).paliers).toEqual([5, 10, 20, 30, 40, 50, 60])
    expect(runnersNecessaires(planTest)).toBe(12)
    expect(finS(planTest)).toBe(7 * 180)
  })

  it('chaque participant entre au palier qui le compte, étalé sur la minute d’entrée, et reste ensuite', () => {
    expect([0, 4, 5, 9, 10, 19].map((n) => palierDe(PLAN, n))).toEqual([0, 0, 1, 1, 2, 2])
    expect(entreeS(PLAN, 0)).toBe(0)
    expect(entreeS(PLAN, 5)).toBe(180)
    for (let n = 0; n < 20; n += 1) {
      const p = palierDe(PLAN, n)
      expect(entreeS(PLAN, n)).toBeGreaterThanOrEqual(p * 180)
      expect(entreeS(PLAN, n)).toBeLessThan(p * 180 + ENTREE_S)
    }
  })

  it('les runners se partagent les participants sans trou ni doublon ; le participant 0 est l’enseignant', () => {
    const tous = [0, 1, 2, 3].flatMap((r) => participantsDuRunner(PLAN, r))
    expect(tous.map((p) => p.numero)).toEqual([...Array(20).keys()])
    expect(tous.filter((p) => p.role === 'enseignant').map((p) => p.numero)).toEqual([0])
  })

  it('la fenêtre mesurée d’un palier commence après sa minute d’entrée', () => {
    expect(fenetreStable(PLAN, 1)).toEqual({ debut: 180 + ENTREE_S, fin: 360 })
  })

  it('l’adresse : le jeton, la salle, sans pair à pair ni page d’attente ; l’élève entre coupé, l’enseignant non', () => {
    const eleve = adresseEntree('visio.example.test', 'test-charge-1232', 'a.b.c', 'eleve')
    expect(eleve.startsWith('https://visio.example.test/test-charge-1232?jwt=a.b.c#')).toBe(true)
    expect(eleve).toContain('config.p2p.enabled=false')
    expect(eleve).toContain('config.prejoinConfig.enabled=false')
    expect(eleve).toContain('config.startWithVideoMuted=true')
    expect(adresseEntree('visio.example.test', 'test-charge-1232', 'a.b.c', 'enseignant')).toContain('config.startWithVideoMuted=false')
  })
})

describe('#1232 — les mesures d’un palier', () => {
  it('quantile : rien d’inventé sur une liste vide', () => {
    expect(quantile([], 0.5)).toBeNull()
    expect(quantile([3, 1, 2], 0.5)).toBe(2)
    expect(quantile([1, 2, 3, 4, 100], 0.95)).toBe(100)
  })

  it('deltas : la perte et le débit reçus entre deux relevés cumulés', () => {
    expect(deltas({ paquetsRecus: 100, paquetsPerdus: 0, octetsRecus: 0 }, { paquetsRecus: 190, paquetsPerdus: 10, octetsRecus: 62_500 }, 5))
      .toEqual({ perteRecuePct: 10, debitRecuKbps: 100 })
    expect(deltas(null, { paquetsRecus: 1 }, 5)).toEqual({ perteRecuePct: null, debitRecuKbps: null })
  })

  it('un palier : les entrés de sa fenêtre stable, le taux d’échec, les gels APPARUS dans la fenêtre', () => {
    const e = (numero, tS, extra = {}) => ({ numero, tS, entre: true, perteRecuePct: 1, debitRecuKbps: 500, gelsCumules: 0, cpuRunnerPct: 40, ...extra })
    const echantillons = [
      ...[0, 1, 2, 3].map((n) => e(n, 70)),
      e(0, 120, { gelsCumules: 2 }),
      e(4, 70, { entre: false }),
      e(1, 10), // hors fenêtre (minute d'entrée)
    ]
    const r = resumerPalier(echantillons, PLAN, 0)
    expect(r.attendus).toBe(5)
    expect(r.entres).toBe(4)
    expect(r.tauxEchecEntreePct).toBe(20)
    expect(r.gelsApparus).toBe(2)
    expect(r.perteRecuePct.mediane).toBe(1)
  })
})

describe('#1232 — la veille arrête le test si un service se dégrade', () => {
  const ok = (latenceMs) => ({ ok: true, latenceMs })
  const ko = { ok: false, latenceMs: null }

  it('2 échecs de suite : arrêt', () => {
    expect(decision([ok(100), ko, ko]).arreter).toBe(true)
    expect(decision([ok(100), ko, ok(100)]).arreter).toBe(false)
  })

  it('2 latences de suite au-delà de 3 fois la référence (médiane des 3 premières) : arrêt', () => {
    expect(decision([ok(100), ok(120), ok(110), ok(400), ok(350)])).toMatchObject({ arreter: true, referenceMs: 110 })
    expect(decision([ok(100), ok(120), ok(110), ok(400), ok(200)]).arreter).toBe(false)
  })

  it('sans référence établie, une latence seule n’arrête rien (les échecs, si)', () => {
    expect(decision([ok(100), ok(5000)]).arreter).toBe(false)
  })
})

describe('#1232 — la préparation du run', () => {
  it('le tag choisit le plan ; tout autre tag est refusé', () => {
    expect(planDuTag('charge-visio-essai-1')).toBe('plan-essai.json')
    expect(planDuTag('charge-visio-test-1')).toBe('plan-test.json')
    expect(() => planDuTag('v1.0.0')).toThrow(/tag inconnu/)
  })

  it('les sorties : la matrice des runners, T0 après la marge de départ, la fin', () => {
    expect(sorties(planTest, 1000)).toEqual({ runners: JSON.stringify([...Array(12).keys()]), t0: String(1000 + MARGE_DEPART_S), fin: String(1000 + MARGE_DEPART_S + 1260) })
  })
})

describe('#1232 — le rapport', () => {
  it('une ligne par palier ; un runner saturé est signalé, ses chiffres ne disent pas la limite du serveur', () => {
    const runners = [{ runner: 0, t0: '2026-11-17T21:00:00.000Z', participants: [{ numero: 0, entreeMs: 3000, echecEntree: null, echantillons: [{ numero: 0, tS: 70, entre: true, perteRecuePct: 0, debitRecuKbps: 300, gelsCumules: 0, cpuRunnerPct: 92 }] }] }]
    const lignes = lignesDuRapport(PLAN, runners)
    expect(lignes.filter((l) => /^\| \d/.test(l))).toHaveLength(3)
    expect(lignes.join('\n')).toContain('générateur saturé')
    expect(lignes.join('\n')).toContain('Aucun échec d’entrée.')
  })
})

describe('#1232 — le chemin du média (essai 1 : débit reçu 0, sans savoir pourquoi)', () => {
  it('par participant : l’état ICE, la paire retenue et les octets envoyés du DERNIER relevé qui les porte', () => {
    const runners = [{ runner: 0, participants: [
      { numero: 1, role: 'eleve', echantillons: [{ ice: null }] },
      { numero: 0, role: 'enseignant', echantillons: [
        { ice: { etat: 'checking', connexion: 'connecting', candidatLocal: null, candidatDistant: null }, octetsEnvoyes: 0 },
        { ice: { etat: 'connected', connexion: 'connected', candidatLocal: 'srflx/udp', candidatDistant: 'host/udp:10000' }, octetsEnvoyes: 52000 },
      ] },
    ] }]
    expect(cheminsMedia(runners)).toEqual([
      '- participant 0 (enseignant) : ICE connected, connexion connected, paire srflx/udp → host/udp:10000, octets envoyés 52000',
      '- participant 1 (eleve) : ICE —, connexion —, paire — → —, octets envoyés —',
    ])
  })
})
