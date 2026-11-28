// #1232, test 1 : chaque élève recevait la vidéo de l'enseignant en 180 p (débit reçu 68 kb/s). Jitsi passe seul en
// mosaïque dès 3 participants (bundle servi v=9365) : chaque vignette est petite, le pont envoie la couche basse. Un
// vrai élève regarde l'enseignant en grand : l'option « scène » du plan le fait par l'interface (le raccourci « w »,
// « Activer / désactiver la mosaïque »), jamais par l'API de l'application.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  APPUIS_SCENE_MAX, ATTENTE_SCENE_MS, TOUCHE_MOSAIQUE, VIEWPORT, VIEWPORT_SCENE, doitAppuyer, ligneScene, mosaiqueChoisie, passerEnScene,
} from '../../e2e/charge-visio/scene.mjs'
import { diagnosticsCapture } from '../../e2e/charge-visio/capture.mjs'

/**
 * Une page factice qui se comporte comme Jitsi : la mosaïque est choisie (true/false) ou automatique (affichée dès 3
 * participants) ; la touche bascule l'AFFICHAGE courant et rend le choix explicite.
 */
function pageFactice({ choisie, participants, touche = true }) {
  const faits = []
  const etat = { choisie }
  window.APP = { store: { getState: () => ({ 'features/video-layout': { tileViewEnabled: etat.choisie } }) } }
  return {
    faits,
    keyboard: { press: async (k) => {
      faits.push(`touche ${k}`)
      if (touche) etat.choisie = !(etat.choisie ?? participants >= 3)
    } },
    evaluate: async (fn) => fn(),
    waitForTimeout: async (ms) => faits.push(`attente ${ms}`),
  }
}

afterEach(() => { delete window.APP })

describe('#1232, test 1 — l’élève met l’enseignant en grand (« scène »)', () => {
  it('la touche est le raccourci de Jitsi pour la mosaïque ; la fenêtre de la scène est celle d’un écran d’élève', () => {
    expect(TOUCHE_MOSAIQUE).toBe('w')
    expect(APPUIS_SCENE_MAX).toBe(2)
    expect(VIEWPORT).toEqual({ width: 640, height: 360 })
    expect(VIEWPORT_SCENE).toEqual({ width: 1280, height: 720 })
  })

  it('la disposition se LIT dans le store : choisie, refusée, automatique, ou illisible', () => {
    expect(mosaiqueChoisie()).toBeNull()
    window.APP = { store: { getState: () => ({ 'features/video-layout': {} }) } }
    expect(mosaiqueChoisie()).toBe('auto')
    window.APP = { store: { getState: () => ({ 'features/video-layout': { tileViewEnabled: false } }) } }
    expect(mosaiqueChoisie()).toBe(false)
    expect([true, 'auto', false, null].map(doitAppuyer)).toEqual([true, true, false, false])
  })

  it('mosaïque automatique, affichée (≥ 3 participants) : un appui, puis la mosaïque est refusée', async () => {
    const page = pageFactice({ choisie: undefined, participants: 20 })
    expect(await passerEnScene(page)).toEqual({ avant: 'auto', appuis: 1, apres: false })
    expect(page.faits).toEqual(['touche w', `attente ${ATTENTE_SCENE_MS}`])
  })

  it('mosaïque automatique, pas encore affichée (< 3) : le premier appui l’active, le second la refuse', async () => {
    expect(await passerEnScene(pageFactice({ choisie: undefined, participants: 2 }))).toEqual({ avant: 'auto', appuis: 2, apres: false })
  })

  it('déjà refusée : aucun appui ; store illisible : aucun appui, et c’est dit', async () => {
    const page = pageFactice({ choisie: false, participants: 20 })
    expect(await passerEnScene(page)).toEqual({ avant: false, appuis: 0, apres: false })
    expect(page.faits).toEqual([])
    const sansStore = { ...pageFactice({ choisie: undefined, participants: 20 }), evaluate: async () => null }
    expect(await passerEnScene(sansStore)).toEqual({ avant: null, appuis: 0, apres: null })
  })

  it('une touche sans effet : deux appuis au plus, puis l’échec est DIT, sans repli sur l’API', async () => {
    const scene = await passerEnScene(pageFactice({ choisie: undefined, participants: 20, touche: false }))
    expect(scene).toEqual({ avant: 'auto', appuis: 2, apres: 'auto' })
    expect(ligneScene(scene)).toBe('scène : mosaïque automatique avant ; 2 appui(s) sur « w » ; mosaïque automatique après : scène NON obtenue')
  })

  it('la ligne du diagnostic : obtenue, aucune, erreur de l’outil', () => {
    expect(ligneScene({ avant: 'auto', appuis: 1, apres: false })).toBe('scène : mosaïque automatique avant ; 1 appui(s) sur « w » ; mosaïque refusée après')
    expect(ligneScene(null)).toBe('scène : aucune')
    expect(ligneScene({ erreurOutil: 'Target closed' })).toBe('scène : erreur de l’outil (Target closed)')
    const runners = [{ runner: 1, participants: [{ numero: 1, role: 'eleve', scene: { avant: 'auto', appuis: 1, apres: false }, echantillons: [] }] }]
    expect(diagnosticsCapture(runners)).toContain('  - scène : mosaïque automatique avant ; 1 appui(s) sur « w » ; mosaïque refusée après')
  })

  it('participant.mjs : la scène pour les élèves si le plan la demande, après le diagnostic ; la hauteur reçue relevée', () => {
    const source = readFileSync(resolve(process.cwd(), 'e2e/charge-visio/participant.mjs'), 'utf-8')
    expect(source).toMatch(/viewport: plan\.scene \? VIEWPORT_SCENE : VIEWPORT/)
    expect(source).toMatch(/plan\.scene && p\.role === 'eleve'[^\n]*\n?[^\n]*passerEnScene\(page\)/)
    expect(source.indexOf('passerEnScene(page)')).toBeGreaterThan(source.indexOf('page.evaluate(sonderCapture)'))
    expect(source).toMatch(/r\.frameHeight/)
    expect(source).toMatch(/hauteurVideoRecue: brut\.hauteurVideoRecue \?\? null/)
    expect(source).not.toMatch(/setTileView|toggleTileView|store\.dispatch|executeCommand/)
  })
})
