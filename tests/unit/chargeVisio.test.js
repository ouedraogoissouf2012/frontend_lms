/**
 * lms_backend#1232 : l'outil du test de capacité de la visio. Ses parties PURES : le plan (qui entre, quand, où), le
 * résumé d'un palier, la décision d'arrêt de la veille, la préparation du run et le rapport. Le navigateur et la prod
 * n'y entrent pas : l'essai à blanc mesure la chaîne réelle.
 */
import { describe, it, expect } from 'vitest'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import {
  validerPlan, runnersNecessaires, finS, palierDe, entreeS, participantsDuRunner, fenetreStable, adresseEntree, ENTREE_S,
} from '../../e2e/charge-visio/plan.mjs'
import { quantile, resumerPalier, deltas } from '../../e2e/charge-visio/mesures.mjs'
import { decision } from '../../e2e/charge-visio/veille.mjs'
import { planDuTag, sorties, MARGE_DEPART_S } from '../../e2e/charge-visio/preparer.mjs'
import { lignesDuRapport, cheminsMedia, etatDuReleve, lireRunners } from '../../e2e/charge-visio/rapport.mjs'
import { masquer, noterConsole, diagnosticsCapture, MESSAGES_MAX, LONGUEUR_MAX } from '../../e2e/charge-visio/capture.mjs'
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
    expect(runnersNecessaires(planTest)).toBe(13)
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
    const tous = [0, 1, 2, 3, 4].flatMap((r) => participantsDuRunner(PLAN, r))
    expect(tous.map((p) => p.numero)).toEqual([...Array(20).keys()])
    expect(tous.filter((p) => p.role === 'enseignant').map((p) => p.numero)).toEqual([0])
  })

  it('la fenêtre mesurée d’un palier commence après sa minute d’entrée', () => {
    expect(fenetreStable(PLAN, 1)).toEqual({ debut: 180 + ENTREE_S, fin: 360 })
  })

  it('l’adresse : le jeton, la salle, sans pair à pair ; l’élève entre coupé, l’enseignant non', () => {
    const eleve = adresseEntree('visio.example.test', 'test-charge-1232', 'a.b.c', 'eleve')
    expect(eleve.startsWith('https://visio.example.test/test-charge-1232?jwt=a.b.c#')).toBe(true)
    expect(eleve).toContain('config.p2p.enabled=false')
    expect(eleve).toContain('config.startWithVideoMuted=true')
    expect(adresseEntree('visio.example.test', 'test-charge-1232', 'a.b.c', 'enseignant')).toContain('config.startWithVideoMuted=false')
  })

  it('l’adresse ne surcharge PAS la page d’accueil (essai 4 : par l’URL, Jitsi la lit comme « démarrer sans média »)', () => {
    for (const role of ['eleve', 'enseignant']) {
      const adresse = adresseEntree('visio.example.test', 'test-charge-1232', 'a.b.c', role)
      expect(adresse).not.toMatch(/prejoin/i)
      expect(adresse).not.toMatch(/disableInitialGUM/)
    }
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
    expect(sorties(planTest, 1000)).toEqual({ runners: JSON.stringify([...Array(13).keys()]), t0: String(1000 + MARGE_DEPART_S), fin: String(1000 + MARGE_DEPART_S + 1260) })
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
        { ice: { etat: 'connected', connexion: 'connected', candidatLocal: 'srflx/udp', candidatDistant: 'host/udp:10000' }, octetsEnvoyes: 52000,
          pistesLocales: [{ type: 'audio', muette: false }, { type: 'video', muette: true }], pistesDistantes: 0,
          octetsRecusAudio: 41000, octetsRecusVideo: 0, connexions: [{ p2p: false, ice: 'connected' }] },
      ] },
    ] }]
    expect(cheminsMedia(runners)).toEqual([
      '- participant 0 (enseignant) : ICE connected, connexion connected, paire srflx/udp → host/udp:10000, octets envoyés 52000 ; pistes publiées audio, video (muette) ; pistes reçues 0 ; octets reçus audio 41000, vidéo 0 ; connexions jvb connected',
      '- participant 1 (eleve) : ICE —, connexion —, paire — → —, octets envoyés — ; pistes publiées — ; pistes reçues — ; octets reçus audio —, vidéo — ; connexions —',
    ])
  })
})

describe('#1232 — l’annulation (essai 2 : aucun relevé écrit, le runner a tué le script sans signal)', () => {
  it('le script des participants EST le processus de l’étape (exec) : le signal d’annulation lui parvient, il écrit ses relevés', () => {
    const workflow = readFileSync(resolve(process.cwd(), '.github/workflows/charge-visio.yml'), 'utf-8')
    expect(workflow).toMatch(/run: exec node outils\/participant\.mjs /)
  })

  // Plan à 3 runners : l'enseignant seul, puis 9 élèves, 5 par runner.
  const avec = (runner, extra, tS = [10, 15]) => ({ runner, participants: [{ numero: runner, echantillons: tS.map((t) => ({ tS: t })) }], ...extra })

  it('le relevé se dit complet, partiel (annulé à T+x s, ou interrompu sans signal) ou absent : il ne fait pas échouer le rapport', () => {
    expect(etatDuReleve(PLAN, [])).toBe('aucun relevé')
    expect(etatDuReleve({ ...PLAN, paliers: [5, 10] }, [0, 1, 2].map((r) => avec(r, { termine: true })))).toBe('complet')
    expect(etatDuReleve({ ...PLAN, paliers: [5, 10] }, [169, 170, 171].map((tS, r) => avec(r, { termine: false, arret: { signal: 'SIGINT', tS } }))))
      .toBe('relevé partiel (annulé à T+169 s)')
    expect(etatDuReleve({ ...PLAN, paliers: [5, 10] }, [avec(0, { termine: false, arret: null }, [5, 140])]))
      .toBe('relevé partiel (interrompu sans signal ; dernier relevé : T+140 s) ; 2 runner(s) sur 3 sans relevé')
    expect(etatDuReleve({ ...PLAN, paliers: [5, 10] }, [avec(0, { termine: true })])).toBe('relevé partiel (interrompu sans signal ; dernier relevé : T+15 s) ; 2 runner(s) sur 3 sans relevé')
    expect(lignesDuRapport(PLAN, [])).toContain('Relevé : aucun relevé.')
  })

  it('les sorties des runners : un dossier absent n’en donne aucune, un fichier temporaire (écriture interrompue) est ignoré', () => {
    const dossier = mkdtempSync(join(tmpdir(), 'charge-1232-'))
    expect(lireRunners(join(dossier, 'absent'))).toEqual([])
    mkdirSync(join(dossier, 'charge-runner-1'))
    mkdirSync(join(dossier, 'charge-runner-0'))
    writeFileSync(join(dossier, 'charge-runner-1', 'runner-1.json'), JSON.stringify({ runner: 1, participants: [] }))
    writeFileSync(join(dossier, 'charge-runner-0', 'runner-0.json'), JSON.stringify({ runner: 0, participants: [] }))
    writeFileSync(join(dossier, 'charge-runner-0', 'runner-0.json.tmp'), '{"runner": 0, "partic')
    expect(lireRunners(dossier).map((r) => r.runner)).toEqual([0, 1])
  })
})

describe('#1232 — la capture locale (essai 3 : entrés, ICE établi, aucune piste publiée, rien ne part)', () => {
  const JETON = 'eyJhbGciOiJIUzI1NiJ9.fictif.signature'

  it('le journal ne garde que ce qui parle de la capture, sans jamais un jeton, même coupé par la troncature', () => {
    const journal = []
    noterConsole(journal, 'error', `getUserMedia failed: NotFoundError https://visio.test/salle?jwt=${JETON}#x`, [JETON])
    noterConsole(journal, 'log', 'getUserMedia ok', [JETON])
    noterConsole(journal, 'error', 'XMPP ping timeout', [JETON])
    // La troncature tomberait AU MILIEU du jeton (12 de ses caractères) : masqué d'abord, il disparaît en entier.
    const avant = `${'x'.repeat(LONGUEUR_MAX - 20)} device `
    noterConsole(journal, 'warning', `${avant}${JETON}`, [JETON])
    expect(journal).toHaveLength(2)
    expect(journal[0]).toBe('error : getUserMedia failed: NotFoundError https://visio.test/salle?jwt=***#x')
    expect(journal[1]).toBe(`warning : ${avant}***`)
    expect(journal.join('')).not.toMatch(/eyJ|fictif|signature/)
    expect(masquer('a?jwt=abc.def&b=1', [])).toBe('a?jwt=***&b=1')
    for (let i = 0; i < MESSAGES_MAX + 5; i++) noterConsole(journal, 'error', 'camera busy', [])
    expect(journal).toHaveLength(MESSAGES_MAX)
  })

  it('le journal garde l’avertissement de Jitsi qui coupe la capture initiale (essai 4 : il était filtré)', () => {
    const journal = []
    noterConsole(journal, 'warning', '[app:base-config] Using prejoinConfig.enabled config URL overwrite implies starting without media.', [])
    expect(journal).toEqual(['warning : [app:base-config] Using prejoinConfig.enabled config URL overwrite implies starting without media.'])
  })

  it('par participant : le getUserMedia direct (obtenu ou refusé), les périphériques, les pistes et coupures de l’application, le journal', () => {
    const runners = [{ runner: 0, navigateur: 'chromium-headless-shell 140', participants: [
      { numero: 1, role: 'eleve', capture: { userAgent: 'HeadlessChrome/140', peripheriques: ['audioinput', 'videoinput'], gum: { ok: false, nom: 'NotReadableError', message: 'Could not start video source' } },
        journalCapture: ['error : createLocalTracks failed'], echantillons: [{ redux: { pistes: [], media: { audioCoupe: true, videoCoupe: 1 } } }] },
      { numero: 0, role: 'enseignant', capture: { userAgent: 'HeadlessChrome/140', peripheriques: [], gum: { ok: true, pistes: [{ kind: 'audio', label: 'Fake Audio' }] } },
        echantillons: [{ redux: null }, { redux: { pistes: [{ type: 'audio', muette: false }], media: { audioCoupe: false, videoCoupe: 0 } } }] },
    ] }]
    expect(diagnosticsCapture(runners)).toEqual([
      '- runner 0 : navigateur chromium-headless-shell 140 ; agent HeadlessChrome/140',
      '- participant 0 (enseignant) : getUserMedia direct obtenu (audio « Fake Audio ») ; périphériques aucune ; pistes de l’application audio ; coupure audio false, vidéo 0',
      '- participant 1 (eleve) : getUserMedia direct refusé (NotReadableError : Could not start video source) ; périphériques audioinput, videoinput ; pistes de l’application aucune ; coupure audio true, vidéo 1',
      '  - error : createLocalTracks failed',
    ])
    expect(diagnosticsCapture([])).toEqual(['- aucun relevé'])
    // Essai 4 : la version de Jitsi servie, son verdict sur la capture initiale, la page d'accueil, puis le geste.
    const enseignant = runners[0].participants[1]
    enseignant.capture.jitsi = { bundle: '9365', lib: 'edf33a3b', navigateur: 'chrome', versionNavigateur: '158.0.8127.18', supporte: true, disableInitialGUM: true, prejoin: false }
    enseignant.prejoin = 'absente'
    enseignant.geste = { pistesAvant: [], boutons: { micro: { trouve: true, avant: 'true', clic: true, erreur: null, apres: 'false' }, camera: { trouve: false } }, pistesApres: [{ type: 'audio', muette: false }] }
    expect(diagnosticsCapture(runners).slice(1, 4)).toEqual([
      '- participant 0 (enseignant) : getUserMedia direct obtenu (audio « Fake Audio ») ; périphériques aucune ; pistes de l’application audio ; coupure audio false, vidéo 0',
      '  - jitsi : bundle v=9365, lib-jitsi-meet edf33a3b ; navigateur chrome 158.0.8127.18 (supporté true) ; disableInitialGUM true ; prejoin configuré false ; page d’accueil absente',
      '  - geste : pistes avant aucune ; micro cliqué (aria-pressed true → false) ; camera introuvable ; pistes après audio',
    ])
    expect(lignesDuRapport(PLAN, runners)).toContain('## Capture locale (getUserMedia direct, état de l’application)')
  })
})
