// @vitest-environment node
/** #652 — l'outil E2E du tableau des institutions (e2e/parcours-institutions.mjs) : jugement pur, deux largeurs. */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { DONNEES_INSTITUTIONS, ETAPES_INSTITUTIONS, jugerActions } from '../../e2e/parcours-institutions.mjs'

const bouton = (titre, gauche, droite, recoitLeClic = true) => ({ titre, gauche, droite, recoitLeClic })
const mesure = (boutons, fenetre = 1366, cadre = { gauche: 300, droite: 1330 }) => ({ fenetre, cadre, boutons })
const OK = [bouton('Modifier', 1180, 1216), bouton('Desactiver', 1220, 1256), bouton('Tester la connexion API', 1260, 1296)]

describe('#652 — juger la colonne Actions', () => {
  it('trois boutons entiers et cliquables, en clair et en sombre : confirmé', () => {
    expect(jugerActions({ clair: mesure(OK), sombre: mesure(OK) })).toMatchObject({ confirme: true })
  })

  it.each([
    ['coupé par le cadre (le défaut de #652)', [bouton('Tester la connexion API', 1310, 1346)], /coupé par le cadre/],
    ['hors de la fenêtre', [bouton('Tester la connexion API', 1350, 1386)], /déborde de la fenêtre/],
    ['masqué au clic', [bouton('Modifier', 1180, 1216, false)], /ne reçoit pas le clic/],
    ['aucun bouton', [], /aucun bouton/],
  ])('%s : écart', (_, boutons, motif) => {
    const r = jugerActions({ clair: mesure(boutons), sombre: mesure(OK) })
    expect(r.confirme).toBe(false)
    expect(r.ecart).toMatch(motif)
  })

  it('les deux largeurs de l’issue, 1366 et 1920 px, une étape chacune', () => {
    expect(DONNEES_INSTITUTIONS.largeurs).toEqual([1366, 1920])
    expect(ETAPES_INSTITUTIONS.map((e) => e.cle)).toEqual(['largeur-1366', 'largeur-1920'])
  })

  it('le registre des parcours fonctionnels joue cette fonction, avec le dossier de sortie', () => {
    const registre = readFileSync(resolve(process.cwd(), 'e2e/parcours-fonctionnels.mjs'), 'utf8')
    expect(registre).toContain("import { ETAPES_INSTITUTIONS, DONNEES_INSTITUTIONS } from './parcours-institutions.mjs'")
    expect(registre).toMatch(/const ctx = \{ pages, base: BASE, sortie, jeu,/)
  })
})
