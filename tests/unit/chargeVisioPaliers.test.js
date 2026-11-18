// #1232, test 1 (run 44291265047, annulé à T+551 s) : le rapport disait « 0 entré, 100 % d'échec d'entrée » pour quatre
// paliers jamais atteints, et son « CPU runner p95 » mêlait les runners : 50 % affiché, quand le runner de l'enseignant,
// seul émetteur, était à 100 %. Puis : l'enseignant seul sur son runner, la hauteur de la vidéo reçue, les gels par
// minute, et le débit reçu lu chez les élèves (l'émetteur ne reçoit rien : p5 à 0 kb/s).
import { describe, expect, it } from 'vitest'
import { NUMERO_ENSEIGNANT, participantsDuRunner, runnersNecessaires, validerPlan } from '../../e2e/charge-visio/plan.mjs'
import { resumerPalier } from '../../e2e/charge-visio/mesures.mjs'
import { finDuReleve, lignesDuRapport } from '../../e2e/charge-visio/rapport.mjs'
import { RUNNERS_MAX } from '../../e2e/charge-visio/preparer.mjs'
import planTest from '../../e2e/charge-visio/plan-test.json'
import planEssai from '../../e2e/charge-visio/plan-essai.json'

// Fenêtres stables : [60, 180), [240, 360), [420, 540).
const PLAN = { salle: 'test-charge-1232', paliers: [5, 10, 20], dureePalierS: 180, navigateursParRunner: 5 }
const e = (numero, tS, extra = {}) => ({
  numero, runner: numero === 0 ? 0 : 1, tS, entre: true, perteRecuePct: 0, debitRecuKbps: 68, hauteurVideoRecue: 180, gelsCumules: 0, cpuRunnerPct: 30, ...extra,
})
const lignesPaliers = (lignes) => lignes.filter((l) => /^\| \d/.test(l))

describe('#1232, test 1 — l’enseignant, seul émetteur, a son runner', () => {
  it('runner 0 : l’enseignant seul ; les élèves ensuite, par groupes, sans trou ni doublon', () => {
    expect(NUMERO_ENSEIGNANT).toBe(0)
    expect(participantsDuRunner(PLAN, 0).map((p) => [p.numero, p.role])).toEqual([[0, 'enseignant']])
    expect(participantsDuRunner(PLAN, 1).map((p) => p.numero)).toEqual([1, 2, 3, 4, 5])
    expect(runnersNecessaires(PLAN)).toBe(5)
    const tous = [...Array(runnersNecessaires(PLAN)).keys()].flatMap((r) => participantsDuRunner(PLAN, r))
    expect(tous.map((p) => p.numero)).toEqual([...Array(20).keys()])
    expect(tous.filter((p) => p.role === 'enseignant').map((p) => p.numero)).toEqual([0])
    expect(runnersNecessaires(planEssai)).toBe(2)
  })
})

describe('#1232, test 1 — le générateur ne doit pas saturer', () => {
  // Test 2 (run 44393345694) : 4 navigateurs recevant le média = p95 de 33 à 50 % d'un runner. Après #1260 (coturn), le
  // plan de test monte à 100 : 6 par runner (p95 attendu vers 70 %), au plafond de concurrence du compte (20 jobs).
  it('100 participants : 6 par runner, 18 runners (1 enseignant + 17), au plafond ; 20 jobs avec le plan et la veille', () => {
    expect(planTest.navigateursParRunner).toBe(6)
    expect(runnersNecessaires(planTest)).toBe(18)
    expect(runnersNecessaires(planTest)).toBeLessThanOrEqual(RUNNERS_MAX)
    expect(runnersNecessaires(planTest) + 2).toBeLessThanOrEqual(20)
  })
})

describe('#1232, test 1 — un palier que l’arrêt a devancé n’est pas un échec d’entrée', () => {
  it('arrêt avant la fenêtre stable : non atteint, aucun chiffre ; pendant : partiel ; après, ou run complet : atteint', () => {
    expect(resumerPalier([], PLAN, 2, 400)).toMatchObject({ atteint: 'non', attendus: 20, entres: null, tauxEchecEntreePct: null, gelsApparus: null })
    expect(resumerPalier([e(1, 430)], PLAN, 2, 500).atteint).toBe('partiel')
    expect(resumerPalier([e(1, 430)], PLAN, 2, 551).atteint).toBe('oui')
    expect(resumerPalier([e(1, 430)], PLAN, 2, null).atteint).toBe('oui')
  })

  it('la fin du relevé : le premier arrêt ; le dernier relevé d’un run tué sans signal ; rien pour un run complet', () => {
    expect(finDuReleve([{ termine: true, participants: [] }])).toBeNull()
    expect(finDuReleve([{ termine: false, arret: { tS: 552 }, participants: [] }, { termine: false, arret: { tS: 551 }, participants: [] }])).toBe(551)
    expect(finDuReleve([{ termine: false, arret: null, participants: [{ echantillons: [{ tS: 5 }, { tS: 140 }] }] }])).toBe(140)
    expect(finDuReleve([])).toBe(0)
  })

  it('le rapport écrit « non atteint (arrêt à T+x s) », jamais 100 % d’échec ; une fenêtre coupée se dit partielle', () => {
    const runners = [{ runner: 0, termine: false, arret: { signal: 'SIGINT', tS: 300 }, participants: [{ numero: 0, entreeMs: 3000, echecEntree: null, echantillons: [e(0, 70), e(0, 250)] }] }]
    const lignes = lignesPaliers(lignesDuRapport(PLAN, runners))
    expect(lignes[1]).toMatch(/^\| 2 \| 10 \| 1 \(1 avec média, fenêtre partielle\) \|/)
    expect(lignes[2]).toBe('| 3 | 20 | non atteint (arrêt à T+300 s) | — | — | — | — | — | — |')
    expect(lignes.join('\n')).not.toMatch(/100 %/)
  })
})

describe('#1232, test 1 — le CPU se lit runner par runner', () => {
  // Palier 3 : l'enseignant seul à 100 % sur le runner 0, 19 élèves à 20 % sur les runners 1 à 4. Mêlés, le p95 dirait 20 %.
  const echantillons = [
    ...Array.from({ length: 10 }, (_, i) => e(0, 420 + i * 5, { cpuRunnerPct: 100 })),
    ...Array.from({ length: 19 }, (_, k) => k + 1).flatMap((n) => Array.from({ length: 10 }, (_, i) => e(n, 420 + i * 5, { runner: 1 + Math.floor((n - 1) / 5), cpuRunnerPct: 20 }))),
  ]

  it('chaque runner a son p95, l’émetteur est dit', () => {
    expect(resumerPalier(echantillons, PLAN, 2).cpuRunners).toEqual([
      { runner: 0, p95: 100, emetteur: true },
      ...[1, 2, 3, 4].map((runner) => ({ runner, p95: 20, emetteur: false })),
    ])
  })

  it('le rapport montre le runner le plus chargé et le signale saturé ; puis le détail par runner', () => {
    const runners = [0, 1, 2, 3, 4].map((runner) => ({
      runner, termine: true, participants: [...new Set(echantillons.filter((x) => x.runner === runner).map((x) => x.numero))]
        .map((numero) => ({ numero, entreeMs: 3000, echecEntree: null, echantillons: echantillons.filter((x) => x.numero === numero) })),
    }))
    const lignes = lignesDuRapport(PLAN, runners)
    expect(lignesPaliers(lignes)[2]).toMatch(/\| 100 % \(runner 0, émetteur\) ⚠ générateur saturé \|$/)
    expect(lignes).toContain('- palier 3 : runner 0 (émetteur) 100 % ⚠, runner 1 20 %, runner 2 20 %, runner 3 20 %, runner 4 20 %')
  })

  it('le runner d’un échantillon vient de la sortie du runner, pas du plan (un relevé ancien se relit juste)', () => {
    const runners = [{ runner: 7, termine: true, participants: [{ numero: 0, entreeMs: 1, echecEntree: null, echantillons: [{ numero: 0, tS: 70, entre: true, cpuRunnerPct: 90 }] }] }]
    expect(lignesDuRapport(PLAN, runners)).toContain('- palier 1 : runner 7 (émetteur) 90 % ⚠')
  })
})

describe('#1232, test 1 — ce que reçoivent les élèves', () => {
  it('perte, débit et hauteur reçus se lisent chez les élèves : l’émetteur, qui ne reçoit rien, n’y entre pas', () => {
    const r = resumerPalier([
      e(0, 70, { debitRecuKbps: 0, perteRecuePct: 50, hauteurVideoRecue: null }),
      e(1, 70), e(2, 70, { hauteurVideoRecue: 360 }), e(3, 70, { hauteurVideoRecue: 360 }),
    ], PLAN, 0)
    expect(r.entres).toBe(4)
    expect(r.debitRecuKbps).toEqual({ mediane: 68, p5: 68 })
    expect(r.perteRecuePct).toEqual({ mediane: 0, p95: 0 })
    expect(r.hauteurVideoRecue).toEqual({ mediane: 360 })
  })

  it('les gels se disent aussi par minute de fenêtre stable', () => {
    const r = resumerPalier([e(1, 60), e(1, 175, { gelsCumules: 14 })], PLAN, 0)
    expect(r.gelsApparus).toBe(14)
    expect(r.gelsParMinute).toBe(7)
  })

  it('le rapport porte la hauteur reçue et les gels par minute', () => {
    const runners = [{ runner: 1, termine: true, participants: [{ numero: 1, entreeMs: 3000, echecEntree: null, echantillons: [e(1, 60), e(1, 175, { gelsCumules: 14 })] }] }]
    const lignes = lignesDuRapport(PLAN, runners)
    expect(lignes).toContain('| Palier | Attendus | Entrés | Échec d’entrée | Perte reçue (médiane / p95) | Débit reçu (médiane / p5) | Hauteur vidéo reçue (médiane) | Gels apparus (par min) | CPU runner p95 (le plus chargé) |')
    expect(lignesPaliers(lignes)[0]).toBe('| 1 | 5 | 1 (1 avec média) | 80 % | 0 % / 0 % | 68 kb/s / 68 kb/s | 180 p | 14 (7/min) | 30 % (runner 1) |')
  })
})

describe('#1232, test 1 — l’option « scène » du plan', () => {
  it('booléenne si présente ; le test la demande, l’essai non', () => {
    expect(() => validerPlan({ ...PLAN, scene: 'oui' })).toThrow(/scene/)
    expect(validerPlan({ ...PLAN, scene: false }).scene).toBe(false)
    expect(validerPlan(planTest).scene).toBe(true)
    expect(planEssai.scene).toBeUndefined()
  })
})
