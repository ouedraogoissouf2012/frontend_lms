// #1232, essai 4 : aucune piste locale ; cause lue dans le bundle servi (surcharge prejoin par l'URL = démarrer sans
// média). L'enseignant allume micro et caméra comme un humain, par les boutons ; rien n'est forcé par l'API.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  ATTENTE_EFFET_MS, BOUTONS, PREJOIN, allumerMicroEtCamera, doitCliquer, ligneGeste, pistesDuStore,
} from '../../e2e/charge-visio/geste.mjs'

/** Une page factice : des boutons (aria-pressed), un store, et le journal de ce que l'outil a fait. */
function pageFactice(boutons) {
  const faits = []
  const pistes = []
  window.APP = { store: { getState: () => ({ 'features/base/tracks': [...pistes] }) } }
  const bouton = (selecteur) => ({
    getAttribute: async (nom) => (nom === 'aria-pressed' ? boutons[selecteur] : null),
    click: async () => {
      faits.push(`clic ${selecteur}`)
      boutons[selecteur] = 'false'
      pistes.push({ local: true, mediaType: selecteur === BOUTONS.micro ? 'audio' : 'video', muted: false })
    },
  })
  return {
    faits,
    mouse: { move: async (x, y) => faits.push(`survol ${x},${y}`) },
    locator: (selecteur) => ({ count: async () => (selecteur in boutons ? 1 : 0), first: () => bouton(selecteur) }),
    evaluate: async (fn) => fn(),
    waitForTimeout: async (ms) => faits.push(`attente ${ms}`),
  }
}

afterEach(() => { delete window.APP })

describe('#1232 — le geste de l’enseignant (essai 4)', () => {
  it('les sélecteurs sont ceux du DOM servi, sans dépendre de la langue', () => {
    expect(BOUTONS).toEqual({ micro: '.audio-preview .toolbox-button', camera: '.video-preview .toolbox-button' })
    expect(PREJOIN).toEqual({ ecran: '[data-testid="prejoin.screen"]', rejoindre: '[data-testid="prejoin.joinMeeting"]' })
    expect(Object.values(BOUTONS).join(' ')).not.toMatch(/aria-label/)
  })

  it('seul un appareil coupé se clique : cliquer un appareil actif le couperait', () => {
    expect(doitCliquer('true')).toBe(true)
    expect(doitCliquer('false')).toBe(false)
    expect(doitCliquer(null)).toBe(false)
  })

  it('survol, puis clic sur le micro coupé seulement ; les pistes avant et après sont relevées', async () => {
    const page = pageFactice({ [BOUTONS.micro]: 'true', [BOUTONS.camera]: 'false' })
    const geste = await allumerMicroEtCamera(page)
    expect(page.faits).toEqual(['survol 320,180', `clic ${BOUTONS.micro}`, `attente ${ATTENTE_EFFET_MS}`])
    expect(geste).toEqual({
      pistesAvant: [],
      boutons: {
        micro: { trouve: true, avant: 'true', clic: true, erreur: null, apres: 'false' },
        camera: { trouve: true, avant: 'false', clic: false, erreur: null, apres: 'false' },
      },
      pistesApres: [{ type: 'audio', muette: false }],
    })
  })

  it('un bouton introuvable est DIT, sans repli sur l’API de l’application', async () => {
    const page = pageFactice({})
    const geste = await allumerMicroEtCamera(page)
    expect(geste.boutons).toEqual({ micro: { trouve: false }, camera: { trouve: false } })
    expect(page.faits.filter((f) => f.startsWith('clic'))).toEqual([])
    expect(ligneGeste(geste)).toBe('geste : pistes avant aucune ; micro introuvable ; camera introuvable ; pistes après aucune')
  })

  it('le store se lit sans y écrire ; sans store, rien n’est inventé', () => {
    expect(pistesDuStore()).toBeNull()
    window.APP = { store: { getState: () => ({ 'features/base/tracks': [{ local: false, mediaType: 'audio' }, { local: true, mediaType: 'video', muted: true }] }) } }
    expect(pistesDuStore()).toEqual([{ type: 'video', muette: true }])
  })

  it('la ligne du relevé : clic en échec, déjà actif, aucun geste', () => {
    expect(ligneGeste(null)).toBe('geste : aucun')
    expect(ligneGeste({ pistesAvant: null, pistesApres: [{ type: 'video', muette: true }], boutons: {
      micro: { trouve: true, avant: 'true', clic: true, erreur: 'Timeout 5000ms exceeded.', apres: 'true' },
      camera: { trouve: true, avant: 'false', clic: false, erreur: null, apres: 'false' },
    } })).toBe('geste : pistes avant — ; micro clic en échec (Timeout 5000ms exceeded.) (aria-pressed true → true) ; camera déjà actif, non cliqué (aria-pressed false → false) ; pistes après video (muette)')
  })

  it('participant.mjs : le diagnostic d’abord, puis le geste, pour l’enseignant seulement, sans API de l’application', () => {
    const source = readFileSync(resolve(process.cwd(), 'e2e/charge-visio/participant.mjs'), 'utf-8')
    const diagnostic = source.indexOf('page.evaluate(sonderCapture)')
    const geste = source.indexOf('allumerMicroEtCamera(page)')
    expect(diagnostic).toBeGreaterThan(-1)
    expect(geste).toBeGreaterThan(diagnostic)
    expect(source).toMatch(/p\.role === 'enseignant'[^\n]*\n?[^\n]*allumerMicroEtCamera\(page\)/)
    expect(source).not.toMatch(/muteAudio|muteVideo|createLocalTracks|store\.dispatch/)
  })
})
