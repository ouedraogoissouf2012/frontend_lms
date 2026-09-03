// @vitest-environment node
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Gardes anti-régression de la salle embarquée (#673).
 *
 * ## Pourquoi des gardes de source, et non des tests de comportement
 *
 * Les trois propriétés ci-dessous ne se prouvent pas en exerçant du code :
 * elles affirment l'ABSENCE de quelque chose. Un test de comportement ne peut
 * pas constater qu'un mécanisme retiré n'est pas revenu — seule une lecture du
 * source le peut.
 *
 * Ce que #673 a supprimé, et qui ne doit pas réapparaître :
 *
 *  1. `window.open` — la salle était ouverte dans un onglet séparé, avec sa
 *     panne « popups bloquées » ;
 *  2. la surveillance de cette fenêtre — `visioWindow.closed` sondé chaque
 *     seconde et `location.href` lu dans un `catch` qui avalait les erreurs
 *     CORS, ce qui confondait fermeture, navigation et blocage ;
 *  3. le jeton d'accès dans l'URL — donc dans l'historique du navigateur et
 *     dans les journaux d'accès du serveur Jitsi.
 */

const SRC = fileURLToPath(new URL('../../src', import.meta.url))

/**
 * `useAdminVisio.js` ouvre encore une salle par `window.open`, et SANS jeton :
 * ce chemin est cassé depuis la mise en service du serveur authentifié
 * (`ENABLE_AUTH=1`). Le router vers le store serait FAUX — il manipule des
 * identifiants KLASSCI là où `join` attend une clé primaire locale, et `join`
 * écrit une présence : on la poserait sur la mauvaise séance.
 *
 * L'exemption est donc explicite et tracée, jamais silencieuse.
 *
 * @see https://github.com/ouedraogoissouf2012/frontend_lms/issues/310
 */
const EXEMPTIONS_TRACEES = new Set(['composables/useAdminVisio.js'])

/** Chemins visio, hors tests : le périmètre exact de #673. */
function fichiersVisio() {
  const trouves = []

  const parcourir = (dossier) => {
    for (const entree of readdirSync(dossier)) {
      const chemin = join(dossier, entree)
      if (statSync(chemin).isDirectory()) {
        if (entree !== '__tests__') parcourir(chemin)
        continue
      }
      if (!/\.(js|vue)$/.test(entree)) continue

      const relatif = relative(SRC, chemin).replace(/\\/g, '/')
      if (/visio/i.test(relatif) || /Visio/.test(entree)) trouves.push(relatif)
    }
  }

  parcourir(SRC)
  return trouves
}

const FICHIERS = fichiersVisio().filter((f) => !EXEMPTIONS_TRACEES.has(f))

function contenu(relatif) {
  return readFileSync(join(SRC, relatif), 'utf8')
}

/**
 * Le CODE seul, commentaires retirés.
 *
 * Une garde qui interdirait de *mentionner* un mécanisme supprimé pousserait à
 * effacer les commentaires qui expliquent POURQUOI il a été retiré — soit à
 * détruire la mémoire du dépôt pour faire passer un test. Ce qui doit être
 * absent, c'est l'appel, pas son explication.
 */
function code(relatif) {
  return contenu(relatif)
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/(^|[^:'"`])\/\/.*$/gm, '$1')
}

describe('salle embarquée — gardes anti-régression (#673)', () => {
  it('G0 — le périmètre analysé n\'est pas vide', () => {
    // Sans cette vérification, une erreur de chemin rendrait TOUTES les gardes
    // ci-dessous vertes en n'inspectant aucun fichier — un faux vert parfait.
    expect(FICHIERS.length).toBeGreaterThan(5)
    expect(FICHIERS).toContain('stores/visio.js')
    expect(FICHIERS).toContain('components/visio/VisioRoom.vue')
  })

  it('G1 — aucun `window.open` dans le parcours visio', () => {
    const coupables = FICHIERS.filter((f) => /window\.open\s*\(/.test(code(f)))

    expect(coupables).toEqual([])
  })

  it('G2 — aucune surveillance de fenêtre externe', () => {
    const coupables = FICHIERS.filter((f) => {
      const source = code(f)
      return /\bwatchVisioWindow\b/.test(source)
        || /\bvisioWindow\b/.test(source)
        || /\.closed\b/.test(source)
    })

    expect(coupables).toEqual([])
  })

  /**
   * Le jeton part désormais en option de l'IFrame API. Reconstruire un `?jwt=`
   * le remettrait dans la barre d'adresse, l'historique du navigateur et les
   * journaux d'accès Jitsi — le compromis que #673 a précisément supprimé.
   *
   * `buildJitsiUrl` reste la seule exception : elle sert encore au chemin admin
   * exempté ci-dessus, et ses propres tests figent son comportement.
   */
  it('G3 — aucun jeton reconstruit dans une URL de navigation', () => {
    const coupables = FICHIERS
      .filter((f) => f !== 'constants/visio.js')
      .filter((f) => /jwt=/.test(code(f)))

    expect(coupables).toEqual([])
  })

  it('G4 — la salle est montée à la racine, hors de <router-view>', () => {
    const app = readFileSync(join(SRC, 'App.vue'), 'utf8')

    expect(app).toContain('VisioRoom')
    // Hors de <router-view> : c'est ce qui fait survivre la salle à la
    // navigation interne, propriété que l'onglet séparé apportait.
    const apresRouterView = app.slice(app.indexOf('<router-view'))
    expect(apresRouterView).toContain('<VisioRoom />')
  })

  /**
   * Le miroir est la correction de FOND de #673 : sans lui, un enregistrement
   * lancé depuis le bouton natif de Jitsi produit une vidéo que le LMS refuse
   * en 404. Le retirer ramènerait ce défaut sans qu'aucun test de comportement
   * ne s'en aperçoive.
   */
  it('G5 — la salle observe l\'état d\'enregistrement du fournisseur', () => {
    const salle = contenu('components/visio/VisioRoom.vue')

    expect(salle).toContain('recordingStatusChanged')
    expect(salle).toContain('useVisioRecordingMirror')
  })

  it('G6 — les contrôles n\'appellent plus le backend en direct', () => {
    const controles = code('composables/useVisioRecordingControls.js')

    expect(controles).not.toMatch(/lmsService\.(start|stop)VisioRecording/)
    expect(controles).toContain('startRoomRecording')
    expect(controles).toContain('stopRoomRecording')
  })
})
